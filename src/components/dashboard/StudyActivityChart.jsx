import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import useReducedMotion from '@/hooks/useReducedMotion';
import { endOfWeekISO, formatShortDay, minutesToLabel, weekDaysISO } from '@/lib/date';

export default function StudyActivityChart({ days, weekStart, targetHours }) {
  const reducedMotion = useReducedMotion();
  const buckets = weekDaysISO(new Date(`${weekStart}T00:00:00`));
  const byDate = days.reduce((acc, day) => {
    acc[day.date] = day.minutes;
    return acc;
  }, {});
  const series = buckets.map((date) => ({
    date,
    label: formatShortDay(date),
    minutes: byDate[date] ?? 0,
  }));

  const total = series.reduce((sum, day) => sum + day.minutes, 0);
  const targetMinutes = Math.round((targetHours || 0) * 60);
  const percent = targetMinutes > 0 ? Math.min(100, Math.round((total / targetMinutes) * 100)) : null;

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="font-heading text-base">Study activity this week</CardTitle>
        <p className="text-sm text-muted-foreground">
          <span className="font-heading text-xl font-semibold text-foreground tabular-nums">
            {minutesToLabel(total)}
          </span>{' '}
          recorded since Monday
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-40 w-full" role="img" aria-label={`Study minutes for the week starting ${weekStart}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                formatter={(value) => [`${value} min`, 'Studied']}
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 12,
                  fontSize: 12,
                  color: 'hsl(var(--popover-foreground))',
                }}
              />
              <Bar
                dataKey="minutes"
                fill="hsl(var(--chart-1))"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
                isAnimationActive={!reducedMotion}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <ul className="sr-only">
          {series.map((day) => (
            <li key={day.date}>
              {formatShortDay(day.date)}: {day.minutes} minutes
            </li>
          ))}
        </ul>

        {percent !== null ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Your weekly target: {targetHours} h</span>
              <span>{percent}%</span>
            </div>
            <Progress value={percent} className="mt-1.5 h-1.5" />
          </div>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">
            Set a weekly study target in Settings to track your goal — the numbers above are recorded
            time only.
          </p>
        )}
      </CardContent>
    </Card>
  );
}