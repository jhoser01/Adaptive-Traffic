/**
 * Prototype traffic-condition equations.
 * VEHICLE_REFERENCE_CAPACITY normalizes the visible ROI only; it is not a
 * universal road capacity or a physical saturation-flow value.
 */
export const VEHICLE_REFERENCE_CAPACITY = 20;
export const STOPPED_SPEED_THRESHOLD = 0.01;
export const STOPPED_MIN_DURATION = 1;
export const ARRIVAL_WINDOW_SECONDS = 60;
export const ARRIVAL_BUCKET_SECONDS = 5;
export const ARRIVAL_BUCKET_COUNT = ARRIVAL_WINDOW_SECONDS / ARRIVAL_BUCKET_SECONDS;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function calculateNormalizedDensity(vehiclesInZone: number, referenceCapacity = VEHICLE_REFERENCE_CAPACITY): number {
  return clamp01(vehiclesInZone / Math.max(referenceCapacity, 1));
}

export function calculateStoppedRatio(stoppedVehicles: number, vehiclesInZone: number): number {
  return vehiclesInZone <= 0 ? 0 : clamp01(stoppedVehicles / vehiclesInZone);
}

export function calculateCongestionIndex(normalizedDensity: number, stoppedRatio: number): number {
  return clamp01((clamp01(normalizedDensity) + clamp01(stoppedRatio)) / 2);
}

/** q = N / Δt, expressed in vehicles per minute. */
export function calculateArrivalRate(eventCount: number, elapsedSeconds: number): number {
  return elapsedSeconds <= 0 ? 0 : eventCount / elapsedSeconds * 60;
}
