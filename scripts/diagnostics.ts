import { AdaptiveTrafficController, calculateGreenAllocation, MIN_GREEN, MAX_GREEN } from '../src/control/AdaptiveTrafficController';
import { getNextPhase, getSignalColors } from '../src/control/TrafficSignalStateMachine';
import { TrafficSimulation } from '../src/simulation/TrafficSimulation';
import { createVehicle, tickVehicle } from '../src/simulation/VehicleAgent';
import { ROUTES, routeWorldPosition, STOP_MARGIN_WORLD } from '../src/simulation/RouteDefinitions';
import { calculateArrivalRate, calculateCongestionIndex, calculateNormalizedDensity, calculateStoppedRatio, VEHICLE_REFERENCE_CAPACITY } from '../src/simulation/CongestionModel';
import type { TrafficMetrics } from '../src/types/traffic';

const assert = (condition: boolean, message: string) => { if (!condition) throw new Error(message); };
const closeTo = (actual: number, expected: number, message: string) => assert(Math.abs(actual - expected) < 0.001, `${message}: ${actual} vs ${expected}`);

function metrics(targetArrivalRate: number, arrivalRate = targetArrivalRate): TrafficMetrics {
  return { timestamp: 0, targetArrivalRate, arrivalRate, vehiclesInZone: 0, normalizedDensity: 0, stoppedRatio: 0, congestionIndex: 0 };
}

function modelEquationChecks() {
  closeTo(calculateArrivalRate(10, 60), 10, '10 events in 60 s must equal 10 veh/min');
  closeTo(calculateArrivalRate(5, 30), 10, '5 events in 30 s must equal 10 veh/min');
  closeTo(calculateStoppedRatio(4, 10), 0.4, 'stopped ratio');
  closeTo(calculateNormalizedDensity(VEHICLE_REFERENCE_CAPACITY / 2), 0.5, 'normalized density');
  closeTo(calculateCongestionIndex(0.6, 0.4), 0.5, 'congestion index');
}

function controllerChecks() {
  const highLow = calculateGreenAllocation(38, 6);
  closeTo(highLow.greenA, 27, 'qA=38, qB=6 green A');
  closeTo(highLow.greenB, 11, 'qA=38, qB=6 green B');
  const balanced = calculateGreenAllocation(20, 20);
  closeTo(balanced.greenA, 19, 'balanced green A');
  closeTo(balanced.greenB, 19, 'balanced green B');
  const aOnly = calculateGreenAllocation(45, 0);
  closeTo(aOnly.greenA, 30, 'A-only green A'); closeTo(aOnly.greenB, 8, 'A-only green B');
  const bOnly = calculateGreenAllocation(0, 45);
  closeTo(bOnly.greenA, 8, 'B-only green A'); closeTo(bOnly.greenB, 30, 'B-only green B');
  const none = calculateGreenAllocation(0, 0);
  closeTo(none.greenA, 8, 'no-demand green A'); closeTo(none.greenB, 8, 'no-demand green B');
  for (const allocation of [highLow, balanced, aOnly, bOnly, none]) {
    assert(allocation.greenA >= MIN_GREEN && allocation.greenA <= MAX_GREEN, 'green A outside configured bounds');
    assert(allocation.greenB >= MIN_GREEN && allocation.greenB <= MAX_GREEN, 'green B outside configured bounds');
  }
  const phases = ['A_GREEN', 'A_YELLOW', 'ALL_RED_AB', 'B_GREEN', 'B_YELLOW', 'ALL_RED_BA'] as const;
  phases.forEach((phase, index) => assert(getNextPhase(phase) === phases[(index + 1) % phases.length], `phase transition failed at ${phase}`));
  assert(getSignalColors('A_GREEN').a === 'GREEN' && getSignalColors('A_GREEN').b === 'RED', 'A_GREEN signal mapping failed');
  assert(getSignalColors('B_GREEN').a === 'RED' && getSignalColors('B_GREEN').b === 'GREEN', 'B_GREEN signal mapping failed');
  const controller = new AdaptiveTrafficController('A_GREEN');
  controller.tick(8.1, metrics(38), metrics(6));
  assert(controller.getState().phase === 'A_YELLOW', 'controller interrupted safe state sequence');
}

