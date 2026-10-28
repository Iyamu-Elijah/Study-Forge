/**
 * AWS data provider — Amplify Gen 2 data API backed by DynamoDB, authorized by Cognito.
 *
 * It implements the same contract as the development provider, so the service layer and
 * every page keep working unchanged. Three things are deliberate:
 *
 * 1. Ownership is enforced by the backend. Each model in amplify/data/resource.ts grants
 *    `allow.owner()`, so AppSync only ever returns records whose owner is the caller's
 *    Cognito identity. Filters here can only narrow that set — they can never widen it.
 * 2. A user id from the browser is never trusted. `profile_id` is stamped from the
 *    signed-in session on create, and any `profile_id` arriving from a caller is ignored.
 * 3. `count` and `aggregate` are bounded scans of the caller's own records, because the
 *    Amplify data client exposes no server-side aggregate. The scalable replacement is a
 *    Lambda-backed custom query (see docs/AWS_DEPLOYMENT.md).
 */
import { getDataClient } from './amplifyClient';
import { authService } from '@/services/auth';
import type {
  AggregateRequest,
  AggregateResult,
  AggregateRow,
  AmplifyDataClient,
  AmplifyModelClient,
  AppError,
  AppErrorCode,
  BulkWriteResult,
  DataProvider,
  EntityRepository,
  GraphQLError,
  ListOptions,
  Page,
  Query,
  UpdatePatch,
} from '@/types/services';
import type { AuditedRecord } from '@/types/models';

type AnyRecord = AuditedRecord & Record<string, any>;

/** Model names — identical to the domain entity names in both providers. */
const MODEL_NAMES = [
  'StudentProfile',
  'Course',
  'AcademicTask',
  'AcademicEvent',
  'Note',
  'StudySession',
  'UserPreferences',
] as const;

/** Models whose records are grouped by the student's profile id. */
const PROFILE_SCOPED = new Set<string>([
  'Course',
  'AcademicTask',
  'AcademicEvent',
  'Note',
  'StudySession',
  'UserPreferences',
]);

/** The profile is the root record: it is resolved from the session, never from an argument. */
const PROFILE_MODEL = 'StudentProfile';

const PAGE_SIZE = 200;
/** Bound on scans, so an aggregate can never loop indefinitely. */
const MAX_PAGES = 25;
const BULK_CHUNK = 10;

/* --------------------------------------------------------------------------- errors */

const providerError = (message: string, code: AppErrorCode = 'unknown'): AppError => {
  const error = new Error(message) as AppError;
  error.code = code;
  error.name = 'ProviderError';
  return error;
};

const toAppError = (error: GraphQLError | unknown): AppError => {
  if (error && typeof error === 'object' && 'code' in error) return error as AppError;
  const message = String((error as GraphQLError)?.message ?? error ?? 'Request failed');
  const lower = message.toLowerCase();
  if (lower.includes('unauthor') || lower.includes('not authorized')) {
    return providerError('You do not have access to this record.', 'unauthorized');
  }
  if (lower.includes('not found') || lower.includes('does not exist')) {
    return providerError('That record no longer exists.', 'not_found');
  }
  if (lower.includes('conditional') || lower.includes('conflict')) {
    return providerError('That change conflicts with a newer version of the record.', 'conflict');
  }
  if (lower.includes('validat')) {
    return providerError('Some values were rejected by the server.', 'validation');
  }
  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return providerError('We could not reach the data service. Check your connection.', 'network');
  }
  return providerError(message, 'unknown');
};

/* ------------------------------------------------------------------ query translation */

