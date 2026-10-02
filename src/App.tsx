// ============================================================
// APP ROOT
// Assembles all panels and runs the simulation loop
// ============================================================

import { useState } from 'react';
import { Header } from './components/Header/Header';
import { TrafficVideoPanel } from './components/TrafficVideoPanel/TrafficVideoPanel';
import { IntersectionScene } from './three/IntersectionScene';
import { KPISection } from './components/KPICard/KPISection';
import { AIDecisionPanel } from './components/AIDecisionPanel/AIDecisionPanel';
import { CongestionChart } from './components/charts/CongestionChart/CongestionChart';
import { QueueChart } from './components/charts/QueueChart/QueueChart';
import { PhaseTimeline } from './components/charts/PhaseTimeline/PhaseTimeline';
import { SimulationControl } from './components/SimulationControl/SimulationControl';
import { useSimulationLoop } from './hooks/useSimulationLoop';
import { useTrafficStore } from './store/trafficStore';
import { VideoSourcePanel } from './components/VideoSourcePanel/VideoSourcePanel';
import { VideoAnalysisControls } from './components/VideoAnalysisControls/VideoAnalysisControls';
import type { AvenueId } from './types/traffic';
import type { VideoAsset, VideoPanelStatus } from './types/video';
import './index.css';
import './styles/components.css';

type DashboardTab = 'charts' | 'timeline';

export default function App() {
  const { reset } = useSimulationLoop();
  const [tab, setTab] = useState<DashboardTab>('charts');
  const dataSource = useTrafficStore((s) => s.dataSource);
  const [videos, setVideos] = useState<Record<AvenueId, VideoAsset | null>>({ A: null, B: null });
  const [videoStatus, setVideoStatus] = useState<VideoPanelStatus>('EMPTY');

  const selectVideo = (avenue: AvenueId, file: File) => {
    setVideos((current) => {
      if (current[avenue]) URL.revokeObjectURL(current[avenue]!.url);
      return { ...current, [avenue]: { name: file.name, size: file.size, url: URL.createObjectURL(file) } };
    });
    setVideoStatus('READY');
  };

  return (
    <div className="app-layout">
      <Header />

      <div className="app-body">
        {/* ── LEFT PANEL ── */}
        <aside className={`left-panel ${dataSource === 'VIDEO_AI' ? 'mode-video' : 'mode-simulation'}`}>
          {dataSource === 'SIMULATION' ? <>
            <TrafficVideoPanel avenue="A" />
            <TrafficVideoPanel avenue="B" />
            <SimulationControl onReset={reset} />
          </> : <>
            <VideoSourcePanel avenue="A" asset={videos.A} status={videoStatus} onSelect={(file) => selectVideo('A', file)} />
            <VideoSourcePanel avenue="B" asset={videos.B} status={videoStatus} onSelect={(file) => selectVideo('B', file)} />
            <VideoAnalysisControls canAnalyze={Boolean(videos.A && videos.B)} status={videoStatus} onAnalyze={() => setVideoStatus('ANALYZING')} onReset={reset} />
          </>}
        </aside>

        {/* ── CENTER PANEL ── */}
        <main className="center-panel">
          {/* 3D Scene */}
          <div className="scene-container">
            <IntersectionScene />
            <div className="scene-label">Gemelo digital · Intersección adaptativa</div>
          </div>

          {/* Bottom Dashboard */}
          <div className="bottom-dashboard">
            <div className="dashboard-tabs">
              <button
                className={`dashboard-tab ${tab === 'charts' ? 'active' : ''}`}
                onClick={() => setTab('charts')}
              >
                Analítica
              </button>
              <button
                className={`dashboard-tab ${tab === 'timeline' ? 'active' : ''}`}
                onClick={() => setTab('timeline')}
              >
                Línea de tiempo
              </button>
            </div>

            <div className="dashboard-content">
              {/* Always-visible KPIs */}
              <KPISection />

              {tab === 'charts' && (
                <>
                  <CongestionChart />
                  <QueueChart />
                </>
              )}

              {tab === 'timeline' && (
                <PhaseTimeline />
              )}

              {/* Always-visible AI Decision */}
              <AIDecisionPanel />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
