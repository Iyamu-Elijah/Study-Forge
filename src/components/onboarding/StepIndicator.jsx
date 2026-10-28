import { Check } from 'lucide-react';

export default function StepIndicator({ steps, current }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
      {steps.map((label, index) => {
        const isDone = index < current;
        const isCurrent = index === current;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              aria-current={isCurrent ? 'step' : undefined}
              className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${
                isCurrent
                  ? 'border-primary bg-primary text-primary-foreground'
                  : isDone
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border bg-muted text-muted-foreground'
              }`}
            >
              {isDone ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
            </span>
            <span
              className={
                isCurrent ? 'font-medium text-foreground' : 'hidden text-muted-foreground sm:inline'
              }
            >
              {label}
            </span>
            {index < steps.length - 1 && (
              <span className="hidden h-px w-6 bg-border sm:inline-block" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}