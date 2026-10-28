import { formatTimeLabel } from '@/lib/date';
import { EVENT_TYPES, TASK_TYPES } from '@/lib/constants';

const LABELS = [...TASK_TYPES, ...EVENT_TYPES].reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

const KIND_STYLES = {
  task: 'border-primary/25 bg-primary/10 text-primary hover:bg-primary/20',
  event: 'border-accent/40 bg-accent/15 text-accent-foreground hover:bg-accent/25',
};

export default function CalendarItemButton({ item, course, onSelect, showTime = true }) {
  const kindLabel = item.kind === 'task' ? 'Deadline' : 'Event';
  const description = `${kindLabel}: ${LABELS[item.type] ?? 'Academic'} — ${item.title}${
    item.time ? ` at ${formatTimeLabel(item.time)}` : ''
  }${course ? `, ${course.code}` : ''}`;

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      title={description}
      className={`w-full truncate rounded-md border px-1.5 py-0.5 text-left text-[11px] font-medium transition-colors ${KIND_STYLES[item.kind]}`}
    >
      <span className="sr-only">{description}</span>
      <span aria-hidden="true">
        {item.kind === 'task' ? '◆' : '●'}
        {showTime && item.time ? ` ${formatTimeLabel(item.time)} ` : ' '}
        {item.title}
      </span>
    </button>
  );
}