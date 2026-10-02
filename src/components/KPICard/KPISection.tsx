// ============================================================
// KPI SECTION v2 — Cleaner, no fake metrics
// ============================================================

import { useTrafficStore } from '../../store/trafficStore';
import '../../styles/components.css';

function KPIItem({
  value,
  label,
  unit,
  color,
  small,
}: {
  value: string;
  label: string;
  unit?: string;
  color?: string;
  small?: boolean;
}) {
  return (
    <div className="kpi-item">
      <div className="kpi-value" style={{
        color: color ?? 'var(--text-primary)',
        fontSize: small ? '20px' : undefined,
      }}>
        {value}
        {unit && <span className="kpi-unit">{unit}</span>}
      </div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

function congestionColor(pct: number): string {
  if (pct > 70) return 'var(--signal-red)';
  if (pct > 40) return 'var(--signal-yellow)';
  return 'var(--signal-green)';
}

function phaseDisplayName(phase: string): string {
  switch (phase) {
    case 'A_GREEN':    return 'A · Verde';
    case 'A_YELLOW':   return 'A · Amarillo';
    case 'ALL_RED_AB': return 'Todo rojo';
    case 'B_GREEN':    return 'B · Verde';
    case 'B_YELLOW':   return 'B · Amarillo';
    case 'ALL_RED_BA': return 'Todo rojo';
    default: return phase;
  }
}

function phaseColor(phase: string): string {
  if (phase.includes('GREEN'))  return 'var(--signal-green)';
  if (phase.includes('YELLOW')) return 'var(--signal-yellow)';
  return 'var(--signal-red)';
}

export function KPISection() {
  const metricsA = useTrafficStore((s) => s.metricsA);
  const metricsB = useTrafficStore((s) => s.metricsB);
  const queueA   = useTrafficStore((s) => s.queueA);
  const queueB   = useTrafficStore((s) => s.queueB);
  const phase    = useTrafficStore((s) => s.phase);
  const dataSource = useTrafficStore((s) => s.dataSource);
  const videoSimulationStarted = useTrafficStore((s) => s.videoSimulationStarted);

  if (dataSource === 'VIDEO_AI' && !videoSimulationStarted) return <div className="kpi-section">
    <KPIItem value="--" label="Congestión estimada A" />
    <KPIItem value="--" label="Congestión estimada B" />
    <KPIItem value="--" label="Cola simulada A" />
    <KPIItem value="--" label="Cola simulada B" />
    <KPIItem value="--" label="Fase actual" small />
  </div>;

  const congA = Math.round(metricsA.congestionIndex * 100);
  const congB = Math.round(metricsB.congestionIndex * 100);

  return (
    <div className="kpi-section">
      <KPIItem value={`${congA}`} label="Congestión estimada A" unit="%" color={congestionColor(congA)} />
      <KPIItem value={`${congB}`} label="Congestión estimada B" unit="%" color={congestionColor(congB)} />
      <KPIItem value={`${queueA}`} label="Cola simulada A" unit=" veh" />
      <KPIItem value={`${queueB}`} label="Cola simulada B" unit=" veh" />
      <KPIItem
        value={phaseDisplayName(phase)}
        label="Fase actual"
        color={phaseColor(phase)}
        small
      />
    </div>
  );
}
