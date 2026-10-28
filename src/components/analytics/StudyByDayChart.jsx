import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useReducedMotion from '@/hooks/useReducedMotion';
import { formatShortDay, formatWeekLabel, minutesToLabel } from '@/lib/date';

const tooltipStyle = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 12,
  fontSize: 12,
  color: 'hsl(var(--popover-foreground))',
};

export default function StudyByDayChart({ days, today }) {
  const reducedMotion = useReducedMotion();
  const byDate = days.reduce((acc, day) => {
    acc[day.date] = day.minutes;
    return acc;
  }, {});
  const series = [];
  for (let index = 13; index >= 0; index -= 1) {
    const date = new Date(`${today}T00:00:00`);
    date.setDate(date.getDate() - index);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    series.push({ date: iso, label: formatShortDay(iso), minutes: byDate[iso] ?? 0 });
  }

  const total = series.reduce((sum, day) => sum + day.minutes, 0);
  const activeDays = series.filter((day) => day.minutes > 0).length;

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="font-heading text-base">Study time — last 14 days</CardTitle>
        <p className="text-sm text-muted-foreground">
          {minutesToLabel(total)} recorded across {activeDays} day{activeDays === 1 ? '' : 's'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-56 w-full" role="img" aria-label="Study minutes per day for the last 14 days">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                formatter={(value) => [`${value} min`, 'Studied']}
                labelFormatter={(label) => formatWeekLabel(label.length === 10 ? label : today)}
                contentStyle={tooltipStyle}
              />
              <YAxis hide />
              <Bar
                dataKey="minutes"
                fill="hsl(var(--chart-1))"
                radius={[6, 6, 0, 0]}
                maxBarSize={22}
                isAnimationActive={!reducedMotion}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="sr-only">
          {series.map((day) => (
            <li key={day.date}>
              {day.date}: {day.minutes} minutes
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}