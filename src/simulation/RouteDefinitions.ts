import type { AvenueId } from '../types/traffic';

export type RouteId = 'ROUTE_A' | 'ROUTE_B';
export type Direction = 'WEST_TO_EAST' | 'SOUTH_TO_NORTH';
export type Vector3Tuple = [number, number, number];

export interface RouteDefinition {
  routeId: RouteId;
  avenue: AvenueId;
  direction: Direction;
  spawnPoint: Vector3Tuple;
  exitPoint: Vector3Tuple;
  forwardVector: Vector3Tuple;
  signalGroup: AvenueId;
  laneIndex: number;
  stopLinePosition: number;
  stopTargetPosition: number;
}

export const ROAD_HALF_LENGTH = 23;
export const ROUTE_WORLD_SCALE = ROAD_HALF_LENGTH;
// The rendered approach stop lines sit 4.4 world units from the intersection centre.
// Vehicle position is the FRONT bumper, measured from each route spawn point.
export const STOP_LINE_WORLD_OFFSET = 4.4;
export const STOP_LINE_POSITION = (ROAD_HALF_LENGTH - STOP_LINE_WORLD_OFFSET) / ROUTE_WORLD_SCALE;
export const STOP_MARGIN_WORLD = 1.0;
export const STOP_MARGIN = STOP_MARGIN_WORLD / ROUTE_WORLD_SCALE;
export const STOP_TARGET_POSITION = STOP_LINE_POSITION - STOP_MARGIN;
export const DESPAWN_POSITION = 2.55;
const LANE_OFFSET = 1.45;

// MVP convention: A runs from negative X to positive X; B runs from positive Z to negative Z.
export const ROUTES: Record<RouteId, RouteDefinition> = {
  ROUTE_A: {
    routeId: 'ROUTE_A', avenue: 'A', direction: 'WEST_TO_EAST',
    spawnPoint: [-ROAD_HALF_LENGTH, 0.2, LANE_OFFSET],
    exitPoint: [ROAD_HALF_LENGTH + DESPAWN_POSITION * ROAD_HALF_LENGTH, 0.2, LANE_OFFSET],
    forwardVector: [1, 0, 0], signalGroup: 'A', laneIndex: 0, stopLinePosition: STOP_LINE_POSITION, stopTargetPosition: STOP_TARGET_POSITION,
  },
  ROUTE_B: {
    routeId: 'ROUTE_B', avenue: 'B', direction: 'SOUTH_TO_NORTH',
    spawnPoint: [-LANE_OFFSET, 0.2, ROAD_HALF_LENGTH],
    exitPoint: [-LANE_OFFSET, 0.2, ROAD_HALF_LENGTH - DESPAWN_POSITION * ROAD_HALF_LENGTH],
    forwardVector: [0, 0, -1], signalGroup: 'B', laneIndex: 0, stopLinePosition: STOP_LINE_POSITION, stopTargetPosition: STOP_TARGET_POSITION,
  },
};

export function routeWorldPosition(route: RouteDefinition, normalizedPosition: number): Vector3Tuple {
  return [
    route.spawnPoint[0] + route.forwardVector[0] * normalizedPosition * ROUTE_WORLD_SCALE,
    route.spawnPoint[1],
    route.spawnPoint[2] + route.forwardVector[2] * normalizedPosition * ROUTE_WORLD_SCALE,
  ];
}

export function headingFromForward(forward: Vector3Tuple): number {
  // Vehicle meshes have their nose on local +Z. Three.js yaw maps +Z to (sin(yaw), cos(yaw)).
  return Math.atan2(forward[0], forward[2]);
}

export const MODEL_FORWARD_OFFSET = 0;
