import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useReducedMotion from '@/hooks/useReducedMotion';
import { formatWeekLabel } from '@/lib/date';

export default function CompletionTrendChart({ completedByWeek }) {
  const reducedMotion = useReducedMotion();
  const series = completedByWeek.map((week) => ({
    label: formatWeekLabel(week.date),
    completed: week.completed,
  }));
  const total = series.reduce((sum, week) => sum + week.completed, 0);

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="font-heading text-base">Progress trend</CardTitle>
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? 'Nothing completed in the last 8 weeks.'
            : `${total} task${total === 1 ? '' : 's'} completed in the last 8 weeks`}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full" role="img" aria-label="Tasks completed per week">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                formatter={(value) => [value, 'Completed']}
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 12,
                  fontSize: 12,
                  color: 'hsl(var(--popover-foreground))',
                }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="hsl(var(--chart-4))"
                strokeWidth={2}
                dot={{ r: 3 }}
                isAnimationActive={!reducedMotion}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <ul className="sr-only">
          {series.map((week) => (
            <li key={week.label}>
              Week of {week.label}: {week.completed} completed
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}