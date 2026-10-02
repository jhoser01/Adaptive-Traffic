"use strict";
// ============================================================
// SIGNAL STATE MACHINE
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
exports.getSignalColors = getSignalColors;
exports.getNextPhase = getNextPhase;
exports.getPhaseDuration = getPhaseDuration;
exports.DEFAULT_CONFIG = {
    yellowDuration: 3,
    allRedDuration: 1,
};
function getSignalColors(phase) {
    switch (phase) {
        case 'A_GREEN': return { a: 'GREEN', b: 'RED' };
        case 'A_YELLOW': return { a: 'YELLOW', b: 'RED' };
        case 'ALL_RED_AB': return { a: 'RED', b: 'RED' };
        case 'B_GREEN': return { a: 'RED', b: 'GREEN' };
        case 'B_YELLOW': return { a: 'RED', b: 'YELLOW' };
        case 'ALL_RED_BA': return { a: 'RED', b: 'RED' };
    }
}
function getNextPhase(current) {
    switch (current) {
        case 'A_GREEN': return 'A_YELLOW';
        case 'A_YELLOW': return 'ALL_RED_AB';
        case 'ALL_RED_AB': return 'B_GREEN';
        case 'B_GREEN': return 'B_YELLOW';
        case 'B_YELLOW': return 'ALL_RED_BA';
        case 'ALL_RED_BA': return 'A_GREEN';
    }
}
function getPhaseDuration(phase, greenA, greenB, cfg) {
    switch (phase) {
        case 'A_GREEN': return greenA;
        case 'B_GREEN': return greenB;
        case 'A_YELLOW':
        case 'B_YELLOW': return cfg.yellowDuration;
        case 'ALL_RED_AB':
        case 'ALL_RED_BA': return cfg.allRedDuration;
    }
}
