// ============================================================
// ADAPTIVE CONTROL PANEL
// ============================================================

import { useTrafficStore } from '../../store/trafficStore';
import '../../styles/components.css';

export function AIDecisionPanel() {
  const decision = useTrafficStore((s) => s.decision);
  const dataSource = useTrafficStore((s) => s.dataSource);
  const videoSimulationStarted = useTrafficStore((s) => s.videoSimulationStarted);
  if (dataSource === 'VIDEO_AI' && !videoSimulationStarted) return <div className="ai-panel"><div className="ai-header"><span className="ai-label">Control adaptativo</span></div><div className="ai-reason">Analiza ambos videos e inicia la simulación para aplicar la demanda detectada.</div></div>;

  const demandAPct = Math.round(decision.demandA * 100);
  const demandBPct = Math.round(decision.demandB * 100);

  const priorityLabel =
    decision.priorityAvenue === 'BALANCED'
      ? 'Demanda equilibrada'
      : `Priorizando Avenida ${decision.priorityAvenue}`;

  const isPriorityA = decision.priorityAvenue === 'A';
  const isPriorityB = decision.priorityAvenue === 'B';

  return (
    <div className="ai-panel">
      <div className="ai-header">
        <span className="ai-label">Control adaptativo</span>
      </div>

      <div>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Prioridad
        </div>
        <div className="ai-priority">
          <span style={{ color: decision.priorityAvenue === 'BALANCED' ? 'var(--avenue-b)' : 'var(--avenue-a)' }}>
            {priorityLabel}
          </span>
        </div>
      </div>

      {/* Demand comparison */}
      <div className="ai-demand-row">
        <div className="ai-demand-item">
          <span className="ai-demand-label">Avenida A</span>
          <div className="ai-demand-bar-track">
            <div
              className="ai-demand-bar-fill"
              style={{
                width: `${demandAPct}%`,
                background: isPriorityA ? 'var(--avenue-a)' : 'var(--avenue-b)',
              }}
            />
          </div>
          <span className="ai-demand-pct">{demandAPct}%</span>
        </div>
        <div className="ai-demand-item">
          <span className="ai-demand-label">Avenida B</span>
          <div className="ai-demand-bar-track">
            <div
              className="ai-demand-bar-fill"
              style={{
                width: `${demandBPct}%`,
                background: isPriorityB ? 'var(--avenue-a)' : 'var(--avenue-b)',
              }}
            />
          </div>
          <span className="ai-demand-pct">{demandBPct}%</span>
        </div>
      </div>

      {/* Allocated green times */}
      <div className="ai-green-times">
        <div className="ai-green-item">
          <div className="ai-green-val">{decision.nextGreenA.toFixed(1)}s</div>
          <div className="ai-green-label">Próximo verde A</div>
        </div>
        <div className="ai-green-item">
          <div className="ai-green-val">{decision.nextGreenB.toFixed(1)}s</div>
          <div className="ai-green-label">Próximo verde B</div>
        </div>
      </div>

      {/* Decision reason */}
      <div className="ai-reason">{decision.reason}</div>
    </div>
  );
}
