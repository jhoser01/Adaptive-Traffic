// ============================================================
// QUEUE MODEL
// Tracks queued vehicles at each intersection approach
// ============================================================

import type { AvenueId } from '../types/traffic';
import type { VehicleAgent } from './VehicleAgent';

export const QUEUE_SPEED_THRESHOLD = 0.08;

/**
 * Count vehicles that are stopped before the stop line (queued).
 */
export function countQueuedVehicles(
  vehicles: VehicleAgent[],
  avenue: AvenueId
): number {
  return vehicles.filter(
    (v) =>
      v.active &&
      v.avenue === avenue &&
      !v.hasCrossedStopLine &&
      v.position < v.stopLinePosition &&
      v.position > 0 &&
      v.speed < QUEUE_SPEED_THRESHOLD
  ).length;
}

/**
 * Count vehicles currently approaching or in intersection.
 */
export function countApproachVehicles(
  vehicles: VehicleAgent[],
  avenue: AvenueId
): number {
  return vehicles.filter((v) => v.active && v.avenue === avenue).length;
}
