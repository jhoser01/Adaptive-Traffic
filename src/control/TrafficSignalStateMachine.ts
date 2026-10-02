// ============================================================
// SIGNAL STATE MACHINE
// ============================================================

import type { Phase, SignalColor } from '../types/traffic';

export interface SignalStateMachineConfig {
  yellowDuration: number;  // seconds
  allRedDuration: number;  // seconds
}

export interface PhaseOutput {
  phase: Phase;
  signalA: SignalColor;
  signalB: SignalColor;
  isTransition: boolean;
}

export const DEFAULT_CONFIG: SignalStateMachineConfig = {
  yellowDuration: 3,
  allRedDuration: 1,
};

export function getSignalColors(phase: Phase): { a: SignalColor; b: SignalColor } {
  switch (phase) {
    case 'A_GREEN':      return { a: 'GREEN', b: 'RED' };
    case 'A_YELLOW':     return { a: 'YELLOW', b: 'RED' };
    case 'ALL_RED_AB':   return { a: 'RED', b: 'RED' };
    case 'B_GREEN':      return { a: 'RED', b: 'GREEN' };
    case 'B_YELLOW':     return { a: 'RED', b: 'YELLOW' };
    case 'ALL_RED_BA':   return { a: 'RED', b: 'RED' };
  }
}

export function getNextPhase(current: Phase): Phase {
  switch (current) {
    case 'A_GREEN':    return 'A_YELLOW';
    case 'A_YELLOW':   return 'ALL_RED_AB';
    case 'ALL_RED_AB': return 'B_GREEN';
    case 'B_GREEN':    return 'B_YELLOW';
    case 'B_YELLOW':   return 'ALL_RED_BA';
    case 'ALL_RED_BA': return 'A_GREEN';
  }
}

export function getPhaseDuration(phase: Phase, greenA: number, greenB: number, cfg: SignalStateMachineConfig): number {
  switch (phase) {
    case 'A_GREEN':    return greenA;
    case 'B_GREEN':    return greenB;
    case 'A_YELLOW':
    case 'B_YELLOW':   return cfg.yellowDuration;
    case 'ALL_RED_AB':
    case 'ALL_RED_BA': return cfg.allRedDuration;
  }
}
