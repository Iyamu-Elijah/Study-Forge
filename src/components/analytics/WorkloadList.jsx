import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TypeBadge from '@/components/common/TypeBadge';
import { formatDateLabel, todayISO } from '@/lib/date';

export default function WorkloadList({ tasks }) {
  const today = todayISO();
  const grouped = tasks.reduce((acc, task) => {
    if (!acc[task.due_date]) acc[task.due_date] = [];
    acc[task.due_date].push(task);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort();

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="font-heading text-base">Upcoming workload</CardTitle>
        <p className="text-sm text-muted-foreground">
          Everything due in the next 14 days, by day.
        </p>
      </CardHeader>
      <CardContent>
        {dates.length === 0 ? (
          <div className="flex items-start gap-3 rounded-lg border border-dashed border-border p-4">
            <CalendarClock className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Nothing due in the next two weeks. Add deadlines so you can see busy periods coming.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {dates.map((date) => (
              <li key={date} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${date === today ? 'text-primary' : ''}`}>
                    {date === today ? 'Today' : formatDateLabel(date)}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {grouped[date].map((task) => (
                      <li key={task.id} className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/assignments?task=${task.id}`}
                          className="truncate text-sm hover:underline"
                        >
                          {task.title}
                        </Link>
                        <TypeBadge type={task.type} />
                      </li>
                    ))}
                  </ul>
                </div>
                <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                  {grouped[date].length} item{grouped[date].length === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}