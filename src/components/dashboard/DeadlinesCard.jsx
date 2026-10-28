import { Link } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DeadlineRow from './DeadlineRow';

function Section({ title, tasks, coursesById, onComplete, busyId, emptyText, tone }) {
  return (
    <section>
      <h3
        className={`text-xs font-semibold uppercase tracking-wide ${
          tone === 'danger' ? 'text-destructive' : 'text-muted-foreground'
        }`}
      >
        {title} {tasks.length > 0 && <span className="tabular-nums">({tasks.length})</span>}
      </h3>
      {tasks.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {tasks.map((task) => (
            <DeadlineRow
              key={task.id}
              task={task}
              course={task.course_id ? coursesById[task.course_id] : null}
              onComplete={onComplete}
              busy={busyId === task.id}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export default function DeadlinesCard({ todayTasks, overdueTasks, upcomingTasks, coursesById, onComplete, busyId }) {
  const total = todayTasks.length + overdueTasks.length + upcomingTasks.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="font-heading text-base">Today &amp; upcoming</CardTitle>
        <Link to="/assignments" className="text-xs font-medium text-primary hover:underline">
          All assignments
        </Link>
      </CardHeader>
      <CardContent className="space-y-5">
        {total === 0 ? (
          <div className="flex items-start gap-3 rounded-lg border border-dashed border-border p-4">
            <CalendarCheck className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">Nothing due in the next 7 days</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Add an assignment so deadlines show up here and on your calendar.
              </p>
            </div>
          </div>
        ) : (
          <>
            {overdueTasks.length > 0 && (
              <Section
                title="Overdue"
                tone="danger"
                tasks={overdueTasks}
                coursesById={coursesById}
                onComplete={onComplete}
                busyId={busyId}
                emptyText=""
              />
            )}
            <Section
              title="Due today"
              tasks={todayTasks}
              coursesById={coursesById}
              onComplete={onComplete}
              busyId={busyId}
              emptyText="Nothing due today."
            />
            <Section
              title="Next 7 days"
              tasks={upcomingTasks}
              coursesById={coursesById}
              onComplete={onComplete}
              busyId={busyId}
              emptyText="Nothing else due this week."
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}