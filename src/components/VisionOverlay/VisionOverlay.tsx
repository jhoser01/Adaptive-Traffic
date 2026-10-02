import type { VideoPanelStatus } from '../../types/video';

export function VisionOverlay({ status }: { status: VideoPanelStatus }) {
  if (status === 'EMPTY' || status === 'READY' || status === 'ANALYZED') return null;
  return (
    <div className="vision-overlay" aria-live="polite">
      <span>{status === 'ANALYZING' ? 'Analizando con IA' : 'Error de análisis'}</span>
      <small>{status === 'ANALYZING' ? 'YOLO y ByteTrack procesando el video' : 'Revisa que el backend de visión esté activo'}</small>
    </div>
  );
}
