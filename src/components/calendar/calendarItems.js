/** Normalises tasks and events into one calendar item shape, grouped by date. */
import { dateTimeValue } from '@/lib/date';

export const toCalendarItems = (tasks = [], events = []) => [
  ...tasks.map((task) => ({
    key: `task-${task.id}`,
    kind: 'task',
    id: task.id,
    title: task.title,
    date: task.due_date,
    time: task.due_time || '',
    type: task.type,
    courseId: task.course_id,
    status: task.status,
    raw: task,
  })),
  ...events.map((event) => ({
    key: `event-${event.id}`,
    kind: 'event',
    id: event.id,
    title: event.title,
    date: event.start_date,
    time: event.all_day ? '' : event.start_time || '',
    type: event.type,
    courseId: event.course_id,
    raw: event,
  })),
].sort((a, b) => dateTimeValue(a.date, a.time) - dateTimeValue(b.date, b.time));

export const groupByDate = (items) =>
  items.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});