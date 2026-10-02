// ============================================================
// TRAFFIC PROVIDER INTERFACE
// ============================================================

import type { TrafficMetrics, TrafficLevel } from '../types/traffic';

export interface TrafficProvider {
  getMetrics(avenue: 'A' | 'B'): TrafficMetrics;
  setLevel(avenue: 'A' | 'B', level: TrafficLevel): void;
  tick(dt: number): void;
}
