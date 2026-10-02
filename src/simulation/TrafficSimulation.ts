import type { AvenueId, SignalColor, TrafficMetrics } from '../types/traffic';
import type { VehicleAgent } from './VehicleAgent';
import { createVehicle, tickVehicle } from './VehicleAgent';
import { countQueuedVehicles, countApproachVehicles } from './QueueModel';
import { ROUTES, type RouteDefinition } from './RouteDefinitions';
import {
  ARRIVAL_WINDOW_SECONDS,
  ARRIVAL_BUCKET_SECONDS,
  ARRIVAL_BUCKET_COUNT,
  STOPPED_MIN_DURATION,
  STOPPED_SPEED_THRESHOLD,
  calculateArrivalRate,
  calculateCongestionIndex,
  calculateNormalizedDensity,
  calculateStoppedRatio,
} from './CongestionModel';

const MAX_VEHICLES_PER_AVENUE = 42;
export const ANALYSIS_ZONE_START = 0;
export const ANALYSIS_ZONE_END = 1.25;

interface PlatoonState { remaining: number; timer: number; intraInterval: number; gapAfter: number; }
interface AvenueVehicles { vehicles: VehicleAgent[]; route: RouteDefinition; platoon: PlatoonState; spawned: number; measurementTime: number; targetArrivalRate: number; spawnEvents: number[]; firstArrivalScheduled: boolean; }

function initialState(route: RouteDefinition): AvenueVehicles {
  return { vehicles: [], route, platoon: { remaining: 0, timer: 0, intraInterval: 0, gapAfter: 0 }, spawned: 0, measurementTime: 0, targetArrivalRate: 0, spawnEvents: [], firstArrivalScheduled: false };
}

/** Platoons redistribute the arrival interval without changing its long-run mean. */
export function getPlatoonSchedule(arrivalRate: number): { size: number; intraInterval: number; gapAfter: number } {
  const safeRate = Math.max(arrivalRate, 0.1);
  const meanInterval = 60 / safeRate;
  const size = safeRate >= 28 ? 2 + Math.floor(Math.random() * 4) : safeRate >= 10 ? 1 + Math.floor(Math.random() * 3) : Math.random() < 0.25 ? 2 : 1;
  const intraInterval = size === 1 ? 0 : meanInterval * (safeRate >= 28 ? 0.32 : 0.5);
  const gapAfter = Math.max(0.05, size * meanInterval - (size - 1) * intraInterval);
  return { size, intraInterval, gapAfter };
}

export class TrafficSimulation {
  private avenues: Record<AvenueId, AvenueVehicles> = { A: initialState(ROUTES.ROUTE_A), B: initialState(ROUTES.ROUTE_B) };

  getVehicles(): VehicleAgent[] { return [...this.avenues.A.vehicles, ...this.avenues.B.vehicles]; }
  getQueueCount(avenue: AvenueId): number { return countQueuedVehicles(this.avenues[avenue].vehicles, avenue); }
  getApproachCount(avenue: AvenueId): number { return countApproachVehicles(this.avenues[avenue].vehicles, avenue); }
  getSpawnDiagnostics(avenue: AvenueId): { targetArrivalRate: number; actualSpawnRate: number } {
    const state = this.avenues[avenue];
    return { targetArrivalRate: state.targetArrivalRate, actualSpawnRate: state.measurementTime > 0 ? state.spawned / state.measurementTime * 60 : 0 };
  }
  getMetrics(avenue: AvenueId): TrafficMetrics {
    const state = this.avenues[avenue];
    const elapsedSeconds = Math.min(ARRIVAL_WINDOW_SECONDS, state.measurementTime);
    const windowStart = state.measurementTime - elapsedSeconds;
    const arrivalsInWindow = state.spawnEvents.filter((eventTime) => eventTime >= windowStart && eventTime <= state.measurementTime).length;
    const inZone = state.vehicles.filter((vehicle) => vehicle.position >= ANALYSIS_ZONE_START && vehicle.position <= ANALYSIS_ZONE_END);
    const stoppedVehicles = inZone.filter((vehicle) => vehicle.stoppedDuration >= STOPPED_MIN_DURATION).length;
    const normalizedDensity = calculateNormalizedDensity(inZone.length);
    const stoppedRatio = calculateStoppedRatio(stoppedVehicles, inZone.length);
    return {
      timestamp: Date.now(),
      targetArrivalRate: state.targetArrivalRate,
      vehiclesInZone: inZone.length,
      arrivalRate: calculateArrivalRate(arrivalsInWindow, elapsedSeconds),
      normalizedDensity,
      stoppedRatio,
      congestionIndex: calculateCongestionIndex(normalizedDensity, stoppedRatio),
    };
  }
  getArrivalBins(avenue: AvenueId): number[] {
    const state = this.avenues[avenue];
    const windowStart = state.measurementTime - ARRIVAL_WINDOW_SECONDS;
    const bins = Array<number>(ARRIVAL_BUCKET_COUNT).fill(0);
    for (const eventTime of state.spawnEvents) {
      if (eventTime < windowStart || eventTime > state.measurementTime) continue;
      const index = Math.min(ARRIVAL_BUCKET_COUNT - 1, Math.max(0, Math.floor((eventTime - windowStart) / ARRIVAL_BUCKET_SECONDS)));
      bins[index] += 1;
    }
    return bins;
  }

