// ============================================================
// VIDEO TRAFFIC PROVIDER (stub)
// Placeholder for future YOLO integration
// ============================================================
// When ready, replace MockTrafficProvider with this class.
// The architecture requires NO changes to controller, store, or UI.

import type { TrafficProvider } from './TrafficProvider';
import type { TrafficMetrics, TrafficLevel } from '../types/traffic';

export class VideoTrafficProvider implements TrafficProvider {
  private lastMetrics: Record<'A' | 'B', TrafficMetrics | null> = {
    A: null,
    B: null,
  };

  // Called by the Python bridge (e.g., WebSocket) when YOLO produces metrics
  ingestMetrics(avenue: 'A' | 'B', metrics: TrafficMetrics): void {
    this.lastMetrics[avenue] = metrics;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setLevel(_avenue: 'A' | 'B', _level: TrafficLevel): void {
    // Video provider ignores manual level overrides
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tick(_dt: number): void {
    // Video provider is push-based, not tick-based
  }

  getMetrics(avenue: 'A' | 'B'): TrafficMetrics {
    const m = this.lastMetrics[avenue];
    if (!m) {
      return {
        timestamp: Date.now(),
        vehiclesInZone: 0,
        targetArrivalRate: 0,
        arrivalRate: 0,
        normalizedDensity: 0,
        stoppedRatio: 0,
        congestionIndex: 0,
      };
    }
    return m;
  }
}

// Shared input provider used only after the user starts the video-driven twin.
export const videoTrafficProvider = new VideoTrafficProvider();
