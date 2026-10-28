/** Shared vocabularies and literal style tokens used across StudyForge forms and badges. */

export const LEVELS = [
  { value: '100', label: '100 Level (Year 1)' },
  { value: '200', label: '200 Level (Year 2)' },
  { value: '300', label: '300 Level (Year 3)' },
  { value: '400', label: '400 Level (Year 4)' },
  { value: '500', label: '500 Level (Year 5)' },
  { value: '600', label: '600 Level (Year 6)' },
  { value: 'Postgraduate', label: 'Postgraduate' },
];

export const SEMESTERS = [
  'First Semester',
  'Second Semester',
  'Third Semester (Trimester)',
  'Summer / Inter-semester',
];

export const TASK_TYPES = [
  { value: 'assignment', label: 'Assignment' },
  { value: 'test', label: 'Test' },
  { value: 'examination', label: 'Examination' },
  { value: 'project', label: 'Project' },
  { value: 'other', label: 'Other' },
];

export const TASK_STATUSES = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

export const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export const EVENT_TYPES = [
  { value: 'lecture', label: 'Lecture' },
  { value: 'test', label: 'Test' },
  { value: 'examination', label: 'Examination' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'project', label: 'Project' },
  { value: 'other', label: 'Other' },
];

export const FACULTY_SUGGESTIONS = [
  'Faculty of Science',
  'Faculty of Arts',
  'Faculty of Social Sciences',
  'Faculty of Engineering',
  'Faculty of Law',
  'Faculty of Medicine',
  'Faculty of Basic Medical Sciences',
  'Faculty of Pharmacy',
  'Faculty of Agriculture',
  'Faculty of Education',
  'Faculty of Management Sciences',
  'Faculty of Environmental Sciences',
  'Faculty of Communication and Media Studies',
];

export const UNIVERSITY_SUGGESTIONS = [
  'University of Lagos',
  'University of Ibadan',
  'Obafemi Awolowo University',
  'Ahmadu Bello University',
  'University of Nigeria, Nsukka',
  'University of Benin',
  'University of Ilorin',
  'Federal University of Technology, Akure',
  'Federal University of Technology, Minna',
  'Covenant University',
  'Lagos State University',
  'Bayero University Kano',
  'Nnamdi Azikiwe University',
  'University of Port Harcourt',
];

export const TIMER_DEFAULTS = {
  focus_minutes: 25,
  short_break_minutes: 5,
  long_break_minutes: 15,
  long_break_every: 4,
};

export const labelFor = (list, value) =>
  list.find((item) => item.value === value)?.label ?? 'Other';

export const PRIORITY_STYLES = {
  low: 'border-border bg-muted text-muted-foreground',
  medium: 'border-primary/20 bg-primary/10 text-primary',
  high: 'border-destructive/25 bg-destructive/10 text-destructive',
};

export const STATUS_STYLES = {
  not_started: 'border-border bg-muted text-muted-foreground',
  in_progress: 'border-accent/30 bg-accent/15 text-accent-foreground',
  completed: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
};

export const TYPE_STYLES = {
  assignment: 'border-primary/20 bg-primary/10 text-primary',
  test: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  examination: 'border-destructive/25 bg-destructive/10 text-destructive',
  project: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  lecture: 'border-primary/20 bg-primary/10 text-primary',
  other: 'border-border bg-muted text-muted-foreground',
};