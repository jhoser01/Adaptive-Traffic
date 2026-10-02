// ============================================================
// HEADER v2 — Clean, professional, less uppercase/cyan
// ============================================================

import { useTrafficStore } from '../../store/trafficStore';
import '../../styles/components.css';

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Horizontal road bar */}
      <rect x="0" y="11.5" width="28" height="5" fill="#1e3545" rx="1"/>
      {/* Vertical road bar */}
      <rect x="11.5" y="0" width="5" height="28" fill="#1e3545" rx="1"/>
      {/* Intersection square */}
      <rect x="11.5" y="11.5" width="5" height="5" fill="rgba(56,214,208,0.35)" rx="0.5"/>
      {/* Road lines */}
      <line x1="0" y1="14" x2="11" y2="14" stroke="#19B7A5" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="17" y1="14" x2="28" y2="14" stroke="#19B7A5" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="14" y1="0" x2="14" y2="11" stroke="#19B7A5" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="14" y1="17" x2="14" y2="28" stroke="#19B7A5" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Central node */}
      <circle cx="14" cy="14" r="2.8" fill="#19B7A5"/>
      <circle cx="14" cy="14" r="4.5" stroke="#19B7A5" strokeWidth="0.6" opacity="0.35"/>
      {/* Corner nodes */}
      <circle cx="3.5" cy="14" r="1" fill="#4DA8FF" opacity="0.7"/>
      <circle cx="24.5" cy="14" r="1" fill="#4DA8FF" opacity="0.7"/>
      <circle cx="14" cy="3.5" r="1" fill="#4DA8FF" opacity="0.7"/>
      <circle cx="14" cy="24.5" r="1" fill="#4DA8FF" opacity="0.7"/>
    </svg>
  );
}

export function Header() {
  const dataSource = useTrafficStore((s) => s.dataSource);
  const setDataSource = useTrafficStore((s) => s.setDataSource);

  return (
    <header className="header">
      <div className="header-logo">
        <Logo />
        <div>
          <div className="header-title">Adaptive Traffic</div>
          <div className="header-subtitle">Control inteligente de intersección</div>
        </div>
      </div>

      <div className="header-center">
        <button
          className={`mode-btn ${dataSource === 'SIMULATION' ? 'active' : ''}`}
          onClick={() => setDataSource('SIMULATION')}
        >
          Simulación
        </button>
        <button
          className={`mode-btn ${dataSource === 'VIDEO_AI' ? 'active' : ''}`}
          onClick={() => setDataSource('VIDEO_AI')}
        >
          Video IA
        </button>
      </div>

      <div className="header-right">
        <div className="live-indicator">
          <div className="live-dot" />
          <span>{dataSource === 'SIMULATION' ? 'Simulación activa' : 'Fuente de video preparada'}</span>
        </div>
      </div>
    </header>
  );
}