/** Translates the service layer's queries into the Amplify/AppSync filter shape. */
const translateFilter = (query: Query = {}): Record<string, unknown> => {
  const filter: Record<string, unknown> = {};

  for (const [field, value] of Object.entries(query)) {
    if (field === '$or' && Array.isArray(value)) {
      filter.or = value.map((entry) => translateFilter(entry as Query));
      continue;
    }
    if (field === '$and' && Array.isArray(value)) {
      filter.and = value.map((entry) => translateFilter(entry as Query));
      continue;
    }
    // Ownership is never expressed as a filter: the backend decides it.
    if (field === 'owner') continue;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const source = value as Record<string, unknown>;
      const operators: Record<string, unknown> = {};
      if ('$eq' in source) operators.eq = source.$eq;
      if ('$ne' in source) operators.ne = source.$ne;
      if ('$gt' in source) operators.gt = source.$gt;
      if ('$gte' in source) operators.ge = source.$gte;
      if ('$lt' in source) operators.lt = source.$lt;
      if ('$lte' in source) operators.le = source.$lte;
      if ('$in' in source) operators.in = source.$in;
      if ('$regex' in source) operators.contains = String(source.$regex).replace(/^\^|\$$/g, '');
      filter[field] = operators;
      continue;
    }

    filter[field] = { eq: value };
  }

  return filter;
};

const translateSort = (sort?: string) => {
  if (!sort) return undefined;
  const descending = sort.startsWith('-');
  return { field: descending ? sort.slice(1) : sort, direction: descending ? ('DESC' as const) : ('ASC' as const) };
};

const toPage = <T>(result: { data?: unknown; nextToken?: string | null }): Page<T> => ({
  items: (result?.data ?? []) as T[],
  next_cursor: result?.nextToken ?? null,
  has_more: Boolean(result?.nextToken),
});

/* ------------------------------------------------------------------------- ownership */

let cachedProfileId: string | null = null;

/** The signed-in student's own profile id, resolved from Cognito — never from a caller. */
async function resolveProfileId(): Promise<string> {
  if (cachedProfileId) return cachedProfileId;
  const session = await authService.getSession();
  if (!session) throw providerError('Please sign in again.', 'unauthorized');
  const result = await model(PROFILE_MODEL).list({ limit: 1 });
  const profile = unwrap(result) ?? [];
  if (!profile.length) throw providerError('Finish setting up your profile first.', 'not_found');
  cachedProfileId = profile[0].id;
  return cachedProfileId;
}

/** Stamps the verified profile id on create, replacing anything the caller supplied. */
async function withOwner(name: string, data: Record<string, any>): Promise<Record<string, any>> {
  if (!PROFILE_SCOPED.has(name)) return data;
  const profileId = await resolveProfileId();
  const { profile_id: _ignored, ...rest } = data;
  return { ...rest, profile_id: profileId };
}

/**
 * Rewrites any `profile_id` in a query to the verified session profile, so a query can
 * neither widen access nor depend on an id the browser happens to hold.
 */
async function scopedQuery(name: string, query: Query = {}): Promise<Query> {
  if (!PROFILE_SCOPED.has(name)) return query;
  const profileId = await resolveProfileId();
  return { ...query, profile_id: profileId };
}

/* ---------------------------------------------------------------------- client access */

let client: AmplifyDataClient | null = null;

function data(): AmplifyDataClient {
  if (!client) client = getDataClient();
  return client;
}

function model(name: string): AmplifyModelClient {
  const handle = data().models?.[name];
  if (!handle) throw providerError(`The ${name} model is not available in this API.`, 'not_configured');
  return handle;
}

const unwrap = <T>(result: { data?: T; errors?: GraphQLError[] }): T => {
  if (result?.errors?.length) throw toAppError(result.errors[0]);
  return result?.data as T;
};

/* ------------------------------------------------------------------------- read paths */

/** Reads every matching page of the caller's own records, up to the scan bound. */
async function scan(name: string, query: Query = {}, options: ListOptions = {}) {
  const rows: AnyRecord[] = [];
  let cursor: string | null = options.cursor ?? null;
  let pages = 0;

  do {
    const result = await model(name).list({
      filter: translateFilter(await scopedQuery(name, query)),
      limit: Math.min(options.limit ?? PAGE_SIZE, PAGE_SIZE),
      nextToken: cursor ?? undefined,
      sort: translateSort(options.sort),
    });
    rows.push(...((unwrap(result) ?? []) as AnyRecord[]));
    cursor = result?.nextToken ?? null;
    pages += 1;
  } while (cursor && pages < MAX_PAGES);

  return { rows, truncated: Boolean(cursor) };
}

