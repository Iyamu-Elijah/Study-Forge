/** Study preferences: theme, timer durations, weekly study target, timer sound. */
import { entities } from '@/services/provider';
import { TIMER_DEFAULTS } from '@/lib/constants';

export const DEFAULT_PREFERENCES = {
  theme: 'system',
  ...TIMER_DEFAULTS,
  weekly_study_target_hours: 0,
  timer_sound: true,
};

export async function getPreferences(profileId) {
  const page = await entities.UserPreferences.filter({ profile_id: profileId }, { limit: 1 });
  const record = page.items?.[0];
  return record ? { ...DEFAULT_PREFERENCES, ...record } : null;
}

export async function getOrCreatePreferences(profileId) {
  const existing = await getPreferences(profileId);
  if (existing) return existing;
  const created = await entities.UserPreferences.create({
    profile_id: profileId,
    ...DEFAULT_PREFERENCES,
  });
  return { ...DEFAULT_PREFERENCES, ...created };
}

export async function updatePreferences(profileId, patch) {
  const existing = await getPreferences(profileId);
  if (!existing) {
    const created = await entities.UserPreferences.create({
      profile_id: profileId,
      ...DEFAULT_PREFERENCES,
      ...patch,
    });
    return { ...DEFAULT_PREFERENCES, ...created };
  }
  const updated = await entities.UserPreferences.update(existing.id, patch);
  return { ...DEFAULT_PREFERENCES, ...updated };
}