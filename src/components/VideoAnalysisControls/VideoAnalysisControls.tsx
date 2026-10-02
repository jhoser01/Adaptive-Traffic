import type { VideoPanelStatus } from '../../types/video';
import '../../styles/components.css';

interface Props {
  canAnalyze: boolean;
  status: VideoPanelStatus;
  onAnalyze: () => void;
  onReset: () => void;
}

export function VideoAnalysisControls({ canAnalyze, status, onAnalyze, onReset }: Props) {
  const waiting = status === 'ANALYZING';
  return (
    <section className="video-analysis-controls">
      <div className="sim-control-title">Control de videos</div>
      <p>Sube ambos videos para preparar el análisis. Las detecciones reales llegarán desde el backend de visión.</p>
      <button className="action-btn primary video-analyze-btn" disabled={!canAnalyze || waiting} onClick={onAnalyze}>
        {waiting ? 'Procesando video' : 'Analizar videos'}
      </button>
      <div className="sim-action-row">
        <button className="action-btn" disabled>Iniciar simulación</button>
        <button className="action-btn" disabled>Pausar</button>
        <button className="action-btn" onClick={onReset}>Reiniciar</button>
      </div>
    </section>
  );
}
