import type { Phase, TrafficMetrics, ControllerDecision } from '../types/traffic';
import { getNextPhase, getPhaseDuration, DEFAULT_CONFIG, type SignalStateMachineConfig } from './TrafficSignalStateMachine';

// Prototype bounds: chosen to keep the demonstration observable and starvation-free.
export const MIN_GREEN = 8;
export const MAX_GREEN = 30;
export const GREEN_RANGE = MAX_GREEN - MIN_GREEN;
export const DEMAND_EPSILON = 0.0001;

export interface GreenAllocation { greenA: number; greenB: number; shareA: number; shareB: number }
export interface ControllerState { phase: Phase; phaseTimeRemaining: number; greenA: number; greenB: number; decision: ControllerDecision }

const clamp = (value: number) => Math.min(MAX_GREEN, Math.max(MIN_GREEN, value));

/**
 * Traffic-responsive proportional split. The allocation uses the arrival rates
 * supplied by the active traffic source and is committed only when a new green
 * phase begins.
 */
export function calculateGreenAllocation(arrivalRateA: number, arrivalRateB: number): GreenAllocation {
  const qA = Math.max(0, arrivalRateA);
  const qB = Math.max(0, arrivalRateB);
  const total = qA + qB;
  if (total <= DEMAND_EPSILON) return { greenA: MIN_GREEN, greenB: MIN_GREEN, shareA: 0, shareB: 0 };
  const shareA = qA / total;
  const shareB = qB / total;
  return {
    greenA: clamp(MIN_GREEN + GREEN_RANGE * shareA),
    greenB: clamp(MIN_GREEN + GREEN_RANGE * shareB),
    shareA,
    shareB,
  };
}

function decisionReason(qA: number, qB: number): string {
  if (qA + qB <= DEMAND_EPSILON) return 'Sin demanda medida. Se aplica verde mínimo.';
  if (qA === qB) return 'Demanda equilibrada.';
  return qA > qB ? 'Priorizando Avenida A.' : 'Priorizando Avenida B.';
}

export class AdaptiveTrafficController {
  private cfg: SignalStateMachineConfig = DEFAULT_CONFIG;
  private state: ControllerState;

  constructor(initialPhase: Phase = 'A_GREEN') {
    const allocation = calculateGreenAllocation(0, 0);
    this.state = {
      phase: initialPhase,
      phaseTimeRemaining: getPhaseDuration(initialPhase, allocation.greenA, allocation.greenB, this.cfg),
      greenA: allocation.greenA,
      greenB: allocation.greenB,
      decision: { priorityAvenue: 'BALANCED', nextGreenA: allocation.greenA, nextGreenB: allocation.greenB, demandA: 0, demandB: 0, reason: 'Inicializando control adaptativo.' },
    };
  }

  getState(): Readonly<ControllerState> { return this.state; }

  tick(dt: number, metricsA: TrafficMetrics, metricsB: TrafficMetrics): void {
    this.state.phaseTimeRemaining -= dt;
    if (this.state.phaseTimeRemaining <= 0) this.advancePhase(metricsA, metricsB);
  }

  private advancePhase(metricsA: TrafficMetrics, metricsB: TrafficMetrics): void {
    const nextPhase = getNextPhase(this.state.phase);
    // Allocation is prepared only as a new green phase begins; an active green is never resized.
    if (nextPhase === 'A_GREEN' || nextPhase === 'B_GREEN') {
      const allocation = calculateGreenAllocation(metricsA.arrivalRate, metricsB.arrivalRate);
      this.state.greenA = allocation.greenA;
      this.state.greenB = allocation.greenB;
      const priority = allocation.shareA === allocation.shareB ? 'BALANCED' : allocation.shareA > allocation.shareB ? 'A' : 'B';
      this.state.decision = {
        priorityAvenue: priority,
        nextGreenA: allocation.greenA,
        nextGreenB: allocation.greenB,
        demandA: allocation.shareA,
        demandB: allocation.shareB,
        reason: decisionReason(metricsA.arrivalRate, metricsB.arrivalRate),
      };
    }
    this.state.phase = nextPhase;
    this.state.phaseTimeRemaining = getPhaseDuration(nextPhase, this.state.greenA, this.state.greenB, this.cfg);
  }
}
