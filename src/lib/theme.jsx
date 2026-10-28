import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getProfileId } from '@/services/profileService';
import { updatePreferences } from '@/services/preferencesService';

/**
 * Light / dark / system theme. The choice is written to this device immediately and
 * mirrored onto the student's saved preferences when a profile exists, so it survives
 * both a refresh and a new session.
 */
const STORAGE_KEY = 'studyforge.theme';
const ThemeContext = createContext({ theme: 'system', resolvedTheme: 'light', setTheme: () => {} });

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

export const resolveTheme = (theme) =>
  theme === 'dark' || (theme === 'system' && systemPrefersDark()) ? 'dark' : 'light';

const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'system';
  } catch {
    return 'system';
  }
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStored);
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(readStored()));

  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setResolvedTheme(resolveTheme('system'));
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode */
    }
    const profileId = getProfileId();
    if (profileId) {
      updatePreferences(profileId, { theme: next }).catch(() => {
        /* the theme still applies locally; the saved copy retries next change */
      });
    }
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useAppTheme = () => useContext(ThemeContext);