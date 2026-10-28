import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getProfile, updateProfile } from '@/services/profileService';
import { getOrCreatePreferences, updatePreferences } from '@/services/preferencesService';

/** Loads the active student profile + preferences once and shares them with the app. */
const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [state, setState] = useState({
    loading: true,
    error: null,
    profile: null,
    preferences: null,
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const profile = await getProfile();
      if (!profile) {
        setState({ loading: false, error: null, profile: null, preferences: null });
        return;
      }
      const preferences = await getOrCreatePreferences(profile.id);
      setState({ loading: false, error: null, profile, preferences });
    } catch (error) {
      setState({
        loading: false,
        error: error?.message || 'We could not load your profile.',
        profile: null,
        preferences: null,
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const profileId = state.profile?.id;

  const savePreferences = useCallback(
    async (patch) => {
      if (!profileId) return null;
      const updated = await updatePreferences(profileId, patch);
      setState((prev) => ({ ...prev, preferences: updated }));
      return updated;
    },
    [profileId],
  );

  const saveProfile = useCallback(
    async (patch) => {
      if (!profileId) return null;
      const updated = await updateProfile(profileId, patch);
      setState((prev) => ({ ...prev, profile: updated }));
      return updated;
    },
    [profileId],
  );

  const value = useMemo(
    () => ({ ...state, reload: load, savePreferences, saveProfile }),
    [state, load, savePreferences, saveProfile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used inside ProfileProvider');
  return context;
}