import { EVENT_TYPES, TASK_TYPES, TYPE_STYLES } from '@/lib/constants';

const LABELS = [...TASK_TYPES, ...EVENT_TYPES].reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

export default function TypeBadge({ type }) {
  const styles = TYPE_STYLES[type] ?? TYPE_STYLES.other;
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${styles}`}
    >
      {LABELS[type] ?? 'Other'}
    </span>
  );
}