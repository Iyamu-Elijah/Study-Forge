import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { minutesToLabel } from '@/lib/date';

export default function StudyStatsCard({ todayMinutes, weekMinutes, targetHours, sessionCount }) {
  const targetMinutes = Math.round((targetHours || 0) * 60);
  const percent =
    targetMinutes > 0 ? Math.min(100, Math.round((weekMinutes / targetMinutes) * 100)) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">Your study time</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Today</p>
            <p className="mt-1 font-heading text-xl font-semibold tabular-nums">
              {minutesToLabel(todayMinutes)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              This week
            </p>
            <p className="mt-1 font-heading text-xl font-semibold tabular-nums">
              {minutesToLabel(weekMinutes)}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {sessionCount} session{sessionCount === 1 ? '' : 's'} recorded this week · recorded time only
        </p>

        {percent !== null ? (
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Weekly target: {targetHours} h (your goal)</span>
              <span>{percent}%</span>
            </div>
            <Progress value={percent} className="mt-1.5 h-1.5" />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Set a weekly study target in Settings if you want something to aim at.
          </p>
        )}
      </CardContent>
    </Card>
  );
}