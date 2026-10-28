/** Dated academic events that are not deadlines: lectures, tests, exams, projects. */
import { entities } from '@/services/provider';

export async function listEvents(profileId, { from, to, courseId, limit = 200 } = {}) {
  const query = { profile_id: profileId };
  if (courseId) query.course_id = courseId;
  if (from || to) {
    query.start_date = {};
    if (from) query.start_date.$gte = from;
    if (to) query.start_date.$lte = to;
  }
  return entities.AcademicEvent.filter(query, { sort: 'start_date', limit });
}

export async function getEvent(eventId) {
  try {
    return await entities.AcademicEvent.get(eventId);
  } catch {
    return null;
  }
}

export async function createEvent(profileId, data) {
  return entities.AcademicEvent.create({
    type: 'lecture',
    all_day: false,
    ...data,
    profile_id: profileId,
  });
}

export async function updateEvent(eventId, data) {
  return entities.AcademicEvent.update(eventId, data);
}

export async function deleteEvent(eventId) {
  return entities.AcademicEvent.delete(eventId);
}