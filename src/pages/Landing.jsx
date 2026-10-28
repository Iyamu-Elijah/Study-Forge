import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  ListChecks,
  NotebookPen,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { APP } from '@/config/env';
import { getProfileId } from '@/services/profileService';

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Courses',
    text: 'Course code, units, lecturer and timetable — with every assignment and note linked to it.',
  },
  {
    icon: ListChecks,
    title: 'Assignments & exams',
    text: 'Deadlines with priority, status and overdue views you can actually rely on.',
  },
  {
    icon: CalendarDays,
    title: 'Academic calendar',
    text: 'Month and week views of lectures, tests, exams and everything that is due.',
  },
  {
    icon: Timer,
    title: 'Focus timer',
    text: 'Pomodoro sessions that record the study time you really put in.',
  },
  {
    icon: NotebookPen,
    title: 'Notes',
    text: 'Searchable notes with tags, formatting and course links.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    text: 'Study time, completion and upcoming workload, calculated from your records.',
  },
];

const STEPS = [
  {
    title: 'Set up your semester',
    text: 'Your university, level, session and the courses you are registered for.',
  },
  {
    title: 'Add your deadlines',
    text: 'Assignments, tests, exams and projects, with due dates and priorities.',
  },
  {
    title: 'Study with focus',
    text: 'Run focus sessions, keep notes and watch your progress build up.',
  },
];

export default function Landing() {
  const hasProfile = Boolean(getProfileId());
  const primaryTarget = hasProfile ? '/dashboard' : '/onboarding';

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
            SF
          </span>
          <span className="font-heading text-lg font-semibold tracking-tight">{APP.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild size="sm">
            <Link to={primaryTarget}>{hasProfile ? 'Dashboard' : 'Get started'}</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="mx-auto w-full max-w-6xl px-4 pb-14 pt-8 sm:px-6 sm:pt-14">
          <div className="max-w-2xl">
            <p className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              Built for university students in Nigeria
            </p>
            <h1 className="mt-4 font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
              One calm place for your courses, deadlines and study time.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {APP.name} keeps your semester honest: every assignment, test, exam, lecture and note in
              one workspace, with the study time you actually logged behind every chart.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to={primaryTarget}>
                  {hasProfile ? 'Open my dashboard' : 'Set up my semester'}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <span className="text-sm text-muted-foreground">
                No sign-in needed to start — your setup takes about two minutes.
              </span>
            </div>
          </div>
        </section>

        <section aria-labelledby="features-heading" className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6">
          <h2 id="features-heading" className="font-heading text-xl font-semibold tracking-tight">
            What you get
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="mt-3 font-heading text-base font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="how-heading" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
          <div className="rounded-2xl border border-border bg-secondary/60 p-6 sm:p-8">
            <h2 id="how-heading" className="font-heading text-xl font-semibold tracking-tight">
              How it works
            </h2>
            <ol className="mt-5 grid gap-5 sm:grid-cols-3">
              {STEPS.map((item, index) => (
                <li key={item.title}>
                  <span className="font-heading text-sm font-semibold text-primary">
                    Step {index + 1}
                  </span>
                  <h3 className="mt-1 font-heading text-base font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </li>
              ))}
            </ol>
            <Button asChild className="mt-6">
              <Link to={primaryTarget}>{hasProfile ? 'Go to dashboard' : 'Start setup'}</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            {APP.name} — {APP.tagline}
          </p>
          <p>Built to run on modest laptops and mobile data.</p>
        </div>
      </footer>
    </div>
  );
}