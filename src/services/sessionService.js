/** Focus sessions and the study-time summaries built from them. */
import { entities } from '@/services/provider';
import { startOfWeekISO, todayISO } from '@/lib/date';

export async function recordSession(profileId, { courseId, minutes, startedAt, sessionDate }) {
  return entities.StudySession.create({
    profile_id: profileId,
    course_id: courseId || null,
    duration_minutes: Math.max(1, Math.round(minutes)),
    started_at: startedAt,
    session_date: sessionDate || todayISO(),
    source: 'timer',
  });
}

export async function listSessions(profileId, { from, to, courseId, limit = 100 } = {}) {
  const query = { profile_id: profileId };
  if (courseId) query.course_id = courseId;
  if (from || to) {
    query.session_date = {};
    if (from) query.session_date.$gte = from;
    if (to) query.session_date.$lte = to;
  }
  return entities.StudySession.filter(query, { sort: '-session_date', limit });
}

export async function deleteSession(sessionId) {
  return entities.StudySession.delete(sessionId);
}

/**
 * Study minutes per calendar day from `from`. One aggregate gives today's total,
 * this week's total and the chart series without loading session records.
 */
export async function studyByDay(profileId, from, unit = 'day') {
  const result = await entities.StudySession.aggregate({
    query: { profile_id: profileId, session_date: { $gte: from } },
    dateBucket: { field: 'session_date', unit },
    sum: ['duration_minutes'],
  });
  return (result.rows ?? [])
    .map((row) => ({
      date: row.session_date,
      minutes: row.sum_duration_minutes ?? 0,
      sessions: row.count ?? 0,
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export async function studyTotals(profileId) {
  const weekStart = startOfWeekISO();
  const days = await studyByDay(profileId, weekStart);
  const today = todayISO();
  return {
    weekStart,
    weekMinutes: days.reduce((total, day) => total + day.minutes, 0),
    todayMinutes: days.find((day) => day.date === today)?.minutes ?? 0,
    days,
  };
}

export async function studyByCourse(profileId, from) {
  const query = { profile_id: profileId };
  if (from) query.session_date = { $gte: from };
  const result = await entities.StudySession.aggregate({
    query,
    groupBy: 'course_id',
    sum: ['duration_minutes'],
  });
  return (result.rows ?? [])
    .map((row) => ({
      courseId: row.course_id ?? null,
      minutes: row.sum_duration_minutes ?? 0,
      sessions: row.count ?? 0,
    }))
    .sort((a, b) => b.minutes - a.minutes);
}