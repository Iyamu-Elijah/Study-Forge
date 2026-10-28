import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useReducedMotion from '@/hooks/useReducedMotion';
import { minutesToLabel } from '@/lib/date';

export default function SessionsByCourseChart({ byCourse }) {
  const reducedMotion = useReducedMotion();
  const series = byCourse.slice(0, 8).map((row) => ({
    label: row.course?.code ?? 'No course',
    minutes: row.minutes,
    sessions: row.sessions,
  }));

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="font-heading text-base">Study time by course</CardTitle>
        <p className="text-sm text-muted-foreground">Last 4 weeks of recorded sessions.</p>
      </CardHeader>
      <CardContent>
        {series.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sessions recorded yet — run a focus session and link it to a course.
          </p>
        ) : (
          <>
            <div className="h-56 w-full" role="img" aria-label="Study minutes by course">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={series}
                  layout="vertical"
                  margin={{ top: 4, right: 12, bottom: 0, left: 4 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={78}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    formatter={(value) => [`${minutesToLabel(value)}`, 'Studied']}
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
                    fill="hsl(var(--chart-5))"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={20}
                    isAnimationActive={!reducedMotion}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="sr-only">
              {series.map((row) => (
                <li key={row.label}>
                  {row.label}: {row.minutes} minutes across {row.sessions} sessions
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}