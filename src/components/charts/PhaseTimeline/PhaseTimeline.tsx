import { useTrafficStore } from '../../../store/trafficStore';
import type { Phase, SignalColor } from '../../../types/traffic';
import { getSignalColors } from '../../../control/TrafficSignalStateMachine';
import '../../../styles/components.css';

const COLOR: Record<SignalColor, string> = { GREEN: '#2FC66D', YELLOW: '#F0B83F', RED: '#E85050' };
const LABEL: Record<SignalColor, string> = { GREEN: 'Verde', YELLOW: 'Amarillo', RED: 'Rojo' };

interface CycleSlot { phase: Phase; duration: number }
interface VisualSegment { state: SignalColor; duration: number }

function mergeStates(slots: CycleSlot[], avenue: 'A' | 'B'): VisualSegment[] {
  return slots.reduce<VisualSegment[]>((segments, slot) => {
    const colors = getSignalColors(slot.phase);
    const state = avenue === 'A' ? colors.a : colors.b;
    const previous = segments[segments.length - 1];
    if (previous?.state === state) previous.duration += slot.duration;
    else segments.push({ state, duration: slot.duration });
    return segments;
  }, []);
}

export function PhaseTimeline() {
  const phase = useTrafficStore((s) => s.phase);
  const remaining = useTrafficStore((s) => s.phaseTimeRemaining);
  const greenA = useTrafficStore((s) => s.greenAllocatedA);
  const greenB = useTrafficStore((s) => s.greenAllocatedB);
  const stateA = useTrafficStore((s) => s.signalA);
  const stateB = useTrafficStore((s) => s.signalB);

  const slots: CycleSlot[] = [
    { phase: 'A_GREEN', duration: greenA }, { phase: 'A_YELLOW', duration: 3 }, { phase: 'ALL_RED_AB', duration: 1 },
    { phase: 'B_GREEN', duration: greenB }, { phase: 'B_YELLOW', duration: 3 }, { phase: 'ALL_RED_BA', duration: 1 },
  ];
  const totalDuration = slots.reduce((sum, slot) => sum + slot.duration, 0);
  const activeIndex = slots.findIndex((slot) => slot.phase === phase);
  const activeDuration = slots[activeIndex]?.duration ?? 1;
  const elapsedBefore = slots.slice(0, activeIndex).reduce((sum, slot) => sum + slot.duration, 0);
  const elapsedCurrent = Math.min(activeDuration, Math.max(0, activeDuration - remaining));
  const nowPct = ((elapsedBefore + elapsedCurrent) / totalDuration) * 100;

  const renderRow = (avenue: 'A' | 'B') => (
    <div className="signal-timeline-row">
      <div className="signal-timeline-row-label">Semáforo {avenue}</div>
      <div className="signal-timeline-track">
        {mergeStates(slots, avenue).map((segment, index) => (
          <div key={`${avenue}-${index}`} className="signal-timeline-segment" style={{ width: `${segment.duration / totalDuration * 100}%`, background: COLOR[segment.state] }}>
            <span>{LABEL[segment.state]}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="phase-timeline-panel">
      <div className="phase-timeline-title">Línea de tiempo</div>
      <div className="signal-timeline-visual">
        <div className="signal-timeline-now" style={{ left: `calc(112px + (100% - 112px) * ${nowPct / 100})` }}><span>AHORA</span></div>
        {renderRow('A')}
        {renderRow('B')}
      </div>
      <div className="signal-current-grid">
        <div><span>Avenida A</span><strong style={{ color: COLOR[stateA] }}><i style={{ background: COLOR[stateA] }} />{LABEL[stateA]}</strong></div>
        <div><span>Avenida B</span><strong style={{ color: COLOR[stateB] }}><i style={{ background: COLOR[stateB] }} />{LABEL[stateB]}</strong></div>
      </div>
      <div className="phase-timer">Tiempo restante: {remaining.toFixed(1)} s</div>
    </div>
  );
}
