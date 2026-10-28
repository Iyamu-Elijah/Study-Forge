import { Plus } from 'lucide-react';
import CalendarItemButton from './CalendarItemButton';
import { formatDateLabel, todayISO, weekDaysISO } from '@/lib/date';

export default function WeekView({ anchor, itemsByDate, coursesById, onSelectItem, onAddOn }) {
  const days = weekDaysISO(anchor);
  const today = todayISO();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
      {days.map((date) => {
        const items = itemsByDate[date] ?? [];
        const isToday = date === today;
        return (
          <section
            key={date}
            aria-label={formatDateLabel(date)}
            className={`rounded-xl border p-3 ${
              isToday ? 'border-primary/40 bg-primary/[0.04]' : 'border-border bg-card'
            }`}
          >
            <header className="flex items-center justify-between gap-2">
              <div>
                <p className="font-heading text-sm font-semibold">{formatDateLabel(date)}</p>
                {isToday && <p className="text-[11px] font-medium text-primary">Today</p>}
              </div>
              <button
                type="button"
                onClick={() => onAddOn(date)}
                aria-label={`Add an event on ${formatDateLabel(date)}`}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            <div className="mt-2 space-y-1.5">
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nothing scheduled</p>
              ) : (
                items.map((item) => (
                  <CalendarItemButton
                    key={item.key}
                    item={item}
                    course={item.courseId ? coursesById[item.courseId] : null}
                    onSelect={onSelectItem}
                  />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}