  tick(dt: number, metricsA: TrafficMetrics, metricsB: TrafficMetrics, signalA: SignalColor, signalB: SignalColor): void {
    this.tickAvenue('A', dt, metricsA, signalA);
    this.tickAvenue('B', dt, metricsB, signalB);
  }

  private tickAvenue(avenue: AvenueId, dt: number, metrics: TrafficMetrics, signal: SignalColor): void {
    const state = this.avenues[avenue];
    state.measurementTime += dt;
    state.spawnEvents = state.spawnEvents.filter((eventTime) => eventTime >= state.measurementTime - ARRIVAL_WINDOW_SECONDS);
    const targetArrivalRate = metrics.targetArrivalRate ?? metrics.arrivalRate;
    state.targetArrivalRate = targetArrivalRate;
    state.vehicles = state.vehicles.filter((vehicle) => vehicle.position < 2.55);

    for (const vehicle of state.vehicles) tickVehicle(vehicle, dt, signal, state.vehicles.filter((candidate) => candidate.active));
    for (const vehicle of state.vehicles) {
      vehicle.stoppedDuration = vehicle.speed <= STOPPED_SPEED_THRESHOLD
        ? vehicle.stoppedDuration + dt
        : 0;
    }

    if (state.vehicles.length >= MAX_VEHICLES_PER_AVENUE) return;
    if (!state.firstArrivalScheduled) {
      // Do not create an artificial simultaneous event at t=0. The first
      // observed arrival occurs after its mean interval, so q=N/Δt is stable.
      state.platoon.timer = 60 / Math.max(targetArrivalRate, 0.1);
      state.firstArrivalScheduled = true;
      return;
    }
    state.platoon.timer -= dt;
    if (state.platoon.timer > 0) return;

    if (state.platoon.remaining > 0) {
      if (this.trySpawn(state)) {
        state.spawned += 1;
        state.spawnEvents.push(state.measurementTime);
        state.platoon.remaining -= 1;
        state.platoon.timer = state.platoon.remaining > 0 ? state.platoon.intraInterval : state.platoon.gapAfter;
      } else state.platoon.timer = 0.2;
      return;
    }

    // Arrival generation is driven only by the configured demand input. The
    // measured arrivalRate is an output computed from these same spawn events.
    const schedule = getPlatoonSchedule(targetArrivalRate);
    if (this.trySpawn(state)) {
      state.spawned += 1;
      state.spawnEvents.push(state.measurementTime);
      state.platoon.remaining = schedule.size - 1;
      state.platoon.intraInterval = schedule.intraInterval;
      state.platoon.gapAfter = schedule.gapAfter;
      state.platoon.timer = schedule.size > 1 ? schedule.intraInterval : schedule.gapAfter;
    } else state.platoon.timer = 0.2;
  }

  private trySpawn(state: AvenueVehicles): boolean {
    // A small entry buffer prevents overlap while still allowing HIGH platoons
    // to preserve their target arrival rate.
    const tooClose = state.vehicles.some((vehicle) => vehicle.position < 0.06);
    if (tooClose) return false;
    state.vehicles.push(createVehicle(state.route));
    return true;
  }

  reset(): void { this.avenues = { A: initialState(ROUTES.ROUTE_A), B: initialState(ROUTES.ROUTE_B) }; }
}
