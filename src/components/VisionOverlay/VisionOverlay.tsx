import type { VideoPanelStatus } from '../../types/video';

export function VisionOverlay({ status }: { status: VideoPanelStatus }) {
  if (status === 'EMPTY' || status === 'READY') return null;
  return (
    <div className="vision-overlay" aria-live="polite">
      <span>{status === 'ANALYZING' ? 'Procesando video' : 'Análisis completado'}</span>
      <small>{status === 'ANALYZING' ? 'Esperando conexión con el backend de visión' : 'Métricas disponibles cuando finalice el análisis'}</small>
    </div>
  );
}
