/** Assignments, tests, examinations and other academic deadlines. */
import { entities } from '@/services/provider';
import { dateTimeValue, isOverdue, todayISO } from '@/lib/date';

const SORTS = {
  due_asc: 'due_date',
  due_desc: '-due_date',
  recent: '-created_date',
};

export function buildTaskQuery(profileId, filters = {}) {
  const { courseId, type, priority, status, search, from, to } = filters;
  const query = { profile_id: profileId };

  if (courseId) query.course_id = courseId;
  if (type) query.type = type;
  if (priority) query.priority = priority;

  const dateRange = {};
  if (from) dateRange.$gte = from;
  if (to) dateRange.$lte = to;

  if (status === 'overdue') {
    dateRange.$lt = todayISO();
    query.due_date = dateRange;
    query.status = { $ne: 'completed' };
  } else if (status) {
    query.status = status;
    if (Object.keys(dateRange).length) query.due_date = dateRange;
  } else if (Object.keys(dateRange).length) {
    query.due_date = dateRange;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search } },
      { description: { $regex: search } },
    ];
  }

  return query;
}

export async function listTasks(profileId, filters = {}, options = {}) {
  const { sort = 'due_asc', limit = 50, cursor } = options;
  return entities.AcademicTask.filter(buildTaskQuery(profileId, filters), {
    sort: SORTS[sort] ?? SORTS.due_asc,
    limit,
    cursor,
  });
}

export async function countTasks(profileId, filters = {}) {
  return entities.AcademicTask.count(buildTaskQuery(profileId, filters));
}

/**
 * Overdue = a past due date, or today with a due time already gone.
 * Two server queries keep the time-based part exact without client-side scans.
 */
export async function listOverdueTasks(profileId, limit = 25) {
  const today = todayISO();
  const [pastDue, dueToday] = await Promise.all([
    entities.AcademicTask.filter(
      { profile_id: profileId, due_date: { $lt: today }, status: { $ne: 'completed' } },
      { sort: 'due_date', limit },
    ),
    entities.AcademicTask.filter(
      { profile_id: profileId, due_date: today, status: { $ne: 'completed' }, due_time: { $exists: true } },
      { sort: 'due_time', limit },
    ),
  ]);
  const now = new Date();
  return [
    ...(pastDue.items ?? []),
    ...(dueToday.items ?? []).filter((task) => isOverdue(task, now)),
  ].sort((a, b) => dateTimeValue(a.due_date, a.due_time) - dateTimeValue(b.due_date, b.due_time));
}

export async function listUpcomingTasks(profileId, { from, to, limit = 25 } = {}) {
  const query = {
    profile_id: profileId,
    due_date: { $gte: from ?? todayISO(), ...(to ? { $lte: to } : {}) },
    status: { $ne: 'completed' },
  };
  return entities.AcademicTask.filter(query, { sort: 'due_date', limit });
}

export async function getTask(taskId) {
  try {
    return await entities.AcademicTask.get(taskId);
  } catch {
    return null;
  }
}

export async function createTask(profileId, data) {
  return entities.AcademicTask.create({
    status: 'not_started',
    priority: 'medium',
    type: 'assignment',
    ...data,
    profile_id: profileId,
  });
}

export async function updateTask(taskId, data) {
  return entities.AcademicTask.update(taskId, data);
}

export async function setTaskStatus(task, status) {
  return entities.AcademicTask.update(task.id, {
    status,
    completed_date: status === 'completed' ? todayISO() : null,
  });
}

export async function deleteTask(taskId) {
  return entities.AcademicTask.delete(taskId);
}

/** Completion counts by status — one server aggregate covers every dashboard counter. */
export async function countByStatus(profileId, extraQuery = {}) {
  const result = await entities.AcademicTask.aggregate({
    query: { profile_id: profileId, ...extraQuery },
    groupBy: 'status',
  });
  return (result.rows ?? []).reduce((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + (row.count ?? 0);
    return acc;
  }, {});
}

export async function openTasksByCourse(profileId) {
  const result = await entities.AcademicTask.aggregate({
    query: { profile_id: profileId, status: { $ne: 'completed' } },
    groupBy: 'course_id',
  });
  return (result.rows ?? []).reduce((acc, row) => {
    const key = row.course_id ?? 'unassigned';
    acc[key] = (acc[key] ?? 0) + (row.count ?? 0);
    return acc;
  }, {});
}