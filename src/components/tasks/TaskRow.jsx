import { CheckCircle2, Circle, MoreVertical } from 'lucide-react';
import CourseChip from '@/components/common/CourseChip';
import TypeBadge from '@/components/common/TypeBadge';
import PriorityBadge from '@/components/common/PriorityBadge';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { dueLabel, isOverdue, minutesToLabel } from '@/lib/date';

export default function TaskRow({ task, course, onEdit, onDelete, onStatus, busy }) {
  const completed = task.status === 'completed';
  const overdue = isOverdue(task);

  return (
    <li
      className={`flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-start sm:justify-between ${
        overdue ? 'bg-destructive/[0.03]' : ''
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <button
          type="button"
          disabled={busy}
          aria-label={completed ? `Reopen “${task.title}”` : `Mark “${task.title}” as completed`}
          onClick={() => onStatus(task, completed ? 'not_started' : 'completed')}
          className="mt-0.5 shrink-0 disabled:opacity-40"
        >
          {completed ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" aria-hidden="true" />
          )}
        </button>

        <div className="min-w-0">
          <p
            className={`text-sm font-medium ${
              completed ? 'text-muted-foreground line-through' : ''
            }`}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <TypeBadge type={task.type} />
            <CourseChip course={course} />
            <span className={`text-xs ${overdue ? 'font-medium text-destructive' : 'text-muted-foreground'}`}>
              {dueLabel(task.due_date, task.due_time)}
            </span>
            {task.estimated_minutes ? (
              <span className="text-xs text-muted-foreground">
                ≈ {minutesToLabel(task.estimated_minutes)}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 pl-8 sm:pl-0">
        <PriorityBadge priority={task.priority} />
        <StatusBadge status={task.status} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Actions for ${task.title}`}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>Edit</DropdownMenuItem>
            {!completed && (
              <DropdownMenuItem onClick={() => onStatus(task, 'completed')}>
                Mark completed
              </DropdownMenuItem>
            )}
            {task.status !== 'in_progress' && (
              <DropdownMenuItem onClick={() => onStatus(task, 'in_progress')}>
                Mark in progress
              </DropdownMenuItem>
            )}
            {task.status !== 'not_started' && (
              <DropdownMenuItem onClick={() => onStatus(task, 'not_started')}>
                Mark not started
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(task)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}