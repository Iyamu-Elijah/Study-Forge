import { useEffect, useState } from 'react';
import StepProfile from '@/components/onboarding/StepProfile';
import StepAcademics from '@/components/onboarding/StepAcademics';
import { Button } from '@/components/ui/button';

const fromProfile = (profile) => ({
  full_name: profile?.full_name || '',
  university: profile?.university || '',
  faculty: profile?.faculty || '',
  department: profile?.department || '',
  academic_level: profile?.academic_level || '',
  academic_session: profile?.academic_session || '',
  semester: profile?.semester || '',
  semester_start: profile?.semester_start || '',
  semester_end: profile?.semester_end || '',
  weekly_target: '',
});

export default function AcademicProfileForm({ profile, onSave, saving }) {
  const [values, setValues] = useState(() => fromProfile(profile));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues(fromProfile(profile));
  }, [profile]);

  const change = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!values.full_name.trim()) next.full_name = 'Enter your full name.';
    if (!values.university.trim()) next.university = 'Enter your university.';
    if (!values.academic_level) next.academic_level = 'Select your academic level.';
    if (!values.academic_session.trim()) next.academic_session = 'Enter your academic session.';
    if (!values.semester) next.semester = 'Select your semester.';
    if (values.semester_start && values.semester_end && values.semester_end < values.semester_start) {
      next.semester_end = 'The end date must come after the start date.';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    await onSave({
      full_name: values.full_name.trim(),
      university: values.university.trim(),
      faculty: values.faculty.trim(),
      department: values.department.trim(),
      academic_level: values.academic_level,
      academic_session: values.academic_session.trim(),
      semester: values.semester,
      semester_start: values.semester_start || null,
      semester_end: values.semester_end || null,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <StepProfile values={values} errors={errors} onChange={change} />
      <StepAcademics values={values} errors={errors} onChange={change} showTarget={false} />
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save academic profile'}
      </Button>
    </form>
  );
}