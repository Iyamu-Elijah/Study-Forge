import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CourseChip from '@/components/common/CourseChip';
import { formatDateLabel, minutesToLabel } from '@/lib/date';

const timeLabel = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return format(date, 'h:mm a');
};

export default function SessionHistoryList({ sessions, coursesById, onDelete }) {
  const grouped = sessions.reduce((acc, session) => {
    const key = session.session_date || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(session);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1)).slice(0, 7);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">Recent sessions</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sessions recorded yet. Finish a focus session and confirm it to start building your
            history.
          </p>
        ) : (
          <div className="space-y-4">
            {dates.map((date) => {
              const daySessions = grouped[date];
              const total = daySessions.reduce((sum, item) => sum + (item.duration_minutes || 0), 0);
              return (
                <section key={date}>
                  <header className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <span>{formatDateLabel(date)}</span>
                    <span className="tabular-nums">{minutesToLabel(total)}</span>
                  </header>
                  <ul className="mt-2 space-y-2">
                    {daySessions.map((session) => (
                      <li
                        key={session.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium tabular-nums">
                            {minutesToLabel(session.duration_minutes)}
                            {timeLabel(session.started_at) ? (
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                started {timeLabel(session.started_at)}
                              </span>
                            ) : null}
                          </p>
                          <div className="mt-1">
                            <CourseChip
                              course={session.course_id ? coursesById[session.course_id] : null}
                              fallback="No course"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${minutesToLabel(session.duration_minutes)} session`}
                          onClick={() => onDelete(session)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}