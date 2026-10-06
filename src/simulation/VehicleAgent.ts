// ============================================================
// VEHICLE AGENT
// ============================================================

import type { AvenueId, SignalColor } from '../types/traffic';
import type { RouteDefinition, RouteId, Vector3Tuple } from './RouteDefinitions';
import { routeWorldPosition, ROUTE_WORLD_SCALE } from './RouteDefinitions';

export type VehicleType = 'CAR' | 'SUV' | 'TRUCK';

export interface VehicleAgent {
  id: string;
  avenue: AvenueId;
  routeId: RouteId;
  direction: RouteDefinition['direction'];
  signalGroup: AvenueId;
  lane: number;          // 0 or 1
  position: number;      // 0 = spawn entry, 1 = stop line, >1 = through/exiting
  speed: number;         // current speed (normalized units/s)
  maxSpeed: number;
  type: VehicleType;
  colorIndex: number;
  active: boolean;
  length: number;
  stopLinePosition: number;
  stopTargetPosition: number;
  hasCrossedStopLine: boolean;
  isStoppedAtSignal: boolean;
  acceleration: number;
  stoppedDuration: number;
  forwardVector: Vector3Tuple;
  spawnPoint: Vector3Tuple;
  exitPoint: Vector3Tuple;
  velocityVector: Vector3Tuple;
  previousWorldPosition: Vector3Tuple;
}

const MAX_SPEED: Record<VehicleType, number> = {
  CAR: 0.34,
  SUV: 0.31,
  TRUCK: 0.25,
};

const VEHICLE_LENGTHS: Record<VehicleType, number> = {
  CAR: 1.15 / ROUTE_WORLD_SCALE,
  SUV: 1.25 / ROUTE_WORLD_SCALE,
  TRUCK: 1.90 / ROUTE_WORLD_SCALE,
};

const ACCEL = 0.24;          // normalized units/s²
const DECEL = 0.42;          // normalized units/s²
const MIN_GAP = 0.06;       // minimum following gap (normalized)
export const QUEUE_GAP = 0.035;
export const STOP_SNAP_TOLERANCE = 0.008;
const BRAKE_WINDOW = 0.28;

let idCounter = 0;

function randomType(): VehicleType {
  const r = Math.random();
  if (r < 0.58) return 'CAR';
  if (r < 0.85) return 'SUV';
  return 'TRUCK';
}

export function createVehicle(route: RouteDefinition): VehicleAgent {
  const type = randomType();
  const initialPosition = routeWorldPosition(route, -0.02);
  return {
    id: `v-${route.routeId}-${++idCounter}`,
    avenue: route.avenue,
    routeId: route.routeId,
    direction: route.direction,
    signalGroup: route.signalGroup,
    lane: route.laneIndex,
    position: -0.02,
    speed: 0,
    maxSpeed: MAX_SPEED[type] * (0.88 + Math.random() * 0.24),
    type,
    colorIndex: Math.floor(Math.random() * 5),
    active: true,
    length: VEHICLE_LENGTHS[type],
    forwardVector: route.forwardVector,
    spawnPoint: route.spawnPoint,
    exitPoint: route.exitPoint,
    velocityVector: [0, 0, 0],
    previousWorldPosition: initialPosition,
    stopLinePosition: route.stopLinePosition,
    stopTargetPosition: route.stopTargetPosition,
    hasCrossedStopLine: false,
    isStoppedAtSignal: false,
    acceleration: 0,
    stoppedDuration: 0,
  };
}

