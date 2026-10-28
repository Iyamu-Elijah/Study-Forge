import { Progress } from '@/components/ui/progress';
import { formatFullDate, parseISODate } from '@/lib/date';

const greetingFor = (hour) => {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const semesterProgress = (startISO, endISO, now) => {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  if (!start || !end || end <= start) return null;
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const totalWeeks = Math.ceil((end - start) / weekMs);
  const rawWeek = Math.floor((now - start) / weekMs) + 1;
  const week = Math.min(Math.max(rawWeek, 1), totalWeeks);
  const percent = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
  return { week, totalWeeks, percent, withinTerm: rawWeek >= 1 && rawWeek <= totalWeeks };
};

export default function GreetingBlock({ profile, actions }) {
  const now = new Date();
  const firstName = (profile?.full_name || 'there').trim().split(/\s+/)[0];
  const context = [
    profile?.academic_level && `${profile.academic_level} Level`,
    profile?.department,
    profile?.university,
  ]
    .filter(Boolean)
    .join(' · ');
  const semesterLine = [profile?.semester, profile?.academic_session]
    .filter(Boolean)
    .join(' · ');
  const progress = semesterProgress(profile?.semester_start, profile?.semester_end, now);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {greetingFor(now.getHours())}, {firstName}
        </h1>
        {semesterLine && (
          <p className="mt-1 text-sm font-medium text-foreground/80">{semesterLine}</p>
        )}
        {context && <p className="mt-0.5 truncate text-sm text-muted-foreground">{context}</p>}

        {progress && (
          <div className="mt-3 max-w-sm">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {progress.withinTerm ? `Week ${progress.week} of ${progress.totalWeeks}` : 'Outside your semester dates'}
              </span>
              <span>{progress.percent}%</span>
            </div>
            <Progress value={progress.percent} className="mt-1.5 h-1.5" />
            <p className="mt-1 text-xs text-muted-foreground">
              {formatFullDate(profile?.semester_start)} – {formatFullDate(profile?.semester_end)}
            </p>
          </div>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}