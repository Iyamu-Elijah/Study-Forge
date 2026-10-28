import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ListChecks, Plus } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import TaskFiltersBar from '@/components/tasks/TaskFiltersBar';
import TaskRow from '@/components/tasks/TaskRow';
import TaskFormDialog from '@/components/tasks/TaskFormDialog';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import useAsyncData from '@/hooks/useAsyncData';
import { useProfile } from '@/lib/profile-context';
import { listCourses } from '@/services/courseService';
import { deleteTask, getTask, listTasks, setTaskStatus } from '@/services/taskService';

const EMPTY_FILTERS = {
  search: '',
  status: 'all',
  courseId: 'all',
  type: 'all',
  priority: 'all',
  sort: 'due_asc',
};

const PAGE_SIZE = 50;

export default function Assignments() {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [presetCourseId, setPresetCourseId] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState('');

  const coursesData = useAsyncData(
    () => listCourses(profile.id, { includeArchived: true, limit: 60 }),
    [profile.id],
  );
  const courses = coursesData.data?.items ?? [];
  const coursesById = useMemo(
    () => courses.reduce((acc, course) => ({ ...acc, [course.id]: course }), {}),
    [courses],
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search.trim()), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const query = useMemo(
    () => ({
      search: debouncedSearch,
      status: filters.status === 'all' ? '' : filters.status,
      courseId: filters.courseId === 'all' ? '' : filters.courseId,
      type: filters.type === 'all' ? '' : filters.type,
      priority: filters.priority === 'all' ? '' : filters.priority,
    }),
    [debouncedSearch, filters.status, filters.courseId, filters.type, filters.priority],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listTasks(profile.id, query, { sort: filters.sort, limit: PAGE_SIZE })
      .then((page) => {
        if (cancelled) return;
        setItems(page.items ?? []);
        setCursor(page.next_cursor ?? null);
        setHasMore(Boolean(page.has_more));
        setLoading(false);
      })
      .catch((caught) => {
        if (cancelled) return;
        setItems([]);
        setError(caught?.message || 'We could not load your assignments.');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile.id, query, filters.sort, reloadKey]);

  useEffect(() => {
    const taskId = searchParams.get('task');
    const courseParam = searchParams.get('course') || '';
    if (taskId) {
      getTask(taskId).then((task) => {
        if (task) {
          setEditingTask(task);
          setDialogOpen(true);
        }
      });
      setSearchParams({}, { replace: true });
    } else if (searchParams.get('new')) {
      setEditingTask(null);
      setPresetCourseId(courseParam);
      setDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const reload = () => setReloadKey((value) => value + 1);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await listTasks(profile.id, query, {
        sort: filters.sort,
        limit: PAGE_SIZE,
        cursor,
      });
      setItems((prev) => [...prev, ...(page.items ?? [])]);
      setCursor(page.next_cursor ?? null);
      setHasMore(Boolean(page.has_more));
    } catch (caught) {
      toast({
        variant: 'destructive',
        title: 'Could not load more',
        description: caught?.message,
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const changeStatus = async (task, status) => {
    setBusyId(task.id);
    try {
      await setTaskStatus(task, status);
      toast({
        title: status === 'completed' ? 'Task completed' : 'Task updated',
        description: task.title,
      });
      reload();
    } catch (caught) {
      toast({
        variant: 'destructive',
        title: 'Could not update that task',
        description: caught?.message,
      });
    } finally {
      setBusyId('');
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteTask(pendingDelete.id);
      toast({ title: 'Task deleted', description: pendingDelete.title });
      setPendingDelete(null);
      reload();
    } catch (caught) {
      toast({
        variant: 'destructive',
        title: 'Could not delete that task',
        description: caught?.message || 'Please try again.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const resultLabel = loading
    ? 'Loading…'
    : `${items.length}${hasMore ? '+' : ''} task${items.length === 1 ? '' : 's'} shown`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments & exams"
        description="Every deadline in one list — overdue first, then everything coming up."
        actions={
          <Button
            onClick={() => {
              setEditingTask(null);
              setPresetCourseId('');
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            New task
          </Button>
        }
      />

      <TaskFiltersBar
        filters={filters}
        courses={courses}
        onChange={(field, value) => setFilters((prev) => ({ ...prev, [field]: value }))}
        onReset={() => setFilters(EMPTY_FILTERS)}
        resultLabel={resultLabel}
      />

      {loading && <LoadingState rows={4} />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon={ListChecks}
          title="No tasks match this view"
          description="Change the filters, or add the next assignment you are working towards."
          action={
            <Button
              onClick={() => {
                setEditingTask(null);
                setPresetCourseId('');
                setDialogOpen(true);
              }}
            >
              Add a task
            </Button>
          }
        />
      )}

      {items.length > 0 && (
        <>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {items.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    course={task.course_id ? coursesById[task.course_id] : null}
                    busy={busyId === task.id}
                    onEdit={(item) => {
                      setEditingTask(item);
                      setPresetCourseId('');
                      setDialogOpen(true);
                    }}
                    onDelete={setPendingDelete}
                    onStatus={changeStatus}
                  />
                ))}
              </ul>
            </CardContent>
          </Card>

          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        courses={courses}
        presetCourseId={presetCourseId}
        profile={profile}
        onSaved={(message) => {
          toast({ title: message });
          reload();
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this task?"
        description={
          pendingDelete
            ? `“${pendingDelete.title}” will be permanently removed.`
            : 'This task will be permanently removed.'
        }
        confirmLabel="Delete task"
        pending={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}