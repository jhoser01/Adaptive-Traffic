// ============================================================
// SIMULATION CONTROL PANEL
// ============================================================

import { useTrafficStore } from '../../store/trafficStore';
import type { TrafficLevel } from '../../types/traffic';
import '../../styles/components.css';

interface SimControlProps {
  onReset: () => void;
}

type Speed = 1 | 2 | 4;
const SPEEDS: Speed[] = [1, 2, 4];
const LEVELS: TrafficLevel[] = ['LOW', 'MEDIUM', 'HIGH'];
const LEVEL_LABEL: Record<TrafficLevel, string> = { LOW: 'BAJA', MEDIUM: 'MEDIA', HIGH: 'ALTA' };

export function SimulationControl({ onReset }: SimControlProps) {
  const config = useTrafficStore((s) => s.config);
  const setLevelA = useTrafficStore((s) => s.setLevelA);
  const setLevelB = useTrafficStore((s) => s.setLevelB);
  const setConfig = useTrafficStore((s) => s.setConfig);

  return (
    <div className="sim-control">
      <div className="sim-control-title">Control de simulación</div>

      {/* Avenue A level */}
      <div className="sim-control-row">
        <span className="sim-control-label">Avenida A</span>
        <div className="seg-buttons">
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              className={`seg-btn ${config.levelA === lvl ? 'active' : ''}`}
              onClick={() => setLevelA(lvl)}
            >
              {LEVEL_LABEL[lvl]}
            </button>
          ))}
        </div>
      </div>

      {/* Avenue B level */}
      <div className="sim-control-row">
        <span className="sim-control-label">Avenida B</span>
        <div className="seg-buttons">
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              className={`seg-btn ${config.levelB === lvl ? 'active' : ''}`}
              onClick={() => setLevelB(lvl)}
            >
              {LEVEL_LABEL[lvl]}
            </button>
          ))}
        </div>
      </div>

      {/* Speed */}
      <div className="sim-control-row">
        <span className="sim-control-label">Velocidad</span>
        <div className="seg-buttons">
          {SPEEDS.map((s) => (
            <button
              key={s}
              className={`seg-btn ${config.speed === s ? 'active' : ''}`}
              onClick={() => setConfig({ speed: s })}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="sim-action-row">
        <button
          className={`action-btn primary`}
          onClick={() => setConfig({ running: !config.running })}
        >
          {config.running ? 'Pausar' : 'Iniciar'}
        </button>
        <button className="action-btn" onClick={onReset}>
          Reiniciar
        </button>
      </div>
    </div>
  );
}
