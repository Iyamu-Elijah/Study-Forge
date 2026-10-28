import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import AcademicProfileForm from '@/components/settings/AcademicProfileForm';
import StudyPreferencesForm from '@/components/settings/StudyPreferencesForm';
import DataPrivacyCard from '@/components/settings/DataPrivacyCard';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useProfile } from '@/lib/profile-context';
import { useAppTheme } from '@/lib/theme';
import { APP } from '@/config/env';

export default function Settings() {
  const { profile, preferences, saveProfile, savePreferences } = useProfile();
  const { toast } = useToast();
  const { theme } = useAppTheme();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  const updateProfile = async (patch) => {
    setSavingProfile(true);
    try {
      await saveProfile(patch);
      toast({ title: 'Academic profile updated' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not save your profile',
        description: error?.message || 'Please try again.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const updatePreferences = async (patch) => {
    setSavingPreferences(true);
    try {
      await savePreferences(patch);
      toast({ title: 'Preferences saved' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not save your preferences',
        description: error?.message || 'Please try again.',
      });
    } finally {
      setSavingPreferences(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Your academic profile, appearance, study preferences and data."
      />

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="font-heading text-base">Academic profile</CardTitle>
          <p className="text-sm text-muted-foreground">
            Update your details whenever your level, session or semester changes.
          </p>
        </CardHeader>
        <CardContent>
          <AcademicProfileForm profile={profile} onSave={updateProfile} saving={savingProfile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="font-heading text-base">Appearance</CardTitle>
          <p className="text-sm text-muted-foreground">
            {theme === 'system'
              ? 'Following your device setting.'
              : `Using the ${theme} theme.`}{' '}
            Your choice is remembered on this device and in your saved preferences.
          </p>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="font-heading text-base">Study preferences</CardTitle>
          <p className="text-sm text-muted-foreground">
            Focus and break lengths used by the timer, plus your optional weekly study target.
          </p>
        </CardHeader>
        <CardContent>
          <StudyPreferencesForm
            preferences={preferences}
            onSave={updatePreferences}
            saving={savingPreferences}
          />
        </CardContent>
      </Card>

      <DataPrivacyCard profile={profile} />

      <p className="pb-4 text-xs text-muted-foreground">
        {APP.name} — {APP.tagline}
      </p>
    </div>
  );
}