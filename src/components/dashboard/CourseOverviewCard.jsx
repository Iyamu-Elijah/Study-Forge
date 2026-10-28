import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CourseOverviewCard({ courses, openPerCourse }) {
  const visible = courses.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="font-heading text-base">Your courses</CardTitle>
        <Link to="/courses" className="text-xs font-medium text-primary hover:underline">
          Manage
        </Link>
      </CardHeader>
      <CardContent>
        {visible.length === 0 ? (
          <div className="flex items-start gap-3 rounded-lg border border-dashed border-border p-4">
            <BookOpen className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">No courses yet</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Add the courses you are registered for to link your work to them.
              </p>
              <Link to="/courses?new=1" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
                Add a course
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((course) => {
              const open = openPerCourse[course.id] ?? 0;
              return (
                <li key={course.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link
                      to={`/courses/${course.id}`}
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {course.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {course.code}
                      {course.credit_units ? ` · ${course.credit_units} units` : ''}
                      {course.instructor ? ` · ${course.instructor}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">
                    {open === 0 ? 'All clear' : `${open} open`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}