function orientationAndStopChecks() {
  for (const route of Object.values(ROUTES)) {
    const vehicle = createVehicle(route);
    tickVehicle(vehicle, 0.1, 'GREEN', [vehicle]);
    const dot = vehicle.forwardVector[0] * vehicle.velocityVector[0] + vehicle.forwardVector[2] * vehicle.velocityVector[2];
    assert(dot > 0.99, `${route.routeId} vehicle heading is not aligned with movement`);

    const approaching = createVehicle(route);
    approaching.position = route.stopTargetPosition - 0.03;
    approaching.speed = 0.08;
    tickVehicle(approaching, 1, 'RED', [approaching]);
    assert(approaching.isStoppedAtSignal && approaching.position === route.stopTargetPosition && approaching.speed === 0, `${route.routeId} did not snap to stop target`);
    const heldPosition = approaching.position;
    for (let i = 0; i < 30; i += 1) tickVehicle(approaching, 0.1, 'RED', [approaching]);
    assert(approaching.position === heldPosition, `${route.routeId} moved while red was held`);
    tickVehicle(approaching, 0.1, 'GREEN', [approaching]);
    assert(approaching.position > heldPosition && !approaching.isStoppedAtSignal, `${route.routeId} did not restart on green`);

    const stopLineWorld = routeWorldPosition(route, route.stopLinePosition);
    const stopTargetWorld = routeWorldPosition(route, route.stopTargetPosition);
    closeTo(Math.hypot(stopLineWorld[0] - stopTargetWorld[0], stopLineWorld[2] - stopTargetWorld[2]), STOP_MARGIN_WORLD, `${route.routeId} stop margin`);
  }
}

function spawnChecks() {
  const rates: Record<'LOW' | 'MEDIUM' | 'HIGH', number> = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  const targets: Record<'LOW' | 'MEDIUM' | 'HIGH', number> = { LOW: 6, MEDIUM: 16, HIGH: 38 };
  const recentArrivals: Record<'LOW' | 'MEDIUM' | 'HIGH', number> = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  for (const level of Object.keys(targets) as Array<'LOW' | 'MEDIUM' | 'HIGH'>) {
    const sim = new TrafficSimulation();
    const input = metrics(targets[level]);
    for (let time = 0; time < 360; time += 0.1) sim.tick(0.1, input, input, 'GREEN', 'GREEN');
    rates[level] = sim.getSpawnDiagnostics('A').actualSpawnRate;
    const bins = sim.getArrivalBins('A');
    assert(bins.length === 12 && bins.every((value) => Number.isInteger(value) && value >= 0), `${level} arrival histogram is invalid`);
    recentArrivals[level] = bins.reduce((sum, value) => sum + value, 0);
    assert(Math.abs(rates[level] - targets[level]) < targets[level] * 0.25 + 2, `${level} spawn rate drifted: ${rates[level].toFixed(1)} vs ${targets[level]}`);
    const measured = sim.getMetrics('A').arrivalRate;
    assert(Math.abs(measured - recentArrivals[level]) < 0.001, `${level} measured arrival rate is not derived from arrival events`);
  }
  assert(rates.LOW < rates.MEDIUM && rates.MEDIUM < rates.HIGH, `spawn ordering failed: ${JSON.stringify(rates)}`);
  assert(recentArrivals.LOW < recentArrivals.MEDIUM && recentArrivals.MEDIUM < recentArrivals.HIGH, `arrival histogram ordering failed: ${JSON.stringify(recentArrivals)}`);
  const frameCadenceSim = new TrafficSimulation();
  const highInput = metrics(38);
  for (let time = 0; time < 60; time += 0.064) frameCadenceSim.tick(0.064, highInput, highInput, 'GREEN', 'GREEN');
  const frameCadenceRate = frameCadenceSim.getMetrics('A').arrivalRate;
  assert(frameCadenceRate > 20, `frame-cadence measured rate is implausibly low: ${frameCadenceRate.toFixed(1)}`);
  console.log(`spawn rates veh/min: ${JSON.stringify(rates)}`);
  console.log(`last-60s arrival totals: ${JSON.stringify(recentArrivals)}`);
  console.log(`frame-cadence HIGH measured rate: ${frameCadenceRate.toFixed(1)} veh/min`);
}

modelEquationChecks();
controllerChecks();
orientationAndStopChecks();
spawnChecks();
console.log('simulation diagnostics: PASS');
