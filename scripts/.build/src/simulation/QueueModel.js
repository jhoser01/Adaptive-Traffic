"use strict";
// ============================================================
// QUEUE MODEL
// Tracks queued vehicles at each intersection approach
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUEUE_SPEED_THRESHOLD = void 0;
exports.countQueuedVehicles = countQueuedVehicles;
exports.countApproachVehicles = countApproachVehicles;
exports.QUEUE_SPEED_THRESHOLD = 0.08;
/**
 * Count vehicles that are stopped before the stop line (queued).
 */
function countQueuedVehicles(vehicles, avenue) {
    return vehicles.filter((v) => v.active &&
        v.avenue === avenue &&
        !v.hasCrossedStopLine &&
        v.position < v.stopLinePosition &&
        v.position > 0 &&
        v.speed < exports.QUEUE_SPEED_THRESHOLD).length;
}
/**
 * Count vehicles currently approaching or in intersection.
 */
function countApproachVehicles(vehicles, avenue) {
    return vehicles.filter((v) => v.active && v.avenue === avenue).length;
}
