/**
 * Dashboard and analytics figures.
 *
 * Every number here is derived from stored records — counts and sums come from the
 * server (count / aggregate) rather than from lists loaded into the browser.
 */
import { entities } from '@/services/provider';
import { addDaysISO, parseISODate, startOfWeekISO, todayISO } from '@/lib/date';
import { listCourses } from './courseService';
import { countByStatus, listOverdueTasks, listUpcomingTasks, openTasksByCourse } from './taskService';
import { studyByCourse, studyByDay, studyTotals } from './sessionService';

/**
 * Weekly totals are folded from daily buckets: the server can only bucket weeks on
 * its own created_date / updated_date stamps, so daily buckets — which work on any
 * date field — are grouped into weeks here instead.
 */
const foldIntoWeeks = (rows, key) => {
  const buckets = rows.reduce((acc, row) => {
    const weekStart = startOfWeekISO(parseISODate(row.date));
    if (!acc[weekStart]) acc[weekStart] = { date: weekStart, value: 0 };
    acc[weekStart].value += row[key] ?? 0;
    return acc;
  }, {});
  return Object.values(buckets).sort((a, b) => (a.date < b.date ? -1 : 1));
};

export async function getDashboardSnapshot(profileId) {
  const today = todayISO();
  const weekEnd = addDaysISO(today, 7);

  const [
    todayTasks,
    overdueTasks,
    upcomingTasks,
    statusCounts,
    study,
    courses,
    openPerCourse,
  ] = await Promise.all([
    entities.AcademicTask.filter(
      { profile_id: profileId, due_date: today, status: { $ne: 'completed' } },
      { sort: 'due_time', limit: 20 },
    ),
    listOverdueTasks(profileId, 10),
    listUpcomingTasks(profileId, { from: addDaysISO(today, 1), to: weekEnd, limit: 20 }),
    countByStatus(profileId),
    studyTotals(profileId),
    listCourses(profileId, { limit: 50 }),
    openTasksByCourse(profileId),
  ]);

  const completed = statusCounts.completed ?? 0;
  const open = (statusCounts.not_started ?? 0) + (statusCounts.in_progress ?? 0);

  return {
    today,
    todayTasks: todayTasks.items ?? [],
    overdueTasks,
    upcomingTasks: upcomingTasks.items ?? [],
    completed,
    open,
    inProgress: statusCounts.in_progress ?? 0,
    study,
    courses: courses.items ?? [],
    hasMoreCourses: Boolean(courses.has_more),
    openPerCourse,
  };
}

export async function getAnalyticsSnapshot(profileId) {
  const today = todayISO();
  const dailyFrom = addDaysISO(today, -13);
  const weeksFrom = addDaysISO(startOfWeekISO(), -49);
  const workloadEnd = addDaysISO(today, 14);

  const [statusCounts, daily, weeklyDays, byCourse, workload, overdue, courses, completedDays] =
    await Promise.all([
      countByStatus(profileId),
      studyByDay(profileId, dailyFrom, 'day'),
      studyByDay(profileId, weeksFrom, 'day'),
      studyByCourse(profileId, addDaysISO(today, -27)),
      entities.AcademicTask.filter(
        { profile_id: profileId, due_date: { $gte: today, $lte: workloadEnd } },
        { sort: 'due_date', limit: 100 },
      ),
      entities.AcademicTask.count({
        profile_id: profileId,
        due_date: { $lt: today },
        status: { $ne: 'completed' },
      }),
      listCourses(profileId, { includeArchived: true, limit: 50 }),
      entities.AcademicTask.aggregate({
        query: {
          profile_id: profileId,
          status: 'completed',
          completed_date: { $gte: weeksFrom },
        },
        dateBucket: { field: 'completed_date', unit: 'day' },
      }),
    ]);

  const courseList = courses.items ?? [];
  const courseNames = courseList.reduce((acc, course) => {
    acc[course.id] = { code: course.code, title: course.title };
    return acc;
  }, {});

  const completed = statusCounts.completed ?? 0;
  const outstanding = (statusCounts.not_started ?? 0) + (statusCounts.in_progress ?? 0);

  const weekly = foldIntoWeeks(weeklyDays, 'minutes').map((week) => ({
    date: week.date,
    minutes: week.value,
  }));

  const completedByWeek = foldIntoWeeks(
    (completedDays.rows ?? []).map((row) => ({
      date: row.completed_date,
      completed: row.count ?? 0,
    })),
    'completed',
  ).map((week) => ({ date: week.date, completed: week.value }));

  return {
    today,
    dailyFrom,
    weeksFrom,
    statusCounts,
    completed,
    outstanding,
    inProgress: statusCounts.in_progress ?? 0,
    notStarted: statusCounts.not_started ?? 0,
    completionRate: completed + outstanding > 0 ? completed / (completed + outstanding) : null,
    daily,
    weekly,
    completedByWeek,
    byCourse: byCourse.map((row) => ({
      ...row,
      course: row.courseId ? courseNames[row.courseId] : null,
    })),
    workload: workload.items ?? [],
    overdue,
    courses: courseList,
  };
}