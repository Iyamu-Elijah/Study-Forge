/**
 * Student profiles.
 *
 * The active profile id is remembered on this device so a student's records stay
 * scoped to their own profile. Profile ids are not a security boundary on their own
 * — an account layer (Cognito) is the documented prerequisite for private records.
 */
import { entities } from '@/services/provider';
import { isAwsProvider } from '@/config/env';

const PROFILE_KEY = 'studyforge.profileId';

export const getProfileId = () => {
  try {
    return localStorage.getItem(PROFILE_KEY) || '';
  } catch {
    return '';
  }
};

export const setProfileId = (id) => {
  try {
    localStorage.setItem(PROFILE_KEY, id);
  } catch {
    /* private mode — the session simply won't persist */
  }
};

export const clearProfileId = () => {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* ignore */
  }
};

export async function getProfile() {
  const id = getProfileId();

  // On AWS the profile is resolved from the Cognito session, so a device that has never
  // stored an id still loads the student's own profile. The backend only ever returns
  // records owned by the signed-in identity, so this cannot read someone else's.
  if (isAwsProvider()) {
    try {
      const page = await entities.StudentProfile.list({ limit: 1 });
      const profile = page.items?.[0] ?? null;
      if (profile) setProfileId(profile.id);
      return profile;
    } catch {
      return null;
    }
  }

  if (!id) return null;
  try {
    return await entities.StudentProfile.get(id);
  } catch {
    return null;
  }
}

export async function createProfile(data) {
  const profile = await entities.StudentProfile.create({
    ...data,
    onboarding_completed: true,
  });
  setProfileId(profile.id);
  return profile;
}

export async function updateProfile(id, data) {
  return entities.StudentProfile.update(id, data);
}

/** Removes every record owned by this profile. Used by the account danger zone. */
export async function deleteAllProfileData(profileId) {
  await Promise.all([
    entities.Course.deleteMany({ profile_id: profileId }),
    entities.AcademicTask.deleteMany({ profile_id: profileId }),
    entities.AcademicEvent.deleteMany({ profile_id: profileId }),
    entities.Note.deleteMany({ profile_id: profileId }),
    entities.StudySession.deleteMany({ profile_id: profileId }),
    entities.UserPreferences.deleteMany({ profile_id: profileId }),
  ]);
  await entities.StudentProfile.delete(profileId);
  clearProfileId();
}