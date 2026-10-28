/**
 * The domain model — the shape of every record StudyForge stores.
 *
 * These interfaces are the contract both data providers satisfy: the development
 * provider (preview only) and the AWS provider (Cognito identity + AppSync/DynamoDB).
 * Pages and components never import a provider directly.
 *
 * Dates are calendar days ('yyyy-MM-dd') and times are wall-clock ('HH:mm') strings, so
 * a deadline never shifts when a student travels. Timestamps appear only on the audit
 * fields the provider manages.
 */

export type EntityId = string;
/** A calendar day, 'yyyy-MM-dd'. */
export type ISODate = string;
/** A wall-clock time, 'HH:mm'. */
export type ISOTime = string;
/** An RFC 3339 timestamp. */
export type ISODateTime = string;

/** Fields every stored record carries; the provider sets them, not the UI. */
export interface AuditedRecord {
  id: EntityId;
  created_date?: ISODateTime;
  updated_date?: ISODateTime;
  created_by_id?: EntityId;
  /** Set by the AWS provider from the verified session — never sent by the browser. */
  owner?: string;
}

export interface AuthUser {
  id: EntityId;
  email: string;
  fullName?: string;
  emailVerified?: boolean;
}

export interface StudentProfile extends AuditedRecord {
  full_name: string;
  university: string;
  faculty?: string;
  department?: string;
  academic_level?: string;
  academic_session?: string;
  semester?: string;
  semester_start?: ISODate;
  semester_end?: ISODate;
  onboarding_completed?: boolean;
}

export type CourseStatus = 'active' | 'archived';

export interface Course extends AuditedRecord {
  profile_id: EntityId;
  title: string;
  code: string;
  description?: string;
  academic_session?: string;
  semester?: string;
  credit_units?: number;
  instructor?: string;
  timetable?: string;
  status: CourseStatus;
}

export type AssignmentType = 'assignment' | 'test' | 'examination' | 'project' | 'other';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed';

/** Stored as the `AcademicTask` model; called an assignment in the UI. */
export interface Assignment extends AuditedRecord {
  profile_id: EntityId;
  title: string;
  description?: string;
  course_id?: EntityId | null;
  type: AssignmentType;
  due_date: ISODate;
  due_time?: ISOTime;
  priority: TaskPriority;
  status: TaskStatus;
  estimated_minutes?: number;
  completed_date?: ISODate;
}

export type EventType = 'lecture' | 'test' | 'examination' | 'assignment' | 'project' | 'other';

export interface AcademicEvent extends AuditedRecord {
  profile_id: EntityId;
  title: string;
  description?: string;
  course_id?: EntityId | null;
  type: EventType;
  start_date: ISODate;
  start_time?: ISOTime;
  end_date?: ISODate;
  end_time?: ISOTime;
  all_day?: boolean;
  location?: string;
}

export interface Note extends AuditedRecord {
  profile_id: EntityId;
  title: string;
  content?: string;
  course_id?: EntityId | null;
  tags?: string[];
}

export type StudySessionSource = 'timer';

export interface StudySession extends AuditedRecord {
  profile_id: EntityId;
  course_id?: EntityId | null;
  session_date: ISODate;
  started_at?: ISODateTime;
  duration_minutes: number;
  source: StudySessionSource;
}

export type ThemePreference = 'light' | 'dark' | 'system';

export interface UserPreferences extends AuditedRecord {
  profile_id: EntityId;
  theme: ThemePreference;
  focus_minutes: number;
  short_break_minutes: number;
  long_break_minutes: number;
  long_break_every: number;
  weekly_study_target_hours: number;
  timer_sound: boolean;
}

/* ------------------------------------------------------------------- read models */

export type StatusCounts = Partial<Record<TaskStatus, number>>;

export interface StudyDayPoint {
  date: ISODate;
  minutes: number;
  sessions: number;
}

export interface StudyTotals {
  weekStart: ISODate;
  weekMinutes: number;
  todayMinutes: number;
  days: StudyDayPoint[];
}

export interface CourseStudyRow {
  courseId: EntityId | null;
  minutes: number;
  sessions: number;
}

export interface DashboardSnapshot {
  today: ISODate;
  todayTasks: Assignment[];
  overdueTasks: Assignment[];
  upcomingTasks: Assignment[];
  completed: number;
  open: number;
  inProgress: number;
  study: StudyTotals;
  courses: Course[];
  hasMoreCourses: boolean;
  openPerCourse: Record<EntityId, number>;
}

export interface AnalyticsSnapshot {
  today: ISODate;
  dailyFrom: ISODate;
  weeksFrom: ISODate;
  statusCounts: StatusCounts;
  completed: number;
  outstanding: number;
  inProgress: number;
  notStarted: number;
  /** Null until the student has at least one finished or outstanding task. */
  completionRate: number | null;
  daily: StudyDayPoint[];
  weekly: { date: ISODate; minutes: number }[];
  completedByWeek: { date: ISODate; completed: number }[];
  byCourse: (CourseStudyRow & { course: { code: string; title: string } | null })[];
  workload: Assignment[];
  overdue: number;
  courses: Course[];
}