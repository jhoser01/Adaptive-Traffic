"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptiveTrafficController = exports.DEMAND_EPSILON = exports.GREEN_RANGE = exports.MAX_GREEN = exports.MIN_GREEN = void 0;
exports.calculateGreenAllocation = calculateGreenAllocation;
const TrafficSignalStateMachine_1 = require("./TrafficSignalStateMachine");
// Prototype bounds: chosen to keep the demonstration observable and starvation-free.
exports.MIN_GREEN = 8;
exports.MAX_GREEN = 30;
exports.GREEN_RANGE = exports.MAX_GREEN - exports.MIN_GREEN;
exports.DEMAND_EPSILON = 0.0001;
const clamp = (value) => Math.min(exports.MAX_GREEN, Math.max(exports.MIN_GREEN, value));
/**
 * Traffic-responsive proportional split. Arrival rates already come from a
 * moving event window, and this allocation is committed only at a new green.
 */
function calculateGreenAllocation(arrivalRateA, arrivalRateB) {
    const qA = Math.max(0, arrivalRateA);
    const qB = Math.max(0, arrivalRateB);
    const total = qA + qB;
    if (total <= exports.DEMAND_EPSILON)
        return { greenA: exports.MIN_GREEN, greenB: exports.MIN_GREEN, shareA: 0, shareB: 0 };
    const shareA = qA / total;
    const shareB = qB / total;
    return {
        greenA: clamp(exports.MIN_GREEN + exports.GREEN_RANGE * shareA),
        greenB: clamp(exports.MIN_GREEN + exports.GREEN_RANGE * shareB),
        shareA,
        shareB,
    };
}
function decisionReason(qA, qB) {
    if (qA + qB <= exports.DEMAND_EPSILON)
        return 'Sin demanda medida. Se aplica verde mínimo.';
    if (qA === qB)
        return 'Demanda equilibrada.';
    return qA > qB ? 'Priorizando Avenida A.' : 'Priorizando Avenida B.';
}
class AdaptiveTrafficController {
    cfg = TrafficSignalStateMachine_1.DEFAULT_CONFIG;
    state;
    constructor(initialPhase = 'A_GREEN') {
        const allocation = calculateGreenAllocation(0, 0);
        this.state = {
            phase: initialPhase,
            phaseTimeRemaining: (0, TrafficSignalStateMachine_1.getPhaseDuration)(initialPhase, allocation.greenA, allocation.greenB, this.cfg),
            greenA: allocation.greenA,
            greenB: allocation.greenB,
            decision: { priorityAvenue: 'BALANCED', nextGreenA: allocation.greenA, nextGreenB: allocation.greenB, demandA: 0, demandB: 0, reason: 'Inicializando control adaptativo.' },
        };
    }
    getState() { return this.state; }
    tick(dt, metricsA, metricsB) {
        this.state.phaseTimeRemaining -= dt;
        if (this.state.phaseTimeRemaining <= 0)
            this.advancePhase(metricsA, metricsB);
    }
    advancePhase(metricsA, metricsB) {
        const nextPhase = (0, TrafficSignalStateMachine_1.getNextPhase)(this.state.phase);
        // Allocation is prepared only as a new green phase begins; an active green is never resized.
        if (nextPhase === 'A_GREEN' || nextPhase === 'B_GREEN') {
            const allocation = calculateGreenAllocation(metricsA.arrivalRate, metricsB.arrivalRate);
            this.state.greenA = allocation.greenA;
            this.state.greenB = allocation.greenB;
            const priority = allocation.shareA === allocation.shareB ? 'BALANCED' : allocation.shareA > allocation.shareB ? 'A' : 'B';
            this.state.decision = {
                priorityAvenue: priority,
                nextGreenA: allocation.greenA,
                nextGreenB: allocation.greenB,
                demandA: allocation.shareA,
                demandB: allocation.shareB,
                reason: decisionReason(metricsA.arrivalRate, metricsB.arrivalRate),
            };
        }
        this.state.phase = nextPhase;
        this.state.phaseTimeRemaining = (0, TrafficSignalStateMachine_1.getPhaseDuration)(nextPhase, this.state.greenA, this.state.greenB, this.cfg);
    }
}
exports.AdaptiveTrafficController = AdaptiveTrafficController;
