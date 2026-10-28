/** Courses, including archive state and course-code de-duplication per session. */
import { entities } from '@/services/provider';

export const normalizeCode = (code) =>
  (code || '').trim().replace(/\s+/g, ' ').toUpperCase();

export async function listCourses(profileId, { includeArchived = false, limit = 50, cursor } = {}) {
  const query = { profile_id: profileId };
  if (!includeArchived) query.status = 'active';
  return entities.Course.filter(query, { sort: 'code', limit, cursor });
}

export async function getCourse(courseId) {
  try {
    return await entities.Course.get(courseId);
  } catch {
    return null;
  }
}

/** A course code may only repeat across different sessions or semesters. */
export async function findDuplicateCode(profileId, code, academicSession, semester) {
  const query = { profile_id: profileId, code: normalizeCode(code) };
  if (academicSession) query.academic_session = academicSession;
  if (semester) query.semester = semester;
  const page = await entities.Course.filter(query, { limit: 1 });
  return page.items?.[0] ?? null;
}

export async function createCourse(profileId, data) {
  return entities.Course.create({
    ...data,
    code: normalizeCode(data.code),
    profile_id: profileId,
    status: 'active',
  });
}

export async function createCourses(profileId, list) {
  if (!list.length) return [];
  return entities.Course.bulkCreate(
    list.map((item) => ({
      ...item,
      code: normalizeCode(item.code),
      profile_id: profileId,
      status: 'active',
    })),
  );
}

export async function updateCourse(courseId, data) {
  const payload = { ...data };
  if (payload.code) payload.code = normalizeCode(payload.code);
  return entities.Course.update(courseId, payload);
}

export async function setCourseStatus(courseId, status) {
  return entities.Course.update(courseId, { status });
}

/** Deleting a course keeps the student's work: related records simply lose the link. */
export async function deleteCourse(course) {
  const scope = { profile_id: course.profile_id, course_id: course.id };
  await Promise.all([
    entities.AcademicTask.updateMany(scope, { $set: { course_id: null } }),
    entities.AcademicEvent.updateMany(scope, { $set: { course_id: null } }),
    entities.Note.updateMany(scope, { $set: { course_id: null } }),
  ]);
  return entities.Course.delete(course.id);
}