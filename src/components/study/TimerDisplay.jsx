import { formatClock } from '@/lib/date';

const PHASE_LABELS = {
  focus: 'Focus',
  short_break: 'Short break',
  long_break: 'Long break',
};

const STATUS_LABELS = {
  idle: 'Ready when you are',
  running: 'In progress',
  paused: 'Paused',
  completed: 'Finished',
};

export default function TimerDisplay({ phase, status, remaining, progress }) {
  const size = 208;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" aria-live="polite">
        {PHASE_LABELS[phase]}
      </p>

      <div className="relative mt-3" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={phase === 'focus' ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-2))'}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            className="transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-heading text-4xl font-semibold tabular-nums" aria-label="Time remaining">
            {formatClock(remaining)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{STATUS_LABELS[status]}</p>
        </div>
      </div>
    </div>
  );
}