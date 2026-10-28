import { Link } from 'react-router-dom';
import { Archive, ArchiveRestore, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function CourseCard({ course, openCount, onEdit, onArchive, onRestore, onDelete }) {
  const archived = course.status === 'archived';
  const meta = [
    course.credit_units ? `${course.credit_units} units` : null,
    course.instructor || null,
    course.semester || null,
    course.academic_session || null,
  ].filter(Boolean);

  return (
    <Card className={archived ? 'opacity-80' : undefined}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                {course.code}
              </span>
              {archived && <Badge variant="outline">Archived</Badge>}
            </div>
            <h3 className="mt-2 truncate font-heading text-base font-semibold">
              <Link to={`/courses/${course.id}`} className="hover:underline">
                {course.title}
              </Link>
            </h3>
            {meta.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">{meta.join(' · ')}</p>
            )}
            {course.timetable && (
              <p className="mt-1 text-xs text-muted-foreground">🕘 {course.timetable}</p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${course.title}`}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(course)}>
                <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                Edit
              </DropdownMenuItem>
              {archived ? (
                <DropdownMenuItem onClick={() => onRestore(course)}>
                  <ArchiveRestore className="mr-2 h-4 w-4" aria-hidden="true" />
                  Restore
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onArchive(course)}>
                  <Archive className="mr-2 h-4 w-4" aria-hidden="true" />
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(course)}
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs">
          <span className="text-muted-foreground">
            {openCount === 0 ? 'No open tasks' : `${openCount} open task${openCount === 1 ? '' : 's'}`}
          </span>
          <Link to={`/courses/${course.id}`} className="font-medium text-primary hover:underline">
            Open course
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}