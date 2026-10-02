// ============================================================
// QUEUE VISUALIZATION v2
// Bar visualization instead of tiny line chart
// ============================================================

import { useTrafficStore } from '../../../store/trafficStore';
import '../../../styles/components.css';

export function QueueChart() {
  const queueA = useTrafficStore((s) => s.queueA);
  const queueB = useTrafficStore((s) => s.queueB);
  const dataSource = useTrafficStore((s) => s.dataSource);
  
  // Max scale to visually represent
  const MAX_Q = 20;

  const renderBlocks = (count: number, color: string) => {
    const blocks = [];
    for (let i = 0; i < MAX_Q; i++) {
      const active = i < count;
      blocks.push(
        <div
          key={i}
          style={{
            flex: 1,
            height: '100%',
            background: active ? color : 'rgba(255,255,255,0.03)',
            borderRadius: 1,
            transition: 'background 0.3s ease',
            marginRight: i === MAX_Q - 1 ? 0 : 2
          }}
        />
      );
    }
    return blocks;
  };

  return (
    <div className="chart-panel" style={{ flex: 1 }}>
      <div className="chart-title">Cola simulada</div>
      
      <div className="chart-area" style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
        
        {/* Avenue A */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Avenida A</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--avenue-a)' }}>{dataSource === 'VIDEO_AI' ? '--' : `${queueA} veh`}</span>
          </div>
          <div style={{ display: 'flex', height: 12, width: '100%' }}>
            {renderBlocks(queueA, 'var(--avenue-a)')}
          </div>
        </div>

        {/* Avenue B */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Avenida B</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--avenue-b)' }}>{dataSource === 'VIDEO_AI' ? '--' : `${queueB} veh`}</span>
          </div>
          <div style={{ display: 'flex', height: 12, width: '100%' }}>
            {renderBlocks(queueB, 'var(--avenue-b)')}
          </div>
        </div>

      </div>
    </div>
  );
}
