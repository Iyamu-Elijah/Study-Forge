import { useState } from 'react';
import { AlarmClock, CheckCircle2, Clock3, ListChecks } from 'lucide-react';
import GreetingBlock from '@/components/dashboard/GreetingBlock';
import QuickActions from '@/components/dashboard/QuickActions';
import StatCard from '@/components/common/StatCard';
import DeadlinesCard from '@/components/dashboard/DeadlinesCard';
import CourseOverviewCard from '@/components/dashboard/CourseOverviewCard';
import StudyActivityChart from '@/components/dashboard/StudyActivityChart';
import FirstUseChecklist from '@/components/dashboard/FirstUseChecklist';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import useAsyncData from '@/hooks/useAsyncData';
import { useProfile } from '@/lib/profile-context';
import { getDashboardSnapshot } from '@/services/analyticsService';
import { setTaskStatus } from '@/services/taskService';
import { minutesToLabel } from '@/lib/date';
import { useToast } from '@/components/ui/use-toast';

export default function Dashboard() {
  const { profile, preferences } = useProfile();
  const { toast } = useToast();
  const [busyId, setBusyId] = useState('');
  const { data, loading, error, reload } = useAsyncData(
    () => getDashboardSnapshot(profile.id),
    [profile.id],
  );

  const completeTask = async (task) => {
    setBusyId(task.id);
    try {
      await setTaskStatus(task, 'completed');
      toast({ title: 'Task completed', description: task.title });
      reload();
    } catch (caught) {
      toast({
        variant: 'destructive',
        title: 'Could not update that task',
        description: caught?.message || 'Please try again.',
      });
    } finally {
      setBusyId('');
    }
  };

  const coursesById = (data?.courses ?? []).reduce((acc, course) => {
    acc[course.id] = course;
    return acc;
  }, {});

  // First-use view: nothing recorded yet, so guide the student instead of showing zeros.
  const isEmpty =
    data && data.open === 0 && data.completed === 0 && data.study.weekMinutes === 0;

  return (
    <div className="space-y-6">
      <GreetingBlock profile={profile} actions={<QuickActions />} />

      {loading && <LoadingState rows={5} />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && (
        <>
          {isEmpty ? (
            <FirstUseChecklist hasCourses={data.courses.length > 0} />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Due today"
                  value={data.todayTasks.length}
                  hint={
                    data.overdueTasks.length
                      ? `${data.overdueTasks.length} already overdue`
                      : 'Nothing overdue'
                  }
                  icon={Clock3}
                />
                <StatCard
                  label="Overdue"
                  value={data.overdueTasks.length}
                  hint={data.overdueTasks.length ? 'Needs attention first' : 'You are on track'}
                  icon={AlarmClock}
                  tone={data.overdueTasks.length ? 'warning' : 'success'}
                />
                <StatCard
                  label="Completed"
                  value={data.completed}
                  hint={`${data.open} still open · ${data.inProgress} in progress`}
                  icon={CheckCircle2}
                  tone="success"
                />
                <StatCard
                  label="Study this week"
                  value={minutesToLabel(data.study.weekMinutes)}
                  hint={`${minutesToLabel(data.study.todayMinutes)} recorded today`}
                  icon={ListChecks}
                  tone="accent"
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
                <DeadlinesCard
                  todayTasks={data.todayTasks}
                  overdueTasks={data.overdueTasks}
                  upcomingTasks={data.upcomingTasks}
                  coursesById={coursesById}
                  onComplete={completeTask}
                  busyId={busyId}
                />
                <div className="space-y-5">
                  <StudyActivityChart
                    days={data.study.days}
                    weekStart={data.study.weekStart}
                    targetHours={preferences?.weekly_study_target_hours}
                  />
                  <CourseOverviewCard
                    courses={data.courses}
                    openPerCourse={data.openPerCourse}
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}