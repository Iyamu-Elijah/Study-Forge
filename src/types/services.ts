/**
 * Service contracts — the interfaces every implementation must satisfy.
 *
 * The application has exactly two seams: authentication (src/services/auth) and data
 * access (src/services/provider). Both are described here, so a page or component can
 * be written once and run against either the development provider or AWS.
 *
 * Nothing in this file imports a provider, a UI library, or the AWS SDK.
 */
import type {
  AcademicEvent,
  Assignment,
  AuditedRecord,
  AuthUser,
  Course,
  EntityId,
  Note,
  StudentProfile,
  StudySession,
  UserPreferences,
} from './models';

/* ------------------------------------------------------------------ data access */

/** A single page of records, mirroring the shape the service layer already expects. */
export interface Page<T> {
  items: T[];
  next_cursor?: string | null;
  has_more?: boolean;
}

export interface ListOptions {
  /** `'field'` ascending or `'-field'` descending. */
  sort?: string;
  /** Maximum records to return. */
  limit?: number;
  cursor?: string | null;
}

/** A provider-neutral query: `{ field: value }` or `{ field: { $gte: value } }`. */
export type Query = Record<string, unknown>;

/** Update operators, applied by the provider: `{ $set: { status: 'done' } }`. */
export type UpdatePatch = Record<string, unknown>;

export interface AggregateRequest {
  query?: Query;
  groupBy?: string;
  sum?: string[];
  avg?: string[];
  min?: string[];
  max?: string[];
  dateBucket?: { field: string; unit: 'day' | 'week' | 'month' };
}

export interface AggregateRow {
  count: number;
  [key: string]: string | number | undefined;
}

export interface AggregateResult {
  rows: AggregateRow[];
  /** True when the provider stopped early (bounded scan) — never silently incomplete. */
  truncated?: boolean;
}

export interface BulkWriteResult {
  updated?: number;
  deleted?: number;
  has_more?: boolean;
}

export interface EntityRepository<T extends AuditedRecord> {
  get(id: EntityId): Promise<T>;
  list(options?: ListOptions): Promise<Page<T>>;
  filter(query?: Query, options?: ListOptions): Promise<Page<T>>;
  count(query?: Query): Promise<number>;
  aggregate(request: AggregateRequest): Promise<AggregateResult>;
  create(data: Partial<T>): Promise<T>;
  bulkCreate(rows: Partial<T>[]): Promise<T[]>;
  update(id: EntityId, patch: UpdatePatch): Promise<T>;
  updateMany(query: Query, patch: UpdatePatch): Promise<BulkWriteResult>;
  delete(id: EntityId): Promise<void>;
  deleteMany(query: Query): Promise<BulkWriteResult>;
}

/** The entity keys are the stored model names — identical in both providers. */
export interface DataProvider {
  name: 'base44' | 'aws';
  entities: {
    StudentProfile: EntityRepository<StudentProfile>;
    Course: EntityRepository<Course>;
    AcademicTask: EntityRepository<Assignment>;
    AcademicEvent: EntityRepository<AcademicEvent>;
    Note: EntityRepository<Note>;
    StudySession: EntityRepository<StudySession>;
    UserPreferences: EntityRepository<UserPreferences>;
  };
}

/** Minimal structural view of the Amplify data client, so the provider stays typed. */
export interface GraphQLError {
  message?: string;
  errorType?: string;
}

export interface AmplifyModelClient {
  get(args: { id: string }): Promise<{ data?: AuditedRecord | null; errors?: GraphQLError[] }>;
  list(args?: {
    filter?: Record<string, unknown>;
    limit?: number;
    nextToken?: string;
    sort?: { field: string; direction: 'ASC' | 'DESC' };
  }): Promise<{ data?: AuditedRecord[]; nextToken?: string | null; errors?: GraphQLError[] }>;
  create(input: Record<string, unknown>): Promise<{ data?: AuditedRecord; errors?: GraphQLError[] }>;
  update(input: Record<string, unknown>): Promise<{ data?: AuditedRecord; errors?: GraphQLError[] }>;
  delete(input: { id: string }): Promise<{ data?: AuditedRecord; errors?: GraphQLError[] }>;
}

export interface AmplifyDataClient {
  models: Record<string, AmplifyModelClient>;
}

/* ----------------------------------------------------------------- authentication */

export type AppErrorCode =
  | 'unauthorized'
  | 'not_found'
  | 'conflict'
  | 'validation'
  | 'network'
  | 'not_configured'
  | 'unknown';

export interface AppError extends Error {
  code: AppErrorCode;
}

export interface AuthSession {
  user: AuthUser;
  /** Epoch milliseconds, when the identity provider reports an expiry. */
  expiresAt?: number;
}

export type SignInResult =
  | { status: 'signed_in'; session: AuthSession }
  | { status: 'new_password_required' }
  | { status: 'confirmation_required' };

export interface SignUpResult {
  needsConfirmation: boolean;
}

/**
 * One authentication architecture. Amazon Cognito is the production implementation;
 * the development stub reports `isConfigured() === false` and never issues a session.
 */
export interface AuthService {
  readonly providerName: 'cognito' | 'dev';
  /** False when no identity provider is configured — the app then runs without a sign-in wall. */
  isConfigured(): boolean;
  getSession(): Promise<AuthSession | null>;
  currentUser(): Promise<AuthUser | null>;
  signIn(email: string, password: string): Promise<SignInResult>;
  completeNewPassword(newPassword: string): Promise<AuthSession>;
  signUp(email: string, password: string, fullName?: string): Promise<SignUpResult>;
  confirmSignUp(email: string, code: string): Promise<void>;
  resendConfirmationCode(email: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void>;
  signOut(): Promise<void>;
  /** Notifies on sign-in and sign-out so the UI can react. Returns an unsubscribe function. */
  subscribe(listener: (session: AuthSession | null) => void): () => void;
}