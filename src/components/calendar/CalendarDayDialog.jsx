import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import CalendarItemButton from './CalendarItemButton';
import { formatFullDate } from '@/lib/date';

export default function CalendarDayDialog({
  dateISO,
  items,
  coursesById,
  onSelectItem,
  onAddOn,
  open,
  onOpenChange,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {dateISO ? formatFullDate(dateISO) : 'Day'}
          </DialogTitle>
          <DialogDescription>
            {items.length === 0
              ? 'Nothing scheduled on this day yet.'
              : `${items.length} item${items.length === 1 ? '' : 's'} on this day.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {items.map((item) => (
            <CalendarItemButton
              key={item.key}
              item={item}
              course={item.courseId ? coursesById[item.courseId] : null}
              onSelect={onSelectItem}
            />
          ))}
        </div>

        <Button variant="outline" onClick={() => dateISO && onAddOn(dateISO)}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Add an event on this day
        </Button>
      </DialogContent>
    </Dialog>
  );
}