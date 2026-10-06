// ============================================================
// CONGESTION CHART
// ============================================================

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useTrafficStore } from '../../../store/trafficStore';
import '../../../styles/components.css';

export function CongestionChart() {
  const history = useTrafficStore((s) => s.congestionHistory);
  const dataSource = useTrafficStore((s) => s.dataSource);

  const data = history.map((d) => ({
    t: Math.round(d.time),
    A: Math.round(d.congestionA * 100),
    B: Math.round(d.congestionB * 100),
  }));

  return (
    <div className="chart-panel" style={{ flex: 1.5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="chart-title" style={{ marginBottom: 0 }}>Historial de congestión estimada</div>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <div className="chart-legend-dot" style={{ background: '#1CB7A7' }} /> Avenida A
          </div>
          <div className="chart-legend-item">
            <div className="chart-legend-dot" style={{ background: '#4D82E8' }} /> Avenida B
          </div>
        </div>
      </div>
      <div className="chart-area">
        {dataSource === 'VIDEO_AI' && <div className="chart-empty-state">Pendiente de análisis de video</div>}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              domain={['dataMin', 'dataMax']}
              tick={{ fontSize: 9, fill: 'var(--text-dim)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}s`}
              minTickGap={20}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: 'var(--text-dim)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip
              isAnimationActive={false}
              contentStyle={{
                background: 'rgba(20,32,43,0.97)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                fontSize: 11,
                color: 'var(--text-primary)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}
              itemStyle={{ color: 'var(--text-primary)' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(val: any, name: any) => [`${val}%`, `Avenida ${name}`]}
              labelFormatter={(t) => `${t}s`}
            />
            <Line
              type="monotone"
              dataKey="A"
              stroke="#1CB7A7"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="B"
              stroke="#4D82E8"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
