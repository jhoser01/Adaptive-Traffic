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
import type { VideoAnalysisResult } from './types/video';
import { analyzeVideo, type CountDirection } from './services/visionApi';
import { videoTrafficProvider } from './providers/VideoTrafficProvider';
import './index.css';
import './styles/components.css';

type DashboardTab = 'charts' | 'timeline';

export default function App() {
  const { reset } = useSimulationLoop();
  const [tab, setTab] = useState<DashboardTab>('charts');
  const dataSource = useTrafficStore((s) => s.dataSource);
  const config = useTrafficStore((s) => s.config);
  const setConfig = useTrafficStore((s) => s.setConfig);
  const setVideoSimulationStarted = useTrafficStore((s) => s.setVideoSimulationStarted);
  const videoSimulationStarted = useTrafficStore((s) => s.videoSimulationStarted);
  const [videos, setVideos] = useState<Record<AvenueId, VideoAsset | null>>({ A: null, B: null });
  const [results, setResults] = useState<Record<AvenueId, VideoAnalysisResult | null>>({ A: null, B: null });
  const [videoStatus, setVideoStatus] = useState<VideoPanelStatus>('EMPTY');
  const [videoError, setVideoError] = useState<string | null>(null);
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);

  const selectVideo = (avenue: AvenueId, file: File) => {
    setVideos((current) => {
      if (current[avenue]) URL.revokeObjectURL(current[avenue]!.url);
      return { ...current, [avenue]: { file, name: file.name, size: file.size, url: URL.createObjectURL(file), direction: 'down' } };
    });
    setResults((current) => ({ ...current, [avenue]: null }));
    setVideoSimulationStarted(false);
    setVideoError(null);
    setAnalysisMessage(null);
    setVideoStatus('READY');
  };

  const changeDirection = (avenue: AvenueId, direction: CountDirection) => {
    setVideos((current) => current[avenue] ? { ...current, [avenue]: { ...current[avenue]!, direction } } : current);
    setResults((current) => ({ ...current, [avenue]: null }));
    setVideoSimulationStarted(false);
  };

  const analyzeVideos = async () => {
    if (!videos.A || !videos.B) return;
    setVideoStatus('ANALYZING');
    setVideoError(null);
    try {
      setAnalysisMessage('Analizando Avenida A...');
      const resultA = await analyzeVideo('A', videos.A.file, videos.A.direction);
      setResults((current) => ({ ...current, A: resultA }));
      setAnalysisMessage('Avenida A completada. Analizando Avenida B...');
      const resultB = await analyzeVideo('B', videos.B.file, videos.B.direction);
      setResults((current) => ({ ...current, B: resultB }));
      setAnalysisMessage('Avenida A y Avenida B completadas.');
      setVideoStatus('ANALYZED');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido durante el análisis.';
      setVideoError(message);
      setAnalysisMessage(null);
      setVideoStatus('ERROR');
    }
  };

  const startVideoSimulation = () => {
    if (!results.A || !results.B) return;
    videoTrafficProvider.ingestMetrics('A', { timestamp: Date.now(), vehiclesInZone: 0, arrivalRate: results.A.arrival_rate, normalizedDensity: 0, stoppedRatio: 0, congestionIndex: 0 });
    videoTrafficProvider.ingestMetrics('B', { timestamp: Date.now(), vehiclesInZone: 0, arrivalRate: results.B.arrival_rate, normalizedDensity: 0, stoppedRatio: 0, congestionIndex: 0 });
    reset();
    setConfig({ running: true });
    setVideoSimulationStarted(true);
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
            <VideoSourcePanel avenue="A" asset={videos.A} status={videoStatus} result={results.A} error={videoError} onSelect={(file) => selectVideo('A', file)} onDirectionChange={(direction) => changeDirection('A', direction)} />
            <VideoSourcePanel avenue="B" asset={videos.B} status={videoStatus} result={results.B} error={videoError} onSelect={(file) => selectVideo('B', file)} onDirectionChange={(direction) => changeDirection('B', direction)} />
            <VideoAnalysisControls canAnalyze={Boolean(videos.A && videos.B)} status={videoStatus} canStart={Boolean(results.A && results.B)} running={config.running} simulationStarted={videoSimulationStarted} message={videoError ?? analysisMessage ?? undefined} onAnalyze={analyzeVideos} onStart={startVideoSimulation} onTogglePause={() => setConfig({ running: !config.running })} onReset={reset} />
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

              {/* Adaptive control panel */}
              <AIDecisionPanel />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
