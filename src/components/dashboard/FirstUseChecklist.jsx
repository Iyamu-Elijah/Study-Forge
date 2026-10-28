import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STEPS = [
  {
    id: 'courses',
    title: 'Add your courses',
    text: 'Courses keep your deadlines, notes and study time in context.',
    to: '/courses?new=1',
    cta: 'Add a course',
  },
  {
    id: 'task',
    title: 'Record your first deadline',
    text: 'Assignments, tests and exams appear on your dashboard and calendar.',
    to: '/assignments?new=1',
    cta: 'Add an assignment',
  },
  {
    id: 'session',
    title: 'Run a focus session',
    text: 'The timer records exactly how long you studied, per course.',
    to: '/study',
    cta: 'Open the timer',
  },
];

const GRID_COLUMNS = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
};

export default function FirstUseChecklist({ hasCourses }) {
  const steps = hasCourses ? STEPS.filter((step) => step.id !== 'courses') : STEPS;

  return (
    <Card className="border-primary/20 bg-primary/[0.03]">
      <CardHeader className="space-y-1">
        <CardTitle className="font-heading text-base">
          {hasCourses ? 'Now add your first deadlines' : 'Get set up in three steps'}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Your dashboard fills up as soon as you add real work — nothing here is sample data.
        </p>
      </CardHeader>
      <CardContent>
        <ol className={`grid gap-3 ${GRID_COLUMNS[steps.length] ?? GRID_COLUMNS[3]}`}>
          {steps.map((step, index) => (
            <li key={step.id} className="rounded-xl border border-border bg-card p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                {index + 1}
              </span>
              <h3 className="mt-3 font-heading text-sm font-semibold">{step.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
              <Link
                to={step.to}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                {step.cta}
              </Link>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}