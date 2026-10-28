import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import FormField from '@/components/common/FormField';

const fromPreferences = (preferences) => ({
  focus_minutes: preferences?.focus_minutes ?? 25,
  short_break_minutes: preferences?.short_break_minutes ?? 5,
  long_break_minutes: preferences?.long_break_minutes ?? 15,
  long_break_every: preferences?.long_break_every ?? 4,
  weekly_study_target_hours: preferences?.weekly_study_target_hours ?? 0,
  timer_sound: preferences?.timer_sound ?? true,
});

const LIMITS = {
  focus_minutes: [1, 180, 'Focus length must be between 1 and 180 minutes.'],
  short_break_minutes: [1, 60, 'Short breaks must be between 1 and 60 minutes.'],
  long_break_minutes: [1, 120, 'Long breaks must be between 1 and 120 minutes.'],
  long_break_every: [1, 12, 'Take a long break after 1 to 12 sessions.'],
  weekly_study_target_hours: [0, 80, 'Enter a weekly target between 0 and 80 hours.'],
};

export default function StudyPreferencesForm({ preferences, onSave, saving }) {
  const [values, setValues] = useState(fromPreferences(preferences));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues(fromPreferences(preferences));
  }, [preferences]);

  const change = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    Object.entries(LIMITS).forEach(([field, [min, max, message]]) => {
      const value = Number(values[field]);
      if (Number.isNaN(value) || value < min || value > max) next[field] = message;
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    await onSave({
      focus_minutes: Number(values.focus_minutes),
      short_break_minutes: Number(values.short_break_minutes),
      long_break_minutes: Number(values.long_break_minutes),
      long_break_every: Number(values.long_break_every),
      weekly_study_target_hours: Number(values.weekly_study_target_hours),
      timer_sound: values.timer_sound,
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <FormField id="focus-minutes" label="Focus length (minutes)" required error={errors.focus_minutes}>
        <Input
          id="focus-minutes"
          type="number"
          min="1"
          max="180"
          inputMode="numeric"
          value={values.focus_minutes}
          onChange={(event) => change('focus_minutes', event.target.value)}
        />
      </FormField>

      <FormField id="short-break" label="Short break (minutes)" required error={errors.short_break_minutes}>
        <Input
          id="short-break"
          type="number"
          min="1"
          max="60"
          inputMode="numeric"
          value={values.short_break_minutes}
          onChange={(event) => change('short_break_minutes', event.target.value)}
        />
      </FormField>

      <FormField id="long-break" label="Long break (minutes)" required error={errors.long_break_minutes}>
        <Input
          id="long-break"
          type="number"
          min="1"
          max="120"
          inputMode="numeric"
          value={values.long_break_minutes}
          onChange={(event) => change('long_break_minutes', event.target.value)}
        />
      </FormField>

      <FormField
        id="long-break-every"
        label="Long break after"
        required
        error={errors.long_break_every}
        hint="Number of focus sessions before a long break."
      >
        <Input
          id="long-break-every"
          type="number"
          min="1"
          max="12"
          inputMode="numeric"
          value={values.long_break_every}
          onChange={(event) => change('long_break_every', event.target.value)}
        />
      </FormField>

      <FormField
        id="weekly-target"
        label="Weekly study target (hours)"
        error={errors.weekly_study_target_hours}
        hint="0 means no target. Your recorded time is always shown separately."
        className="sm:col-span-2"
      >
        <Input
          id="weekly-target"
          type="number"
          min="0"
          max="80"
          inputMode="numeric"
          value={values.weekly_study_target_hours}
          onChange={(event) => change('weekly_study_target_hours', event.target.value)}
        />
      </FormField>

      <div className="flex items-center gap-3 sm:col-span-2">
        <Switch
          id="timer-sound"
          checked={values.timer_sound}
          onCheckedChange={(checked) => change('timer_sound', checked)}
        />
        <Label htmlFor="timer-sound" className="text-sm font-medium">
          Play a sound when a session finishes
        </Label>
      </div>

      <div className="sm:col-span-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save preferences'}
        </Button>
      </div>
    </form>
  );
}