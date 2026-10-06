// ============================================================
// TRAFFIC TYPES
// Core data contracts for Adaptive Traffic
// ============================================================

export type AvenueId = 'A' | 'B';

export type TrafficLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TrafficMetrics {
  timestamp: number;
  vehiclesInZone: number;
  // Simulation-only demand input. Video IA supplies measured arrivalRate and
  // does not need to provide an artificial target.
  targetArrivalRate?: number;
  arrivalRate: number;       // arrival demand in veh/min; measurement method depends on data source
  normalizedDensity: number; // 0..1, prototype ROI normalization
  stoppedRatio: number;      // 0..1, vehicles stopped for the configured minimum duration
  congestionIndex: number;  // 0..1, prototype index: (normalizedDensity + stoppedRatio) / 2
}

export type SignalColor = 'RED' | 'YELLOW' | 'GREEN';

export interface SignalState {
  color: SignalColor;
  timeRemaining: number;
}

// Signal phases for the intersection
export type Phase =
  | 'A_GREEN'
  | 'A_YELLOW'
  | 'ALL_RED_AB'
  | 'B_GREEN'
  | 'B_YELLOW'
  | 'ALL_RED_BA';

export interface PhaseRecord {
  phase: Phase;
  duration: number;
  startTime: number;
}

export interface ControllerDecision {
  priorityAvenue: AvenueId | 'BALANCED';
  nextGreenA: number;
  nextGreenB: number;
  demandA: number;
  demandB: number;
  reason: string;
}

export type DataSource = 'SIMULATION' | 'VIDEO_AI';

export interface SimulationConfig {
  levelA: TrafficLevel;
  levelB: TrafficLevel;
  speed: 1 | 2 | 4;
  running: boolean;
}

export interface VehicleData {
  id: string;
  avenue: AvenueId;
  lane: number;
  position: number;   // 0..1 normalized along avenue
  speed: number;      // normalized
  stopped: boolean;
  type: 'CAR' | 'SUV' | 'TRUCK';
  colorIndex: number; // 0..3
}

export interface QueueSnapshot {
  time: number;
  queueA: number;
  queueB: number;
}

export interface CongestionSnapshot {
  time: number;
  congestionA: number;
  congestionB: number;
}