export function tickVehicle(
  vehicle: VehicleAgent,
  dt: number,
  signal: SignalColor,
  vehiclesAhead: VehicleAgent[]
): void {
  if (!vehicle.active) return;

  // Position represents the vehicle front. Once it crosses the stop line,
  // signal logic is permanently disabled until this vehicle exits the route.
  if (!vehicle.hasCrossedStopLine && vehicle.position >= vehicle.stopLinePosition) {
    vehicle.hasCrossedStopLine = true;
  }

  const hasSignalAuthority = !vehicle.hasCrossedStopLine;
  const signalRequiresStop = hasSignalAuthority && (signal === 'RED' || signal === 'YELLOW');

  // Find closest vehicle ahead in same lane
  let gapToLeader = Infinity;
  let leader: VehicleAgent | null = null;
  for (const ahead of vehiclesAhead) {
    if (ahead.id === vehicle.id) continue;
    if (ahead.position > vehicle.position) {
      const gap = ahead.position - vehicle.position - ahead.length;
      if (gap < gapToLeader) { gapToLeader = gap; leader = ahead; }
    }
  }

  let targetSpeed = vehicle.maxSpeed;

  // --- Car-following model (simplified IDM) ---
  if (gapToLeader < MIN_GAP * 6) {
    // Scale speed by gap ratio — smooth deceleration
    const ratio = Math.max(0, gapToLeader - MIN_GAP) / (MIN_GAP * 5);
    targetSpeed = Math.min(targetSpeed, vehicle.maxSpeed * ratio);
  }
  if (gapToLeader < MIN_GAP) {
    targetSpeed = 0;
  }

  // --- Signal and queue targets ---
  // The first vehicle stops before the stop line; followers target the rear of
  // the vehicle ahead, so the queue grows backwards without overlap.
  const queueTarget = leader && !leader.hasCrossedStopLine
    ? leader.position - leader.length - QUEUE_GAP
    : vehicle.stopTargetPosition;
  const canStopOnYellow = signal === 'RED' || (signal === 'YELLOW' && vehicle.position < vehicle.stopTargetPosition);
  const mustStop = signalRequiresStop && canStopOnYellow;

  if (signal === 'GREEN' || vehicle.hasCrossedStopLine) vehicle.isStoppedAtSignal = false;

  if (mustStop && vehicle.position < queueTarget) {
    const distanceToTarget = queueTarget - vehicle.position;
    const requiredBrakingDistance = (vehicle.speed * vehicle.speed) / (2 * DECEL);
    const brakeFactor = Math.min(1, Math.max(0, distanceToTarget / BRAKE_WINDOW));
    targetSpeed = Math.min(targetSpeed, vehicle.maxSpeed * Math.pow(brakeFactor, 1.3));
    const projectedStoppingTravel = vehicle.speed * dt + 0.5 * DECEL * dt * dt;
    if (distanceToTarget <= STOP_SNAP_TOLERANCE || distanceToTarget <= projectedStoppingTravel || distanceToTarget <= requiredBrakingDistance * 0.18) {
      vehicle.position = queueTarget;
      vehicle.speed = 0;
      vehicle.acceleration = 0;
      vehicle.isStoppedAtSignal = !leader;
      updateMotionState(vehicle);
      return;
    }
  }

  // A signal-stopped vehicle is locked in place for the whole red phase.
  if (signal === 'RED' && vehicle.isStoppedAtSignal && !vehicle.hasCrossedStopLine) {
    vehicle.speed = 0;
    vehicle.acceleration = 0;
    updateMotionState(vehicle);
    return;
  }

  // --- Speed interpolation ---
  const previousSpeed = vehicle.speed;
  if (vehicle.speed < targetSpeed) {
    vehicle.speed = Math.min(targetSpeed, vehicle.speed + ACCEL * dt);
  } else {
    vehicle.speed = Math.max(targetSpeed, vehicle.speed - DECEL * dt);
  }
  vehicle.speed = Math.max(0, vehicle.speed);
  vehicle.acceleration = dt > 0 ? (vehicle.speed - previousSpeed) / dt : 0;

  vehicle.position += vehicle.speed * dt;

  if (mustStop && vehicle.position >= queueTarget) {
    vehicle.position = queueTarget;
    vehicle.speed = 0;
    vehicle.acceleration = 0;
    vehicle.isStoppedAtSignal = !leader;
  }

  updateMotionState(vehicle);
}

function updateMotionState(vehicle: VehicleAgent): void {
  const currentWorldPosition = [
    vehicle.spawnPoint[0] + vehicle.forwardVector[0] * vehicle.position * ROUTE_WORLD_SCALE,
    vehicle.spawnPoint[1],
    vehicle.spawnPoint[2] + vehicle.forwardVector[2] * vehicle.position * ROUTE_WORLD_SCALE,
  ] as Vector3Tuple;
  const dx = currentWorldPosition[0] - vehicle.previousWorldPosition[0];
  const dz = currentWorldPosition[2] - vehicle.previousWorldPosition[2];
  const distance = Math.hypot(dx, dz);
  vehicle.velocityVector = distance > 1e-6 ? [dx / distance, 0, dz / distance] : [0, 0, 0];
  vehicle.previousWorldPosition = currentWorldPosition;
}
