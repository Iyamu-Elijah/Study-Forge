import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useReducedMotion from '@/hooks/useReducedMotion';
import { formatWeekLabel, minutesToLabel } from '@/lib/date';

export default function StudyByWeekChart({ weeks }) {
  const reducedMotion = useReducedMotion();
  const series = weeks.map((week) => ({
    label: formatWeekLabel(week.date),
    minutes: week.minutes,
  }));
  const total = series.reduce((sum, week) => sum + week.minutes, 0);

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="font-heading text-base">Study time by week</CardTitle>
        <p className="text-sm text-muted-foreground">
          {series.length === 0
            ? 'No sessions recorded yet.'
            : `${minutesToLabel(total)} across ${series.length} week${series.length === 1 ? '' : 's'}`}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full" role="img" aria-label="Study minutes per week">
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
                fill="hsl(var(--chart-3))"
                radius={[6, 6, 0, 0]}
                maxBarSize={34}
                isAnimationActive={!reducedMotion}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="sr-only">
          {series.map((week) => (
            <li key={week.label}>
              Week of {week.label}: {week.minutes} minutes
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}