const startOfWeek = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const day = (date.getUTCDay() + 6) % 7; // Monday-first
  date.setUTCDate(date.getUTCDate() - day);
  return date.toISOString().slice(0, 10);
};

const bucketKey = (value: unknown, unit: 'day' | 'week' | 'month') => {
  const iso = String(value ?? '').slice(0, 10);
  if (!iso) return '';
  if (unit === 'month') return `${iso.slice(0, 7)}-01`;
  if (unit === 'week') return startOfWeek(iso);
  return iso;
};

/** Aggregates the caller's own records in the browser — bounded, never silent about truncation. */
async function aggregate(name: string, request: AggregateRequest = {}): Promise<AggregateResult> {
  const { rows, truncated } = await scan(name, request.query ?? {});
  const groups = new Map<string, { row: AggregateRow; values: Record<string, number[]> }>();
  const keyField = request.dateBucket?.field ?? request.groupBy ?? '__all';

  for (const record of rows) {
    const key = request.dateBucket
      ? bucketKey(record[request.dateBucket.field], request.dateBucket.unit)
      : request.groupBy
        ? String(record[request.groupBy] ?? '')
        : 'all';

    let group = groups.get(key);
    if (!group) {
      group = { row: { [keyField]: key, count: 0 }, values: {} };
      groups.set(key, group);
    }
    group.row.count += 1;

    for (const field of [...(request.sum ?? []), ...(request.avg ?? []), ...(request.min ?? []), ...(request.max ?? [])]) {
      const value = Number(record[field]);
      if (Number.isFinite(value)) {
        group.values[field] = group.values[field] ?? [];
        group.values[field].push(value);
      }
    }
  }

  for (const group of groups.values()) {
    for (const field of request.sum ?? []) {
      group.row[`sum_${field}`] = (group.values[field] ?? []).reduce((total, value) => total + value, 0);
    }
    for (const field of request.avg ?? []) {
      const values = group.values[field] ?? [];
      group.row[`avg_${field}`] = values.length ? values.reduce((t, v) => t + v, 0) / values.length : 0;
    }
    for (const field of request.min ?? []) {
      const values = group.values[field] ?? [];
      group.row[`min_${field}`] = values.length ? Math.min(...values) : undefined;
    }
    for (const field of request.max ?? []) {
      const values = group.values[field] ?? [];
      group.row[`max_${field}`] = values.length ? Math.max(...values) : undefined;
    }
  }

  const sorted = [...groups.values()].map((group) => group.row);
  if (request.dateBucket) sorted.sort((a, b) => String(a[keyField]).localeCompare(String(b[keyField])));

  return { rows: sorted, truncated };
}

/* ------------------------------------------------------------------------ write paths */

const applyPatch = (record: AnyRecord, patch: UpdatePatch): Record<string, any> => {
  if (!Object.keys(patch).some((key) => key.startsWith('$'))) return { ...record, ...patch };

  const next: Record<string, any> = { ...record };
  if (patch.$set) Object.assign(next, patch.$set as Record<string, unknown>);
  if (patch.$unset) {
    for (const key of Object.keys(patch.$unset as Record<string, unknown>)) delete next[key];
  }
  if (patch.$inc) {
    for (const [key, delta] of Object.entries(patch.$inc as Record<string, number>)) {
      next[key] = Number(next[key] ?? 0) + Number(delta);
    }
  }
  if (patch.$addToSet) {
    for (const [key, value] of Object.entries(patch.$addToSet as Record<string, unknown>)) {
      const list = Array.isArray(next[key]) ? next[key] : [];
      next[key] = list.includes(value) ? list : [...list, value];
    }
  }
  if (patch.$push) {
    for (const [key, value] of Object.entries(patch.$push as Record<string, unknown>)) {
      const list = Array.isArray(next[key]) ? next[key] : [];
      next[key] = [...list, value];
    }
  }
  if (patch.$pull) {
    for (const [key, value] of Object.entries(patch.$pull as Record<string, unknown>)) {
      const list = Array.isArray(next[key]) ? next[key] : [];
      next[key] = list.filter((entry) => entry !== value);
    }
  }
  return next;
};

