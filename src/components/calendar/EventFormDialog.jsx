import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import FormField from '@/components/common/FormField';
import { EVENT_TYPES } from '@/lib/constants';
import { todayISO } from '@/lib/date';
import { createEvent, updateEvent } from '@/services/eventService';

const blank = (presetDate, presetCourseId) => ({
  title: '',
  description: '',
  course_id: presetCourseId || '',
  type: 'lecture',
  start_date: presetDate || todayISO(),
  start_time: '',
  end_date: '',
  end_time: '',
  all_day: false,
  location: '',
});

export default function EventFormDialog({
  open,
  onOpenChange,
  event,
  courses,
  presetDate,
  presetCourseId,
  profile,
  onSaved,
}) {
  const [values, setValues] = useState(blank(presetDate, presetCourseId));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(
      event
        ? {
            ...blank(),
            ...event,
            course_id: event.course_id || '',
            start_time: event.start_time || '',
            end_date: event.end_date || '',
            end_time: event.end_time || '',
          }
        : blank(presetDate, presetCourseId),
    );
    setErrors({});
    setFormError('');
    setSaving(false);
  }, [open, event, presetDate, presetCourseId]);

  const change = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async (submitEvent) => {
    submitEvent.preventDefault();
    const next = {};
    if (!values.title.trim()) next.title = 'Give this event a title.';
    if (!values.start_date) next.start_date = 'Pick the start date.';
    if (values.end_date && values.end_date < values.start_date) {
      next.end_date = 'The end date must come after the start date.';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setFormError('');
    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      course_id: values.course_id || null,
      type: values.type,
      start_date: values.start_date,
      start_time: values.all_day ? null : values.start_time || null,
      end_date: values.end_date || null,
      end_time: values.all_day ? null : values.end_time || null,
      all_day: values.all_day,
      location: values.location.trim(),
    };

    try {
      if (event) await updateEvent(event.id, payload);
      else await createEvent(profile.id, payload);
      onSaved?.(event ? 'Event updated' : 'Event added');
      onOpenChange(false);
    } catch (caught) {
      setFormError(caught?.message || 'We could not save this event.');
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">{event ? 'Edit event' : 'New event'}</DialogTitle>
          <DialogDescription>
            Lectures, tests, examinations and projects you want on your calendar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <FormField id="event-title" label="Title" required error={errors.title} className="sm:col-span-2">
            <Input
              id="event-title"
              value={values.title}
              placeholder="e.g. PHY102 practical"
              onChange={(e) => change('title', e.target.value)}
            />
          </FormField>

          <FormField id="event-type" label="Type">
            <Select value={values.type} onValueChange={(value) => change('type', value)}>
              <SelectTrigger id="event-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField id="event-course" label="Course">
            <Select
              value={values.course_id || 'none'}
              onValueChange={(value) => change('course_id', value === 'none' ? '' : value)}
            >
              <SelectTrigger id="event-course">
                <SelectValue placeholder="No course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No course</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} — {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="flex items-center gap-3 sm:col-span-2">
            <Switch id="event-all-day" checked={values.all_day} onCheckedChange={(checked) => change('all_day', checked)} />
            <Label htmlFor="event-all-day" className="text-sm font-medium">
              All day
            </Label>
          </div>

          <FormField id="event-start-date" label="Start date" required error={errors.start_date}>
            <Input
              id="event-start-date"
              type="date"
              value={values.start_date}
              onChange={(e) => change('start_date', e.target.value)}
            />
          </FormField>

          {!values.all_day && (
            <FormField id="event-start-time" label="Start time">
              <Input
                id="event-start-time"
                type="time"
                value={values.start_time}
                onChange={(e) => change('start_time', e.target.value)}
              />
            </FormField>
          )}

          <FormField id="event-end-date" label="End date (optional)" error={errors.end_date}>
            <Input
              id="event-end-date"
              type="date"
              value={values.end_date}
              onChange={(e) => change('end_date', e.target.value)}
            />
          </FormField>

          {!values.all_day && (
            <FormField id="event-end-time" label="End time (optional)">
              <Input
                id="event-end-time"
                type="time"
                value={values.end_time}
                onChange={(e) => change('end_time', e.target.value)}
              />
            </FormField>
          )}

          <FormField id="event-location" label="Location (optional)" className="sm:col-span-2">
            <Input
              id="event-location"
              value={values.location}
              placeholder="e.g. LT1, Faculty of Science"
              onChange={(e) => change('location', e.target.value)}
            />
          </FormField>

          <FormField id="event-description" label="Notes (optional)" className="sm:col-span-2">
            <Textarea
              id="event-description"
              rows={3}
              value={values.description}
              onChange={(e) => change('description', e.target.value)}
            />
          </FormField>

          {formError && (
            <p className="text-sm text-destructive sm:col-span-2" role="alert">
              {formError}
            </p>
          )}

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : event ? 'Save changes' : 'Add event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}