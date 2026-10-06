// ============================================================
// VIDEO TRAFFIC PROVIDER
// Receives traffic demand derived from the video-analysis pipeline.
// ============================================================

import type { TrafficProvider } from './TrafficProvider';
import type { TrafficMetrics, TrafficLevel } from '../types/traffic';

export class VideoTrafficProvider implements TrafficProvider {
  private lastMetrics: Record<'A' | 'B', TrafficMetrics | null> = {
    A: null,
    B: null,
  };

  // Stores the metrics produced by the video-analysis pipeline.
  ingestMetrics(avenue: 'A' | 'B', metrics: TrafficMetrics): void {
    this.lastMetrics[avenue] = metrics;
  }

  // Manual demand presets do not apply to the video source.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setLevel(_avenue: 'A' | 'B', _level: TrafficLevel): void {
  }

  // Video metrics are updated when a new analysis result arrives.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tick(_dt: number): void {
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
