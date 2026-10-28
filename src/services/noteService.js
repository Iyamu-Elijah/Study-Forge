/** Notes: searchable study notes with optional course links and tags. */
import { entities } from '@/services/provider';

export async function listNotes(profileId, { courseId, tag, search, limit = 50, cursor } = {}) {
  const query = { profile_id: profileId };
  if (courseId) query.course_id = courseId;
  if (tag) query.tags = { $in: [tag] };
  if (search) {
    query.$or = [
      { title: { $regex: search } },
      { content: { $regex: search } },
    ];
  }
  return entities.Note.filter(query, { sort: '-updated_date', limit, cursor });
}

export async function getNote(noteId) {
  try {
    return await entities.Note.get(noteId);
  } catch {
    return null;
  }
}

export async function createNote(profileId, data) {
  return entities.Note.create({ tags: [], ...data, profile_id: profileId });
}

export async function updateNote(noteId, data) {
  return entities.Note.update(noteId, data);
}

export async function deleteNote(noteId) {
  return entities.Note.delete(noteId);
}