/** Amplify has no bulk write, so matches are read first and written in small batches. */
async function chunked<T>(items: T[], work: (item: T) => Promise<unknown>) {
  for (let index = 0; index < items.length; index += BULK_CHUNK) {
    await Promise.all(items.slice(index, index + BULK_CHUNK).map(work));
  }
}

/* ------------------------------------------------------------------------ repositories */

function repository(name: string): EntityRepository<any> {
  const isProfile = name === PROFILE_MODEL;

  const create = async (input: Partial<AnyRecord>): Promise<AnyRecord> =>
    unwrap(await model(name).create(await withOwner(name, { ...(input as Record<string, any>) }))) as AnyRecord;

  const update = async (id: string, patch: UpdatePatch): Promise<AnyRecord> => {
    const current = await get(id);
    const next = applyPatch(current, patch);
    return unwrap(await model(name).update(next)) as AnyRecord;
  };

  const get = async (id: string): Promise<AnyRecord> => {
    // The profile is resolved from the session: a browser-supplied id is not proof of
    // ownership, so it is only used to read the caller's own record.
    const targetId = isProfile ? await resolveProfileId() : id;
    const result = await model(name).get({ id: targetId });
    const record = unwrap(result);
    if (!record) throw providerError('That record no longer exists.', 'not_found');
    return record as AnyRecord;
  };

  const remove = async (id: string): Promise<void> => {
    const targetId = isProfile ? await resolveProfileId() : id;
    const result = await model(name).delete({ id: targetId });
    if (result?.errors?.length) throw toAppError(result.errors[0]);
  };

  return {
    get,
    list: async (options) => toPage(await model(name).list({
      limit: Math.min(options?.limit ?? 100, PAGE_SIZE),
      nextToken: options?.cursor ?? undefined,
      sort: translateSort(options?.sort),
    })),
    filter: async (query, options) => {
      // For the profile, any id filter is dropped: the session decides which record this is.
      const effective = isProfile
        ? Object.fromEntries(Object.entries(query ?? {}).filter(([field]) => field !== 'id' && field !== 'profile_id'))
        : await scopedQuery(name, query ?? {});
      return toPage(await model(name).list({
        filter: translateFilter(effective),
        limit: Math.min(options?.limit ?? 100, PAGE_SIZE),
        nextToken: options?.cursor ?? undefined,
        sort: translateSort(options?.sort),
      }));
    },
    count: async (query) => (await scan(name, query ?? {})).rows.length,
    aggregate: (request) => aggregate(name, request ?? {}),
    create,
    bulkCreate: (rows) => Promise.all(rows.map((row) => create(row))),
    update,
    updateMany: async (query, patch): Promise<BulkWriteResult> => {
      const { rows, truncated } = await scan(name, query ?? {});
      await chunked(rows, (row) => update(row.id, patch));
      return { updated: rows.length, has_more: truncated };
    },
    delete: remove,
    deleteMany: async (query): Promise<BulkWriteResult> => {
      const { rows, truncated } = await scan(name, query ?? {});
      await chunked(rows, (row) => remove(row.id));
      return { deleted: rows.length, has_more: truncated };
    },
  };
}

export function createAwsProvider(): DataProvider {
  return {
    name: 'aws',
    entities: MODEL_NAMES.reduce(
      (accumulator, name) => {
        accumulator[name] = repository(name);
        return accumulator;
      },
      {} as Record<string, EntityRepository<any>>,
    ) as unknown as DataProvider['entities'],
  };
}

/** Called on sign-out so the next student never reuses a cached profile id. */
export function resetAwsProviderCache(): void {
  cachedProfileId = null;
  client = null;
}