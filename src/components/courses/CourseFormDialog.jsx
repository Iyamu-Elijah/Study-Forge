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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import FormField from '@/components/common/FormField';
import { SEMESTERS } from '@/lib/constants';
import { createCourse, findDuplicateCode, updateCourse } from '@/services/courseService';

const blank = (profile) => ({
  title: '',
  code: '',
  description: '',
  credit_units: '',
  academic_session: profile?.academic_session || '',
  semester: profile?.semester || '',
  instructor: '',
  timetable: '',
});

export default function CourseFormDialog({ open, onOpenChange, course, profile, onSaved }) {
  const [values, setValues] = useState(blank(profile));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(
      course
        ? { ...blank(profile), ...course, credit_units: course.credit_units ?? '' }
        : blank(profile),
    );
    setErrors({});
    setFormError('');
    setSaving(false);
  }, [open, course, profile]);

  const change = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!values.title.trim()) next.title = 'Enter the course title.';
    if (!values.code.trim()) next.code = 'Enter the course code, for example MTH101.';
    if (values.credit_units !== '') {
      const units = Number(values.credit_units);
      if (Number.isNaN(units) || units < 0 || units > 12) {
        next.credit_units = 'Credit units must be a number between 0 and 12.';
      }
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setFormError('');
    try {
      const duplicate = await findDuplicateCode(
        profile.id,
        values.code,
        values.academic_session.trim(),
        values.semester,
      );
      if (duplicate && duplicate.id !== course?.id) {
        setErrors({
          code: `${duplicate.code} is already in ${values.semester || 'this semester'}${
            values.academic_session ? ` ${values.academic_session}` : ''
          }. Change the code, or edit the existing course.`,
        });
        setSaving(false);
        return;
      }

      const payload = {
        title: values.title.trim(),
        code: values.code,
        description: values.description.trim(),
        academic_session: values.academic_session.trim(),
        semester: values.semester,
        credit_units: values.credit_units === '' ? null : Number(values.credit_units),
        instructor: values.instructor.trim(),
        timetable: values.timetable.trim(),
      };

      if (course) await updateCourse(course.id, payload);
      else await createCourse(profile.id, payload);

      onSaved?.(course ? 'Course updated' : 'Course added');
      onOpenChange(false);
    } catch (error) {
      setFormError(error?.message || 'We could not save this course.');
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {course ? 'Edit course' : 'Add a course'}
          </DialogTitle>
          <DialogDescription>
            Course codes are unique within a semester, so the same code can repeat in another
            session.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <FormField id="course-title" label="Course title" required error={errors.title} className="sm:col-span-2">
            <Input
              id="course-title"
              value={values.title}
              placeholder="e.g. Elementary Mathematics I"
              onChange={(event) => change('title', event.target.value)}
            />
          </FormField>

          <FormField id="course-code" label="Course code" required error={errors.code}>
            <Input
              id="course-code"
              value={values.code}
              placeholder="MTH101"
              onChange={(event) => change('code', event.target.value)}
            />
          </FormField>

          <FormField id="course-units" label="Credit units" error={errors.credit_units}>
            <Input
              id="course-units"
              type="number"
              min="0"
              max="12"
              inputMode="numeric"
              value={values.credit_units}
              placeholder="3"
              onChange={(event) => change('credit_units', event.target.value)}
            />
          </FormField>

          <FormField id="course-session" label="Academic session">
            <Input
              id="course-session"
              value={values.academic_session}
              placeholder="2025/2026"
              onChange={(event) => change('academic_session', event.target.value)}
            />
          </FormField>

          <FormField id="course-semester" label="Semester">
            <Select value={values.semester} onValueChange={(value) => change('semester', value)}>
              <SelectTrigger id="course-semester">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {SEMESTERS.map((semester) => (
                  <SelectItem key={semester} value={semester}>
                    {semester}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField id="course-instructor" label="Lecturer (optional)">
            <Input
              id="course-instructor"
              value={values.instructor}
              placeholder="e.g. Dr A. Bello"
              onChange={(event) => change('instructor', event.target.value)}
            />
          </FormField>

          <FormField
            id="course-timetable"
            label="Timetable (optional)"
            hint="For example: Mon 8–10am, LT1"
          >
            <Input
              id="course-timetable"
              value={values.timetable}
              placeholder="Mon 8–10am, LT1"
              onChange={(event) => change('timetable', event.target.value)}
            />
          </FormField>

          <FormField id="course-description" label="Description (optional)" className="sm:col-span-2">
            <Textarea
              id="course-description"
              rows={3}
              value={values.description}
              placeholder="Topics, assessment structure, anything useful."
              onChange={(event) => change('description', event.target.value)}
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
              {saving ? 'Saving…' : course ? 'Save changes' : 'Add course'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}