/**
 * Date and time helpers.
 *
 * Academic deadlines are stored as a calendar date ("yyyy-MM-dd") plus a wall-clock
 * time ("HH:mm") instead of an absolute timestamp, so a deadline never shifts when
 * a student opens the app from a different time zone.
 */
import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns';

export const toISODate = (date) => format(date, 'yyyy-MM-dd');
export const todayISO = () => toISODate(new Date());
export const parseISODate = (iso) => (iso ? parseISO(iso) : null);
export const addDaysISO = (iso, amount) => toISODate(addDays(parseISODate(iso), amount));

export const formatDateLabel = (iso) => (iso ? format(parseISODate(iso), 'EEE d MMM') : 'No date');
export const formatFullDate = (iso) => (iso ? format(parseISODate(iso), 'd MMM yyyy') : 'No date');
export const formatMonthLabel = (date) => format(date, 'MMMM yyyy');
export const formatShortDay = (iso) => format(parseISODate(iso), 'EEE');
export const formatDayNumber = (iso) => format(parseISODate(iso), 'd');
export const formatWeekLabel = (iso) => format(parseISODate(iso), 'd MMM');
export const sameDay = (a, b) => (a && b ? a === b : false);

export const formatTimeLabel = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const base = new Date();
  base.setHours(hours || 0, minutes || 0, 0, 0);
  return format(base, 'h:mm a');
};

/** Sorting key that combines a date and an optional time into a comparable number. */
export const dateTimeValue = (dateISO, timeISO) => {
  if (!dateISO) return Number.MAX_SAFE_INTEGER;
  const [hours, minutes] = (timeISO || '23:59').split(':').map(Number);
  const base = parseISODate(dateISO);
  base.setHours(hours || 0, minutes || 0, 0, 0);
  return base.getTime();
};

export const isOverdue = (item, now = new Date()) => {
  if (!item?.due_date || item.status === 'completed') return false;
  const due = dateTimeValue(item.due_date, item.due_time);
  return due < now.getTime();
};

export const dueLabel = (dateISO, timeISO, now = new Date()) => {
  if (!dateISO) return 'No due date';
  const diff = differenceInCalendarDays(parseISODate(dateISO), now);
  const time = formatTimeLabel(timeISO);
  const suffix = time ? `, ${time}` : '';
  if (diff === 0) return `Due today${suffix}`;
  if (diff === 1) return `Due tomorrow${suffix}`;
  if (diff === -1) return `1 day overdue`;
  if (diff < -1) return `${Math.abs(diff)} days overdue`;
  if (diff <= 7) return `Due ${format(parseISODate(dateISO), 'EEEE')}${suffix}`;
  return `Due ${format(parseISODate(dateISO), 'EEE d MMM')}${suffix}`;
};

export const startOfWeekISO = (date = new Date()) =>
  toISODate(startOfWeek(date, { weekStartsOn: 1 }));
export const endOfWeekISO = (date = new Date()) => toISODate(endOfWeek(date, { weekStartsOn: 1 }));

export const weekDaysISO = (date = new Date()) =>
  eachDayOfInterval({
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  }).map(toISODate);

export const lastNDaysISO = (n, date = new Date()) =>
  eachDayOfInterval({ start: subDays(date, n - 1), end: date }).map(toISODate);

/** Six-week grid (Monday first) containing the whole month of `anchor`. */
export const monthGridISO = (anchor) => {
  const first = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
  const last = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
  return eachDayOfInterval({ start: first, end: last }).map(toISODate);
};

export const inMonth = (iso, anchor) => isSameMonth(parseISODate(iso), anchor);

export const minutesToLabel = (minutes) => {
  const total = Math.max(0, Math.round(minutes || 0));
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
};

export const formatClock = (seconds) => {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const nowTimeString = (date = new Date()) => format(date, 'HH:mm');