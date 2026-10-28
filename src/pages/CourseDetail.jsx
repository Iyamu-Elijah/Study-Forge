import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArchiveRestore, ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import CourseFormDialog from '@/components/courses/CourseFormDialog';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import EmptyState from '@/components/common/EmptyState';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import DeadlineRow from '@/components/dashboard/DeadlineRow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import useAsyncData from '@/hooks/useAsyncData';
import { useProfile } from '@/lib/profile-context';
import { deleteCourse, getCourse, setCourseStatus } from '@/services/courseService';
import { listEvents } from '@/services/eventService';
import { getNote, listNotes } from '@/services/noteService';
import { listTasks, setTaskStatus } from '@/services/taskService';
import { formatTimeLabel, todayISO } from '@/lib/date';

export default function CourseDetail() {
  const { courseId } = useParams();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState('');

  const { data, loading, error, reload } = useAsyncData(async () => {
    const course = await getCourse(courseId);
    if (!course) return { course: null };
    const [tasks, notes, events] = await Promise.all([
      listTasks(profile.id, { courseId }, { sort: 'due_asc', limit: 50 }),
      listNotes(profile.id, { courseId, limit: 10 }),
      listEvents(profile.id, { courseId, from: todayISO(), limit: 10 }),
    ]);
    return {
      course,
      tasks: tasks.items ?? [],
      notes: notes.items ?? [],
      events: events.items ?? [],
    };
  }, [courseId, profile.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingState rows={4} />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;

  if (!data?.course) {
    return (
      <EmptyState
        title="Course not found"
        description="This course may have been deleted. Head back to your course list."
        action={
          <Button asChild variant="outline">
            <Link to="/courses">Back to courses</Link>
          </Button>
        }
      />
    );
  }

  const { course, tasks, notes, events } = data;
  const open = tasks.filter((task) => task.status !== 'completed');
  const completed = tasks.filter((task) => task.status === 'completed');
  const meta = [
    { label: 'Credit units', value: course.credit_units ?? '—' },
    { label: 'Lecturer', value: course.instructor || '—' },
    { label: 'Timetable', value: course.timetable || '—' },
    { label: 'Session', value: [course.semester, course.academic_session].filter(Boolean).join(' · ') || '—' },
  ];

  const archiveToggle = async () => {
    const nextStatus = course.status === 'archived' ? 'active' : 'archived';
    try {
      await setCourseStatus(course.id, nextStatus);
      toast({ title: nextStatus === 'archived' ? 'Course archived' : 'Course restored' });
      reload();
    } catch (caught) {
      toast({ variant: 'destructive', title: 'Could not update that course', description: caught?.message });
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteCourse(course);
      toast({ title: 'Course deleted', description: 'Its tasks and notes were kept.' });
      navigate('/courses', { replace: true });
    } catch (caught) {
      toast({ variant: 'destructive', title: 'Could not delete that course', description: caught?.message });
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const completeTask = async (task) => {
    setBusyTaskId(task.id);
    try {
      await setTaskStatus(task, 'completed');
      toast({ title: 'Task completed', description: task.title });
      reload();
    } catch (caught) {
      toast({ variant: 'destructive', title: 'Could not update that task', description: caught?.message });
    } finally {
      setBusyTaskId('');
    }
  };

  const openNote = async (noteId) => {
    const note = await getNote(noteId);
    if (note) navigate(`/notes?note=${noteId}`);
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/courses">
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          All courses
        </Link>
      </Button>

      <PageHeader
        title={`${course.code} — ${course.title}`}
        description={course.description || undefined}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
              <Pencil className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={archiveToggle}>
              <ArchiveRestore className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {course.status === 'archived' ? 'Restore' : 'Archive'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)} className="text-destructive">
              <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Delete
            </Button>
          </>
        }
      >
        {course.status === 'archived' && (
          <Badge variant="outline" className="mt-2">
            Archived
          </Badge>
        )}
      </PageHeader>

      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {meta.map((item) => (
            <div key={item.label}>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-1 text-sm font-medium">{item.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="font-heading text-base">Open tasks</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to={`/assignments?new=1&course=${course.id}`}>
                <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Add
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {open.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open tasks for this course.</p>
            ) : (
              <ul className="space-y-2">
                {open.map((task) => (
                  <DeadlineRow
                    key={task.id}
                    task={task}
                    course={course}
                    onComplete={completeTask}
                    busy={busyTaskId === task.id}
                  />
                ))}
              </ul>
            )}
            {completed.length > 0 && (
              <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                {completed.length} completed task{completed.length === 1 ? '' : 's'}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="font-heading text-base">Upcoming events</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to={`/calendar?new=1&course=${course.id}`}>
                  <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Add
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming events for this course.</p>
              ) : (
                <ul className="space-y-2">
                  {events.map((event) => (
                    <li key={event.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate font-medium">{event.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {event.start_date}
                        {event.start_time ? ` · ${formatTimeLabel(event.start_time)}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="font-heading text-base">Notes</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to={`/notes?new=1&course=${course.id}`}>
                  <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Add
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes for this course yet.</p>
              ) : (
                <ul className="space-y-2">
                  {notes.map((note) => (
                    <li key={note.id}>
                      <button
                        type="button"
                        onClick={() => openNote(note.id)}
                        className="w-full truncate text-left text-sm font-medium hover:underline"
                      >
                        {note.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CourseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        course={course}
        profile={profile}
        onSaved={(message) => {
          toast({ title: message });
          reload();
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${course.code}?`}
        description="The course will be removed. Its assignments, notes and events are kept and simply lose the course link."
        confirmLabel="Delete course"
        pending={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}