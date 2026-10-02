// Simulation demand provider. It supplies only target arrival demand;
// observed metrics are measured later by TrafficSimulation from real spawns.

import type { TrafficProvider } from './TrafficProvider';
import type { TrafficMetrics, TrafficLevel } from '../types/traffic';

interface LevelConfig { targetArrivalRate: number }

export const LEVEL_CONFIGS: Record<TrafficLevel, LevelConfig> = {
  LOW: { targetArrivalRate: 6 },      // 4–8 veh/min
  MEDIUM: { targetArrivalRate: 16 },  // 12–20 veh/min
  HIGH: { targetArrivalRate: 38 },    // 30–45 veh/min
};

function smoothDemandVariation(seed: number, time: number, baseRate: number): number {
  // Small, slow variation preserves the preset's long-run target while avoiding perfectly uniform arrivals.
  return Math.sin(time * 0.12 + seed) * baseRate * 0.06;
}

interface AvenueState { level: TrafficLevel; seed: number; time: number }

export class MockTrafficProvider implements TrafficProvider {
  private states: Record<'A' | 'B', AvenueState> = {
    A: { level: 'HIGH', seed: 1.234, time: 0 },
    B: { level: 'LOW', seed: 7.891, time: 0 },
  };

  setLevel(avenue: 'A' | 'B', level: TrafficLevel): void { this.states[avenue].level = level; }
  tick(dt: number): void { this.states.A.time += dt; this.states.B.time += dt; }

  getMetrics(avenue: 'A' | 'B'): TrafficMetrics {
    const state = this.states[avenue];
    const baseRate = LEVEL_CONFIGS[state.level].targetArrivalRate;
    const targetArrivalRate = Math.max(0.1, baseRate + smoothDemandVariation(state.seed, state.time, baseRate));
    return {
      timestamp: Date.now(),
      targetArrivalRate,
      vehiclesInZone: 0,
      arrivalRate: 0,
      normalizedDensity: 0,
      stoppedRatio: 0,
      congestionIndex: 0,
    };
  }
}
