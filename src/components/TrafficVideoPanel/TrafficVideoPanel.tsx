// ============================================================
// TRAFFIC INPUT PANEL v2
// Less HUD-sci-fi, more professional sensor display
// ============================================================

import { useTrafficStore } from '../../store/trafficStore';
import type { AvenueId } from '../../types/traffic';
import type { TrafficLevel } from '../../types/traffic';
import '../../styles/components.css';

interface TrafficVideoPanelProps {
  avenue: AvenueId;
}

function congestionColor(pct: number): string {
  if (pct > 70) return 'var(--signal-red)';
  if (pct > 40) return 'var(--signal-yellow)';
  return 'var(--signal-green)';
}

const DEMAND_LABEL: Record<TrafficLevel, string> = { LOW: 'BAJA', MEDIUM: 'MEDIA', HIGH: 'ALTA' };

export function TrafficVideoPanel({ avenue }: TrafficVideoPanelProps) {
  const metrics = useTrafficStore((s) => avenue === 'A' ? s.metricsA : s.metricsB);
  const signal  = useTrafficStore((s) => avenue === 'A' ? s.signalA  : s.signalB);
  const level   = useTrafficStore((s) => avenue === 'A' ? s.config.levelA : s.config.levelB);
  const arrivals = useTrafficStore((s) => avenue === 'A' ? s.arrivalBinsA : s.arrivalBinsB);

  const congPct  = Math.round(metrics.congestionIndex * 100);
  const sigColor = signal === 'GREEN' ? 'var(--signal-green)' : signal === 'YELLOW' ? 'var(--signal-yellow)' : 'var(--signal-red)';
  const avenueColor = avenue === 'A' ? 'var(--avenue-a)' : 'var(--avenue-b)';
  const maxArrivals = Math.max(1, ...arrivals);

  return (
    <div className="input-panel">
      {/* Header row */}
      <div className="input-panel-header">
        <div className="input-panel-title">
          Avenida {avenue}
          <span className="input-panel-badge">Fuente simulada</span>
        </div>
        <div className="input-signal-dot" style={{ background: sigColor }} title={signal} />
      </div>

      <div className="traffic-source-card" style={{ borderTopColor: avenueColor }}>
        <div className="traffic-source-top"><span>Demanda simulada</span><span style={{ color: avenueColor }}>{metrics.arrivalRate.toFixed(1)} veh/min</span></div>
        <div className="traffic-source-value">Demanda {DEMAND_LABEL[level]}</div>
        <div className="activity-title">Llegadas — últimos 60 s</div>
        <div className="activity-strip" aria-label={`Llegadas de Avenida ${avenue} durante los últimos 60 segundos`}>
          {arrivals.map((count, index) => <div key={index} className="activity-slot" title={`${count} vehículo${count === 1 ? '' : 's'} en 5 s`}><div className="activity-bar" style={{ height: `${count / maxArrivals * 100}%`, background: avenueColor }} /></div>)}
        </div>
        <div className="activity-axis"><span>60 s atrás</span><span>ahora</span></div>
      </div>

      {/* Metrics */}
      <div className="input-metrics">
        <div className="input-metric">
          <span className="input-metric-label" title="Índice normalizado basado en densidad de vehículos y proporción de vehículos detenidos.">Congestión estimada</span>
          <span className="input-metric-value" style={{ color: congestionColor(congPct) }}>
            {congPct}%
          </span>
        </div>
        <div className="input-congestion-bar">
          <div
            className="input-congestion-fill"
            style={{
              width: `${congPct}%`,
              background: congestionColor(congPct),
            }}
          />
        </div>
        <div className="input-metric">
          <span className="input-metric-label" title="Vehículos presentes actualmente en la zona de análisis.">Vehículos en zona</span>
          <span className="input-metric-value">{metrics.vehiclesInZone}</span>
        </div>
        <div className="input-metric">
          <span className="input-metric-label" title="Vehículos que ingresan por minuto, calculados sobre una ventana temporal móvil.">Tasa de llegada</span>
          <span className="input-metric-value">{metrics.arrivalRate.toFixed(1)}/min</span>
        </div>
      </div>
    </div>
  );
}
