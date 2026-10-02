// ============================================================
// SIMULATION LOOP HOOK
// Orchestrates all subsystems using requestAnimationFrame
// ============================================================

import { useEffect, useRef } from 'react';
import { useTrafficStore } from '../store/trafficStore';
import { MockTrafficProvider } from '../providers/MockTrafficProvider';
import { AdaptiveTrafficController } from '../control/AdaptiveTrafficController';
import { TrafficSimulation } from '../simulation/TrafficSimulation';
import { getSignalColors } from '../control/TrafficSignalStateMachine';
import { videoTrafficProvider } from '../providers/VideoTrafficProvider';

const HISTORY_INTERVAL = 0.5; // seconds between history snapshots

export function useSimulationLoop() {
  const store = useTrafficStore.getState;
  const providerRef = useRef(new MockTrafficProvider());
  const controllerRef = useRef(new AdaptiveTrafficController('A_GREEN'));
  const simulationRef = useRef(new TrafficSimulation());
  const lastTimeRef = useRef<number | null>(null);
  const historyTimerRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastSourceRef = useRef(useTrafficStore.getState().dataSource);

  useEffect(() => {
    const provider = providerRef.current;
    let controller = controllerRef.current;
    const sim = simulationRef.current;

    const loop = (timestamp: number) => {
      const s = store();

      if (s.dataSource !== lastSourceRef.current) {
        sim.reset();
        controllerRef.current = new AdaptiveTrafficController('A_GREEN');
        controller = controllerRef.current;
        lastSourceRef.current = s.dataSource;
        historyTimerRef.current = 0;
        if (s.dataSource === 'VIDEO_AI') useTrafficStore.getState().resetSimulation();
      }

      if (s.dataSource === 'VIDEO_AI' && !s.videoSimulationStarted) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }

      const rawDt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      if (!s.config.running) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const speed = s.config.speed ?? 1;
      const dt = rawDt * speed;

      // Sync provider levels from config
      const activeProvider = s.dataSource === 'VIDEO_AI' ? videoTrafficProvider : provider;
      activeProvider.setLevel('A', s.config.levelA);
      activeProvider.setLevel('B', s.config.levelB);
      activeProvider.tick(dt);

      // Provider supplies simulation demand; the Digital Twin measures output metrics.
      const demandA = activeProvider.getMetrics('A');
      const demandB = activeProvider.getMetrics('B');
      const measuredA = s.dataSource === 'VIDEO_AI' ? demandA : sim.getMetrics('A');
      const measuredB = s.dataSource === 'VIDEO_AI' ? demandB : sim.getMetrics('B');

      // Tick controller
      controller.tick(dt, measuredA, measuredB);
      const ctrlState = controller.getState();
      const colors = getSignalColors(ctrlState.phase);

      // Tick vehicle simulation
      sim.tick(dt, demandA, demandB, colors.a, colors.b);
      const vehicles = sim.getVehicles();
      const metricsA = sim.getMetrics('A');
      const metricsB = sim.getMetrics('B');

      // Advance sim time
      useTrafficStore.getState().advanceSimTime(dt);

      // Push to store
      useTrafficStore.getState().setMetrics(metricsA, metricsB);
      useTrafficStore.getState().setQueues(sim.getQueueCount('A'), sim.getQueueCount('B'));
      useTrafficStore.getState().setSignals(colors.a, colors.b);
      useTrafficStore.getState().setPhase(ctrlState.phase, ctrlState.phaseTimeRemaining);
      useTrafficStore.getState().setGreenAllocated(ctrlState.greenA, ctrlState.greenB);
      useTrafficStore.getState().setDecision(ctrlState.decision);
      useTrafficStore.getState().setVehicles([...vehicles]);
      useTrafficStore.getState().setArrivalBins(sim.getArrivalBins('A'), sim.getArrivalBins('B'));

      // History snapshot
      historyTimerRef.current += dt;
      if (historyTimerRef.current >= HISTORY_INTERVAL) {
        historyTimerRef.current = 0;
        useTrafficStore.getState().pushHistory();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [store]);

  // Expose reset function
  const reset = () => {
    simulationRef.current.reset();
    controllerRef.current = new AdaptiveTrafficController('A_GREEN');
    lastTimeRef.current = null;
    historyTimerRef.current = 0;
    useTrafficStore.getState().resetSimulation();
  };

  return { reset };
}
