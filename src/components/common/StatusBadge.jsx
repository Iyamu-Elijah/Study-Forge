import { STATUS_STYLES, TASK_STATUSES, labelFor } from '@/lib/constants';

export default function StatusBadge({ status }) {
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.not_started;
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${styles}`}
    >
      {labelFor(TASK_STATUSES, status)}
    </span>
  );
}