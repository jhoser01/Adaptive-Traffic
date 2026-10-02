import type { VideoPanelStatus } from '../../types/video';
import '../../styles/components.css';

interface Props {
  canAnalyze: boolean;
  status: VideoPanelStatus;
  canStart: boolean;
  onAnalyze: () => void;
  onStart: () => void;
  onReset: () => void;
}

export function VideoAnalysisControls({ canAnalyze, status, canStart, onAnalyze, onStart, onReset }: Props) {
  const waiting = status === 'ANALYZING';
  return (
    <section className="video-analysis-controls">
      <div className="sim-control-title">Control de videos</div>
      <p>Sube ambos videos y analízalos con YOLO + ByteTrack para obtener la demanda de cada avenida.</p>
      <button className="action-btn primary video-analyze-btn" disabled={!canAnalyze || waiting} onClick={onAnalyze}>
        {waiting ? 'Analizando Avenida A y B...' : 'Analizar videos'}
      </button>
      <div className="sim-action-row">
        <button className="action-btn" disabled={!canStart} onClick={onStart}>Iniciar simulación</button>
        <button className="action-btn" disabled>Pausar</button>
        <button className="action-btn" onClick={onReset}>Reiniciar</button>
      </div>
    </section>
  );
}
