import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, Plus } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import CourseCard from '@/components/courses/CourseCard';
import CourseFormDialog from '@/components/courses/CourseFormDialog';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import useAsyncData from '@/hooks/useAsyncData';
import { useProfile } from '@/lib/profile-context';
import { deleteCourse, listCourses, setCourseStatus } from '@/services/courseService';
import { openTasksByCourse } from '@/services/taskService';

export default function Courses() {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState('active');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const courses = useAsyncData(
    () => listCourses(profile.id, { includeArchived: tab === 'archived', limit: 60 }),
    [profile.id, tab],
  );
  const counts = useAsyncData(() => openTasksByCourse(profile.id), [profile.id]);

  useEffect(() => {
    if (searchParams.get('new')) {
      setEditing(null);
      setDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const refresh = () => {
    courses.reload();
    counts.reload();
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (course) => {
    setEditing(course);
    setDialogOpen(true);
  };

  const archive = async (course, status) => {
    try {
      await setCourseStatus(course.id, status);
      toast({
        title: status === 'archived' ? 'Course archived' : 'Course restored',
        description: course.code,
      });
      refresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not update that course',
        description: error?.message,
      });
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteCourse(pendingDelete);
      toast({
        title: 'Course deleted',
        description: `${pendingDelete.code} was removed. Its tasks and notes were kept.`,
      });
      setPendingDelete(null);
      refresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not delete that course',
        description: error?.message || 'Please try again.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const list = courses.data?.items ?? [];
  const openPerCourse = counts.data ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="Everything you are registered for, with the work linked to each course."
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Add course
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {courses.loading && <LoadingState rows={3} />}
      {courses.error && <ErrorState message={courses.error} onRetry={courses.reload} />}

      {!courses.loading && !courses.error && list.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title={tab === 'archived' ? 'No archived courses' : 'No courses yet'}
          description={
            tab === 'archived'
              ? 'Courses you archive stay here, with all their work intact.'
              : 'Add the courses you are registered for this semester to link assignments, notes and study time.'
          }
          action={tab === 'active' ? <Button onClick={openCreate}>Add your first course</Button> : null}
        />
      )}

      {list.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((course) => (
            <li key={course.id}>
              <CourseCard
                course={course}
                openCount={openPerCourse[course.id] ?? 0}
                onEdit={openEdit}
                onArchive={(item) => archive(item, 'archived')}
                onRestore={(item) => archive(item, 'active')}
                onDelete={setPendingDelete}
              />
            </li>
          ))}
        </ul>
      )}

      <CourseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        course={editing}
        profile={profile}
        onSaved={(message) => {
          toast({ title: message });
          refresh();
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete ${pendingDelete?.code ?? 'course'}?`}
        description="The course will be removed. Its assignments, notes and events are kept and simply lose the course link."
        confirmLabel="Delete course"
        pending={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}