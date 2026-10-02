"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODEL_FORWARD_OFFSET = exports.ROUTES = exports.DESPAWN_POSITION = exports.STOP_TARGET_POSITION = exports.STOP_MARGIN = exports.STOP_MARGIN_WORLD = exports.STOP_LINE_POSITION = exports.STOP_LINE_WORLD_OFFSET = exports.ROUTE_WORLD_SCALE = exports.ROAD_HALF_LENGTH = void 0;
exports.routeWorldPosition = routeWorldPosition;
exports.headingFromForward = headingFromForward;
exports.ROAD_HALF_LENGTH = 23;
exports.ROUTE_WORLD_SCALE = exports.ROAD_HALF_LENGTH;
// The rendered approach stop lines sit 4.4 world units from the intersection centre.
// Vehicle position is the FRONT bumper, measured from each route spawn point.
exports.STOP_LINE_WORLD_OFFSET = 4.4;
exports.STOP_LINE_POSITION = (exports.ROAD_HALF_LENGTH - exports.STOP_LINE_WORLD_OFFSET) / exports.ROUTE_WORLD_SCALE;
exports.STOP_MARGIN_WORLD = 1.0;
exports.STOP_MARGIN = exports.STOP_MARGIN_WORLD / exports.ROUTE_WORLD_SCALE;
exports.STOP_TARGET_POSITION = exports.STOP_LINE_POSITION - exports.STOP_MARGIN;
exports.DESPAWN_POSITION = 2.55;
const LANE_OFFSET = 1.45;
// MVP convention: A runs from negative X to positive X; B runs from positive Z to negative Z.
exports.ROUTES = {
    ROUTE_A: {
        routeId: 'ROUTE_A', avenue: 'A', direction: 'WEST_TO_EAST',
        spawnPoint: [-exports.ROAD_HALF_LENGTH, 0.2, LANE_OFFSET],
        exitPoint: [exports.ROAD_HALF_LENGTH + exports.DESPAWN_POSITION * exports.ROAD_HALF_LENGTH, 0.2, LANE_OFFSET],
        forwardVector: [1, 0, 0], signalGroup: 'A', laneIndex: 0, stopLinePosition: exports.STOP_LINE_POSITION, stopTargetPosition: exports.STOP_TARGET_POSITION,
    },
    ROUTE_B: {
        routeId: 'ROUTE_B', avenue: 'B', direction: 'SOUTH_TO_NORTH',
        spawnPoint: [-LANE_OFFSET, 0.2, exports.ROAD_HALF_LENGTH],
        exitPoint: [-LANE_OFFSET, 0.2, exports.ROAD_HALF_LENGTH - exports.DESPAWN_POSITION * exports.ROAD_HALF_LENGTH],
        forwardVector: [0, 0, -1], signalGroup: 'B', laneIndex: 0, stopLinePosition: exports.STOP_LINE_POSITION, stopTargetPosition: exports.STOP_TARGET_POSITION,
    },
};
function routeWorldPosition(route, normalizedPosition) {
    return [
        route.spawnPoint[0] + route.forwardVector[0] * normalizedPosition * exports.ROUTE_WORLD_SCALE,
        route.spawnPoint[1],
        route.spawnPoint[2] + route.forwardVector[2] * normalizedPosition * exports.ROUTE_WORLD_SCALE,
    ];
}
function headingFromForward(forward) {
    // Vehicle meshes have their nose on local +Z. Three.js yaw maps +Z to (sin(yaw), cos(yaw)).
    return Math.atan2(forward[0], forward[2]);
}
exports.MODEL_FORWARD_OFFSET = 0;
