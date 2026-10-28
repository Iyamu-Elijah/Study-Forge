import { Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import TypeBadge from '@/components/common/TypeBadge';
import CourseChip from '@/components/common/CourseChip';
import { formatFullDate, formatTimeLabel } from '@/lib/date';

export default function EventDetailsDialog({ event, course, open, onOpenChange, onEdit, onDelete }) {
  if (!event) return null;

  const when = [
    formatFullDate(event.start_date),
    event.all_day ? 'All day' : event.start_time ? formatTimeLabel(event.start_time) : null,
    event.end_date && event.end_date !== event.start_date ? `until ${formatFullDate(event.end_date)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">{event.title}</DialogTitle>
          <DialogDescription>{when}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={event.type} />
          <CourseChip course={course} fallback="No course" />
        </div>

        <dl className="space-y-2 text-sm">
          {event.location && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Location</dt>
              <dd>{event.location}</dd>
            </div>
          )}
          {event.description && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</dt>
              <dd className="whitespace-pre-wrap">{event.description}</dd>
            </div>
          )}
        </dl>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onDelete(event)} className="text-destructive">
            <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Delete
          </Button>
          <Button onClick={() => onEdit(event)}>
            <Pencil className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Edit event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}