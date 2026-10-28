import { Card, CardContent } from '@/components/ui/card';

const TONES = {
  default: 'text-primary',
  accent: 'text-accent-foreground',
  warning: 'text-destructive',
  success: 'text-emerald-600 dark:text-emerald-400',
};

export default function StatCard({ label, value, hint, icon: Icon, tone = 'default' }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <span className={`rounded-lg bg-muted p-2 ${TONES[tone] ?? TONES.default}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </CardContent>
    </Card>
  );
}