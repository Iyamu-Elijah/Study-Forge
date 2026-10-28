import { PRIORITIES, PRIORITY_STYLES, labelFor } from '@/lib/constants';

export default function PriorityBadge({ priority }) {
  const styles = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.medium;
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${styles}`}
    >
      {labelFor(PRIORITIES, priority)}
    </span>
  );
}