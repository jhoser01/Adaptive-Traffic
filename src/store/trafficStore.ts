// ============================================================
// GLOBAL TRAFFIC STORE (Zustand)
// Single source of truth for all simulation state
// ============================================================

import { create } from 'zustand';
import type {
  TrafficMetrics,
  Phase,
  SignalColor,
  ControllerDecision,
  SimulationConfig,
  TrafficLevel,
  DataSource,
  CongestionSnapshot,
  QueueSnapshot,
} from '../types/traffic';
import type { VehicleAgent } from '../simulation/VehicleAgent';

const HISTORY_MAX_SECONDS = 60;

function trimHistory<T extends { time: number }>(arr: T[], simTime: number): T[] {
  const cutoff = simTime - HISTORY_MAX_SECONDS;
  return arr.filter((d) => d.time >= cutoff);
}

interface TrafficStore {
  // --- Metrics ---
  metricsA: TrafficMetrics;
  metricsB: TrafficMetrics;

  // --- Queues ---
  queueA: number;
  queueB: number;

  // --- Signals ---
  signalA: SignalColor;
  signalB: SignalColor;

  // --- Phase ---
  phase: Phase;
  phaseTimeRemaining: number;
  greenAllocatedA: number;
  greenAllocatedB: number;

  // --- AI Decision ---
  decision: ControllerDecision;

  // --- Vehicles ---
  vehicles: VehicleAgent[];

  // --- History ---
  congestionHistory: CongestionSnapshot[];
  queueHistory: QueueSnapshot[];
  arrivalBinsA: number[];
  arrivalBinsB: number[];

  // --- Simulation time ---
  simulationTime: number;

  // --- Config ---
  config: SimulationConfig;
  dataSource: DataSource;
  videoSimulationStarted: boolean;

  // --- Actions ---
  setMetrics: (a: TrafficMetrics, b: TrafficMetrics) => void;
  setQueues: (qA: number, qB: number) => void;
  setSignals: (sA: SignalColor, sB: SignalColor) => void;
  setPhase: (phase: Phase, remaining: number) => void;
  setGreenAllocated: (gA: number, gB: number) => void;
  setDecision: (d: ControllerDecision) => void;
  setVehicles: (v: VehicleAgent[]) => void;
  setArrivalBins: (a: number[], b: number[]) => void;
  advanceSimTime: (dt: number) => void;
  pushHistory: () => void;
  setConfig: (partial: Partial<SimulationConfig>) => void;
  setLevelA: (level: TrafficLevel) => void;
  setLevelB: (level: TrafficLevel) => void;
  setDataSource: (ds: DataSource) => void;
  setVideoSimulationStarted: (started: boolean) => void;
  resetSimulation: () => void;
}

const defaultMetrics: TrafficMetrics = {
  timestamp: 0,
  vehiclesInZone: 0,
  targetArrivalRate: 0,
  arrivalRate: 0,
  normalizedDensity: 0,
  stoppedRatio: 0,
  congestionIndex: 0,
};

const defaultDecision: ControllerDecision = {
  priorityAvenue: 'A',
  nextGreenA: 15,
  nextGreenB: 8,
  demandA: 0,
  demandB: 0,
  reason: 'Inicializando control adaptativo.',
};

export const useTrafficStore = create<TrafficStore>((set, get) => ({
  metricsA: defaultMetrics,
  metricsB: defaultMetrics,
  queueA: 0,
  queueB: 0,
  signalA: 'GREEN',
  signalB: 'RED',
  phase: 'A_GREEN',
  phaseTimeRemaining: 15,
  greenAllocatedA: 15,
  greenAllocatedB: 8,
  decision: defaultDecision,
  vehicles: [],
  congestionHistory: [],
  queueHistory: [],
  arrivalBinsA: Array(12).fill(0),
  arrivalBinsB: Array(12).fill(0),
  simulationTime: 0,
  config: {
    levelA: 'HIGH',
    levelB: 'LOW',
    speed: 1,
    running: true,
  },
  dataSource: 'SIMULATION',
  videoSimulationStarted: false,

  setMetrics: (a, b) => set({ metricsA: a, metricsB: b }),
  setQueues: (qA, qB) => set({ queueA: qA, queueB: qB }),
  setSignals: (sA, sB) => set({ signalA: sA, signalB: sB }),
  setPhase: (phase, remaining) =>
    set({ phase, phaseTimeRemaining: remaining }),
  setGreenAllocated: (gA, gB) =>
    set({ greenAllocatedA: gA, greenAllocatedB: gB }),
  setDecision: (d) => set({ decision: d }),
  setVehicles: (v) => set({ vehicles: v }),
  setArrivalBins: (a, b) => set({ arrivalBinsA: a, arrivalBinsB: b }),
  advanceSimTime: (dt) =>
    set((s) => ({ simulationTime: s.simulationTime + dt })),
  pushHistory: () => {
    const s = get();
    const t = s.simulationTime;
    const newCongestion = trimHistory(
      [
        ...s.congestionHistory,
        { time: t, congestionA: s.metricsA.congestionIndex, congestionB: s.metricsB.congestionIndex },
      ],
      t
    );
    const newQueue = trimHistory(
      [...s.queueHistory, { time: t, queueA: s.queueA, queueB: s.queueB }],
      t
    );
    set({ congestionHistory: newCongestion, queueHistory: newQueue });
  },
  setConfig: (partial) =>
    set((s) => ({ config: { ...s.config, ...partial } })),
  setLevelA: (level) =>
    set((s) => ({ config: { ...s.config, levelA: level } })),
  setLevelB: (level) =>
    set((s) => ({ config: { ...s.config, levelB: level } })),
  setDataSource: (ds) => set(() => ds === 'VIDEO_AI'
    ? { dataSource: ds, videoSimulationStarted: false, metricsA: defaultMetrics, metricsB: defaultMetrics, queueA: 0, queueB: 0, vehicles: [], congestionHistory: [], queueHistory: [], arrivalBinsA: Array(12).fill(0), arrivalBinsB: Array(12).fill(0), decision: defaultDecision }
    : { dataSource: ds, videoSimulationStarted: false }),
  setVideoSimulationStarted: (started) => set({ videoSimulationStarted: started }),
  resetSimulation: () =>
    set({
      metricsA: defaultMetrics,
      metricsB: defaultMetrics,
      queueA: 0,
      queueB: 0,
      signalA: 'GREEN',
      signalB: 'RED',
      phase: 'A_GREEN',
      phaseTimeRemaining: 15,
      greenAllocatedA: 15,
      greenAllocatedB: 8,
      decision: defaultDecision,
      vehicles: [],
      congestionHistory: [],
      queueHistory: [],
      arrivalBinsA: Array(12).fill(0),
      arrivalBinsB: Array(12).fill(0),
      simulationTime: 0,
    }),
}));
