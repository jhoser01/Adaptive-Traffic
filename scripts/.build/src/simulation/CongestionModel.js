"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ARRIVAL_BUCKET_COUNT = exports.ARRIVAL_BUCKET_SECONDS = exports.ARRIVAL_WINDOW_SECONDS = exports.STOPPED_MIN_DURATION = exports.STOPPED_SPEED_THRESHOLD = exports.VEHICLE_REFERENCE_CAPACITY = void 0;
exports.calculateNormalizedDensity = calculateNormalizedDensity;
exports.calculateStoppedRatio = calculateStoppedRatio;
exports.calculateCongestionIndex = calculateCongestionIndex;
exports.calculateArrivalRate = calculateArrivalRate;
/**
 * Prototype traffic-condition equations.
 * VEHICLE_REFERENCE_CAPACITY normalizes the visible ROI only; it is not a
 * universal road capacity or a physical saturation-flow value.
 */
exports.VEHICLE_REFERENCE_CAPACITY = 20;
exports.STOPPED_SPEED_THRESHOLD = 0.01;
exports.STOPPED_MIN_DURATION = 1;
exports.ARRIVAL_WINDOW_SECONDS = 60;
exports.ARRIVAL_BUCKET_SECONDS = 5;
exports.ARRIVAL_BUCKET_COUNT = exports.ARRIVAL_WINDOW_SECONDS / exports.ARRIVAL_BUCKET_SECONDS;
const clamp01 = (value) => Math.min(Math.max(value, 0), 1);
function calculateNormalizedDensity(vehiclesInZone, referenceCapacity = exports.VEHICLE_REFERENCE_CAPACITY) {
    return clamp01(vehiclesInZone / Math.max(referenceCapacity, 1));
}
function calculateStoppedRatio(stoppedVehicles, vehiclesInZone) {
    return vehiclesInZone <= 0 ? 0 : clamp01(stoppedVehicles / vehiclesInZone);
}
function calculateCongestionIndex(normalizedDensity, stoppedRatio) {
    return clamp01((clamp01(normalizedDensity) + clamp01(stoppedRatio)) / 2);
}
/** q = N / Δt, expressed in vehicles per minute. */
function calculateArrivalRate(eventCount, elapsedSeconds) {
    return elapsedSeconds <= 0 ? 0 : eventCount / elapsedSeconds * 60;
}
