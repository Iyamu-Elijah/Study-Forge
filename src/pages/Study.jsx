import { useMemo, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import TimerDisplay from '@/components/study/TimerDisplay';
import TimerControls from '@/components/study/TimerControls';
import SessionRecordDialog from '@/components/study/SessionRecordDialog';
import SessionHistoryList from '@/components/study/SessionHistoryList';
import StudyStatsCard from '@/components/study/StudyStatsCard';
import StudyPreferencesForm from '@/components/settings/StudyPreferencesForm';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ErrorState from '@/components/common/ErrorState';
import FormField from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import useAsyncData from '@/hooks/useAsyncData';
import useFocusTimer from '@/hooks/useFocusTimer';
import { useProfile } from '@/lib/profile-context';
import { listCourses } from '@/services/courseService';
import { deleteSession, listSessions, recordSession, studyTotals } from '@/services/sessionService';
import { todayISO } from '@/lib/date';
import playChime from '@/lib/chime';

export default function Study() {
  const { profile, preferences, savePreferences } = useProfile();
  const { toast } = useToast();
  const [pending, setPending] = useState(null);
  const [saving, setSaving] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const coursesData = useAsyncData(() => listCourses(profile.id, { limit: 60 }), [profile.id]);
  const courses = coursesData.data?.items ?? [];
  const coursesById = useMemo(
    () => courses.reduce((acc, course) => ({ ...acc, [course.id]: course }), {}),
    [courses],
  );

  const sessions = useAsyncData(() => listSessions(profile.id, { limit: 40 }), [profile.id]);
  const stats = useAsyncData(() => studyTotals(profile.id), [profile.id]);

  const timerRef = useRef(null);
  const timer = useFocusTimer({
    focusMinutes: preferences.focus_minutes ?? 25,
    shortBreakMinutes: preferences.short_break_minutes ?? 5,
    longBreakMinutes: preferences.long_break_minutes ?? 15,
    longBreakEvery: preferences.long_break_every ?? 4,
    onFinish: (payload) => {
      if (preferences.timer_sound) playChime();
      if (payload.phase === 'focus') {
        setPending({ ...payload, courseId });
        toast({
          title: 'Focus session finished',
          description: 'Confirm it to save your study time.',
        });
      } else {
        toast({ title: 'Break finished', description: 'Ready for the next focus block.' });
        timerRef.current?.advance();
      }
    },
  });
  timerRef.current = timer;

  const saveSession = async ({ minutes, courseId: sessionCourse }) => {
    setSaving(true);
    try {
      await recordSession(profile.id, {
        courseId: sessionCourse,
        minutes,
        startedAt: pending?.startedAt,
        sessionDate: todayISO(),
      });
      toast({ title: 'Study time saved', description: `${Math.round(minutes)} minutes recorded.` });
      setPending(null);
      timer.advance();
      sessions.reload();
      stats.reload();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not save that session',
        description: error?.message || 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const closeRecordDialog = (open) => {
    if (open) return;
    setPending(null);
    timer.advance();
  };

  const saveTimerPreferences = async (patch) => {
    setSavingPreferences(true);
    try {
      await savePreferences(patch);
      toast({ title: 'Preferences saved' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not save your preferences',
        description: error?.message,
      });
    } finally {
      setSavingPreferences(false);
    }
  };

  const confirmDeleteSession = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteSession(pendingDelete.id);
      toast({ title: 'Session removed' });
      setPendingDelete(null);
      sessions.reload();
      stats.reload();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not remove that session',
        description: error?.message,
      });
    } finally {
      setDeleting(false);
    }
  };

  const weekSessions = (sessions.data?.items ?? []).filter(
    (session) => session.session_date >= (stats.data?.weekStart ?? ''),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Focus timer"
        description="Work in focused blocks and record the time you actually studied."
        actions={
          <Button variant="outline" onClick={() => setShowSettings((value) => !value)}>
            <SlidersHorizontal className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Timer settings
          </Button>
        }
      />

      {(coursesData.error || sessions.error || stats.error) && (
        <ErrorState
          message={coursesData.error || sessions.error || stats.error}
          onRetry={() => {
            coursesData.reload();
            sessions.reload();
            stats.reload();
          }}
        />
      )}

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardContent className="flex flex-col items-center gap-5 p-6">
              <TimerDisplay
                phase={timer.phase}
                status={timer.status}
                remaining={timer.remaining}
                progress={timer.progress}
              />

              <TimerControls
                status={timer.status}
                phase={timer.phase}
                onStart={timer.start}
                onPause={timer.pause}
                onReset={timer.reset}
                onSkip={() =>
                  timer.switchPhase(timer.phase === 'focus' ? 'short_break' : 'focus')
                }
              />

              <div className="w-full max-w-xs">
                <FormField id="study-course" label="Studying (optional)">
                  <Select
                    value={courseId || 'none'}
                    onValueChange={(value) => setCourseId(value === 'none' ? '' : value)}
                  >
                    <SelectTrigger id="study-course">
                      <SelectValue placeholder="No course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No course</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code} — {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {timer.cycle} focus session{timer.cycle === 1 ? '' : 's'} completed in this flow
                </p>
              </div>
            </CardContent>
          </Card>

          {showSettings && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base">Timer settings</CardTitle>
              </CardHeader>
              <CardContent>
                <StudyPreferencesForm
                  preferences={preferences}
                  onSave={saveTimerPreferences}
                  saving={savingPreferences}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <StudyStatsCard
            todayMinutes={stats.data?.todayMinutes ?? 0}
            weekMinutes={stats.data?.weekMinutes ?? 0}
            targetHours={preferences.weekly_study_target_hours}
            sessionCount={weekSessions.length}
          />
          <SessionHistoryList
            sessions={sessions.data?.items ?? []}
            coursesById={coursesById}
            onDelete={setPendingDelete}
          />
        </div>
      </div>

      <SessionRecordDialog
        pending={pending}
        courses={courses}
        saving={saving}
        onSave={saveSession}
        onOpenChange={closeRecordDialog}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Remove this study session?"
        description="Your recorded study time will be recalculated without it."
        confirmLabel="Remove session"
        pending={deleting}
        onConfirm={confirmDeleteSession}
      />
    </div>
  );
}