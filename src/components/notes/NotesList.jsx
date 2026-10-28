import { NotebookPen, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CourseChip from '@/components/common/CourseChip';
import EmptyState from '@/components/common/EmptyState';
import LoadingState from '@/components/common/LoadingState';
import { format } from 'date-fns';
import { parseISODate } from '@/lib/date';

const updatedLabel = (iso) => {
  if (!iso) return '';
  const date = parseISODate(iso.slice(0, 10)) ?? new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return format(date, 'd MMM yyyy');
};

export default function NotesList({
  notes,
  activeId,
  courses,
  coursesById,
  filters,
  loading,
  error,
  hasMore,
  loadingMore,
  onFilterChange,
  onSelect,
  onTagClick,
  onLoadMore,
  onNew,
}) {
  return (
    <div className="space-y-4">
      <Button onClick={onNew} className="w-full sm:w-auto">
        <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
        New note
      </Button>

      <Card>
        <CardContent className="space-y-3 p-3">
          <div>
            <label htmlFor="note-search" className="sr-only">
              Search notes
            </label>
            <Input
              id="note-search"
              placeholder="Search notes"
              value={filters.search}
              onChange={(event) => onFilterChange('search', event.target.value)}
            />
          </div>
          <Select
            value={filters.courseId}
            onValueChange={(value) => onFilterChange('courseId', value)}
          >
            <SelectTrigger aria-label="Filter notes by course">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.tag && (
            <button
              type="button"
              onClick={() => onFilterChange('tag', '')}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
            >
              #{filters.tag} · clear
            </button>
          )}
        </CardContent>
      </Card>

      {loading && <LoadingState rows={4} />}
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && notes.length === 0 && (
        <EmptyState
          icon={NotebookPen}
          title="No notes here"
          description="Write down what you learn as you go — notes can be linked to a course and tagged for later."
          action={<Button onClick={onNew}>Write your first note</Button>}
        />
      )}

      {notes.length > 0 && (
        <>
          <ul className="space-y-2">
            {notes.map((note) => (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => onSelect(note.id)}
                  aria-current={activeId === note.id ? 'true' : undefined}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    activeId === note.id
                      ? 'border-primary/40 bg-primary/[0.04]'
                      : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  <p className="truncate text-sm font-medium">{note.title || 'Untitled note'}</p>
                  {note.content && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{note.content}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <CourseChip course={note.course_id ? coursesById[note.course_id] : null} fallback="No course" />
                    <span className="text-[11px] text-muted-foreground">
                      Updated {updatedLabel(note.updated_date)}
                    </span>
                  </div>
                  {(note.tags ?? []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          role="button"
                          tabIndex={0}
                          onClick={(event) => {
                            event.stopPropagation();
                            onTagClick(tag);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.stopPropagation();
                              onTagClick(tag);
                            }
                          }}
                          className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {hasMore && (
            <Button variant="outline" className="w-full" onClick={onLoadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading…' : 'Load more notes'}
            </Button>
          )}
        </>
      )}
    </div>
  );
}