import { Link } from 'react-router-dom';
import { Circle } from 'lucide-react';
import CourseChip from '@/components/common/CourseChip';
import TypeBadge from '@/components/common/TypeBadge';
import PriorityBadge from '@/components/common/PriorityBadge';
import { dueLabel, isOverdue } from '@/lib/date';

export default function DeadlineRow({ task, course, onComplete, busy }) {
  const overdue = isOverdue(task);

  return (
    <li className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
      <button
        type="button"
        onClick={() => onComplete(task)}
        disabled={busy}
        aria-label={`Mark “${task.title}” as completed`}
        title="Mark as completed"
        className="mt-0.5 shrink-0 rounded-full text-muted-foreground transition-colors hover:text-primary disabled:opacity-40"
      >
        <Circle className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/assignments?task=${task.id}`}
            className="truncate text-sm font-medium hover:underline"
          >
            {task.title}
          </Link>
          <TypeBadge type={task.type} />
          {task.priority === 'high' && <PriorityBadge priority="high" />}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <CourseChip course={course} />
          <span className={overdue ? 'font-medium text-destructive' : 'text-muted-foreground'}>
            {dueLabel(task.due_date, task.due_time)}
          </span>
        </div>
      </div>
    </li>
  );
}