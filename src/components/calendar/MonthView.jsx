import CalendarItemButton from './CalendarItemButton';
import { formatDayNumber, inMonth, monthGridISO, todayISO } from '@/lib/date';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MonthView({ anchor, itemsByDate, coursesById, onSelectItem, onSelectDay, onAddOn }) {
  const days = monthGridISO(anchor);
  const today = todayISO();

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border bg-muted/50">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((date) => {
          const items = itemsByDate[date] ?? [];
          const visible = items.slice(0, 2);
          const extra = items.length - visible.length;
          const isToday = date === today;
          const dimmed = !inMonth(date, anchor);

          return (
            <div
              key={date}
              className={`min-h-[6.5rem] border-b border-r border-border p-1 last:border-r-0 ${
                dimmed ? 'bg-muted/30' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onAddOn(date)}
                  title={`Add an event on ${date}`}
                  aria-label={`Add an event on ${date}`}
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors hover:bg-muted ${
                    isToday ? 'bg-primary text-primary-foreground hover:bg-primary' : 'text-foreground'
                  } ${dimmed ? 'text-muted-foreground' : ''}`}
                >
                  {formatDayNumber(date)}
                </button>
              </div>

              <div className="mt-1 space-y-1">
                {visible.map((item) => (
                  <CalendarItemButton
                    key={item.key}
                    item={item}
                    course={item.courseId ? coursesById[item.courseId] : null}
                    onSelect={onSelectItem}
                  />
                ))}
                {extra > 0 && (
                  <button
                    type="button"
                    onClick={() => onSelectDay(date)}
                    className="w-full rounded-md px-1.5 text-left text-[11px] font-medium text-muted-foreground hover:underline"
                  >
                    +{extra} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}