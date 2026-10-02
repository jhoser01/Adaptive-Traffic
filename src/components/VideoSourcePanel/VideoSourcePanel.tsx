import { useRef } from 'react';
import type { AvenueId } from '../../types/traffic';
import type { VideoAnalysisResult, VideoAsset, VideoPanelStatus } from '../../types/video';
import { VisionOverlay } from '../VisionOverlay/VisionOverlay';
import '../../styles/components.css';

interface Props {
  avenue: AvenueId;
  asset: VideoAsset | null;
  status: VideoPanelStatus;
  result: VideoAnalysisResult | null;
  onSelect: (file: File) => void;
}

export function VideoSourcePanel({ avenue, asset, status, result, onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const accent = avenue === 'A' ? 'var(--avenue-a)' : 'var(--avenue-b)';

  return (
    <section className="video-source-panel" style={{ borderTopColor: accent }}>
      <div className="video-source-heading">
        <div><strong>VIDEO AVENIDA {avenue}</strong><span>Fuente de video</span></div>
        <span className="video-status-dot" style={{ background: status === 'EMPTY' ? 'var(--text-dim)' : accent }} />
      </div>
      <div className={`video-player-frame ${asset ? 'has-video' : ''}`}>
        {asset ? (
          <>
            <video src={result?.processed_video ?? asset.url} controls muted playsInline onLoadedMetadata={(event) => {
              const video = event.currentTarget;
              video.setAttribute('aria-label', `Video de Avenida ${avenue}`);
            }} />
            <VisionOverlay status={status} />
          </>
        ) : (
          <div className="video-dropzone">
            <span className="upload-symbol">↑</span>
            <strong>Arrastra un video aquí</strong>
            <span>MP4, MOV o AVI · formato 16:9 recomendado</span>
          </div>
        )}
      </div>
      <div className="video-source-actions">
        <div className="video-file-state">
          <span>{asset ? asset.name : 'Sin video cargado'}</span>
          <small>{asset ? (status === 'ANALYZING' ? `Analizando Avenida ${avenue}...` : result ? 'Video procesado con YOLO + ByteTrack' : `${Math.max(1, Math.round(asset.size / 1024))} KB · Pendiente de análisis`) : 'El video funciona como sensor de entrada'}</small>
        </div>
        <button className="action-btn" onClick={() => inputRef.current?.click()}>{asset ? 'Cambiar' : 'Subir video'}</button>
        <input ref={inputRef} type="file" hidden accept="video/mp4,video/quicktime,video/x-msvideo" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.currentTarget.value = '';
        }} />
      </div>
      <div className="video-placeholder-metrics">
        <span>Vehículos detectados <b>{result?.vehicle_count ?? '--'}</b></span>
        <span>Tasa de llegada <b>{result ? `${result.arrival_rate.toFixed(1)} veh/min` : '--'}</b></span>
        <span>Autos <b>{result?.class_counts.car ?? '--'}</b> · Motos <b>{result?.class_counts.motorcycle ?? '--'}</b></span>
        <span>Buses <b>{result?.class_counts.bus ?? '--'}</b> · Camiones <b>{result?.class_counts.truck ?? '--'}</b></span>
      </div>
    </section>
  );
}
