import { AlertTriangle, BarChart3, CheckCircle2, CircleDashed, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import StudyByDayChart from '@/components/analytics/StudyByDayChart';
import StudyByWeekChart from '@/components/analytics/StudyByWeekChart';
import CompletionTrendChart from '@/components/analytics/CompletionTrendChart';
import SessionsByCourseChart from '@/components/analytics/SessionsByCourseChart';
import WorkloadList from '@/components/analytics/WorkloadList';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import useAsyncData from '@/hooks/useAsyncData';
import { useProfile } from '@/lib/profile-context';
import { getAnalyticsSnapshot } from '@/services/analyticsService';
import { minutesToLabel, startOfWeekISO, todayISO } from '@/lib/date';

export default function Analytics() {
  const { profile, preferences } = useProfile();
  const { data, loading, error, reload } = useAsyncData(
    () => getAnalyticsSnapshot(profile.id),
    [profile.id],
  );

  const targetHours = preferences.weekly_study_target_hours || 0;
  const targetMinutes = Math.round(targetHours * 60);
  const weekStart = startOfWeekISO();
  const weekMinutes = (data?.daily ?? [])
    .filter((day) => day.date >= weekStart)
    .reduce((sum, day) => sum + day.minutes, 0);
  const targetPercent =
    targetMinutes > 0 ? Math.min(100, Math.round((weekMinutes / targetMinutes) * 100)) : null;

  const isEmpty =
    data && data.completed === 0 && data.outstanding === 0 && data.daily.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Everything here is calculated from your saved records — nothing is estimated."
      />

      {loading && <LoadingState rows={5} />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && (
        <>
          {isEmpty ? (
            <EmptyState
              icon={BarChart3}
              title="Nothing to analyse yet"
              description="Once you add courses, complete assignments and record study sessions, your numbers appear here."
              action={
                <Button asChild>
                  <Link to="/assignments?new=1">Add your first task</Link>
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Completed"
                  value={data.completed}
                  hint="Tasks marked done"
                  icon={CheckCircle2}
                  tone="success"
                />
                <StatCard
                  label="Outstanding"
                  value={data.outstanding}
                  hint={`${data.inProgress} in progress · ${data.notStarted} not started`}
                  icon={CircleDashed}
                />
                <StatCard
                  label="Completion rate"
                  value={data.completionRate === null ? '—' : `${Math.round(data.completionRate * 100)}%`}
                  hint="Completed ÷ all tasks"
                  icon={BarChart3}
                  tone="accent"
                />
                <StatCard
                  label="Overdue"
                  value={data.overdue}
                  hint={data.overdue ? 'Past their due date' : 'Nothing overdue'}
                  icon={AlertTriangle}
                  tone={data.overdue ? 'warning' : 'success'}
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <StudyByDayChart days={data.daily} today={todayISO()} />
                <SessionsByCourseChart byCourse={data.byCourse} />
                <StudyByWeekChart weeks={data.weekly} />
                <CompletionTrendChart completedByWeek={data.completedByWeek} />
              </div>

              <WorkloadList tasks={data.workload} />

              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="font-heading text-base">Your weekly target</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    The target is optional and set by you — everything else on this page comes from
                    recorded sessions.
                  </p>
                </CardHeader>
                <CardContent>
                  {targetPercent === null ? (
                    <p className="text-sm text-muted-foreground">
                      No target set. Add one in Settings if you would like something to aim at.
                    </p>
                  ) : (
                    <div className="flex items-start gap-3">
                      <span className="rounded-lg bg-muted p-2 text-accent-foreground">
                        <Target className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {minutesToLabel(weekMinutes)} of {targetHours} h this week
                        </p>
                        <Progress value={targetPercent} className="mt-2 h-1.5" />
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {targetPercent}% of your target · recorded time only
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}