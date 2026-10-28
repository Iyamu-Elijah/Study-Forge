import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StepIndicator from '@/components/onboarding/StepIndicator';
import StepProfile from '@/components/onboarding/StepProfile';
import StepAcademics from '@/components/onboarding/StepAcademics';
import StepCourses from '@/components/onboarding/StepCourses';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { createProfile, getProfileId } from '@/services/profileService';
import { updatePreferences } from '@/services/preferencesService';
import { createCourses } from '@/services/courseService';
import { useAppTheme } from '@/lib/theme';
import { APP } from '@/config/env';

const STEPS = ['About you', 'Your semester', 'Your courses'];

const EMPTY = {
  full_name: '',
  university: '',
  faculty: '',
  department: '',
  academic_level: '',
  academic_session: '',
  semester: '',
  semester_start: '',
  semester_end: '',
  weekly_target: '',
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { theme } = useAppTheme();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(EMPTY);
  const [courses, setCourses] = useState([{ code: '', title: '', credit_units: '' }]);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getProfileId()) navigate('/dashboard', { replace: true });
  }, [navigate]);

  const change = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const changeCourse = (index, field, value) => {
    setCourses((prev) =>
      prev.map((course, position) => (position === index ? { ...course, [field]: value } : course)),
    );
    setErrors((prev) => ({ ...prev, courses: undefined }));
  };

  const addCourse = () =>
    setCourses((prev) => [...prev, { code: '', title: '', credit_units: '' }]);

  const removeCourse = (index) =>
    setCourses((prev) => prev.filter((_, position) => position !== index));

  const validate = () => {
    const next = {};
    if (!values.full_name.trim()) next.full_name = 'Enter your full name.';
    if (!values.university.trim()) next.university = 'Enter your university.';
    if (!values.academic_level) next.academic_level = 'Select your academic level.';
    if (!values.academic_session.trim()) next.academic_session = 'Enter your academic session.';
    if (!values.semester) next.semester = 'Select your current semester.';
    if (values.semester_start && values.semester_end && values.semester_end < values.semester_start) {
      next.semester_end = 'The end date must come after the start date.';
    }
    if (values.weekly_target && Number(values.weekly_target) < 0) {
      next.weekly_target = 'Enter a number of hours.';
    }
    const partialCourse = courses.some(
      (course) => (course.code.trim() && !course.title.trim()) || (!course.code.trim() && course.title.trim()),
    );
    if (partialCourse) next.courses = 'Each course needs both a code and a title.';
    setErrors(next);
    return next;
  };

  const goNext = () => {
    const nextErrors = validate();
    const blocking = step === 0
      ? ['full_name', 'university']
      : step === 1
        ? ['academic_level', 'academic_session', 'semester', 'semester_end', 'weekly_target']
        : ['courses'];
    if (blocking.some((key) => nextErrors[key])) return;
    setStep((value) => value + 1);
  };

  const finish = async () => {
    const nextErrors = validate();
    if (['full_name', 'university', 'academic_level', 'academic_session', 'semester', 'courses'].some((key) => nextErrors[key])) {
      setErrors(nextErrors);
      setStep(nextErrors.courses ? 2 : 0);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const profile = await createProfile({
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

      await updatePreferences(profile.id, {
        theme,
        weekly_study_target_hours: Number(values.weekly_target) || 0,
      });

      const complete = courses
        .filter((course) => course.code.trim() && course.title.trim())
        .map((course) => ({
          code: course.code,
          title: course.title,
          credit_units: course.credit_units ? Number(course.credit_units) : undefined,
          academic_session: values.academic_session.trim(),
          semester: values.semester,
        }));
      if (complete.length) await createCourses(profile.id, complete);

      navigate('/dashboard', { replace: true });
    } catch (error) {
      setSubmitError(error?.message || 'We could not save your profile. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link to="/" className="font-heading text-lg font-semibold tracking-tight">
          {APP.name}
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </p>
        <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {step === 0
            ? 'Let’s set up your academic profile'
            : step === 1
              ? 'Which semester are you in?'
              : 'Add the courses you are taking'}
        </h1>

        <div className="mt-5">
          <StepIndicator steps={STEPS} current={step} />
        </div>

        <Card className="mt-6">
          <CardContent className="p-4 sm:p-6">
            {step === 0 && <StepProfile values={values} errors={errors} onChange={change} />}
            {step === 1 && <StepAcademics values={values} errors={errors} onChange={change} />}
            {step === 2 && (
              <StepCourses
                courses={courses}
                errors={errors}
                onChange={changeCourse}
                onAdd={addCourse}
                onRemove={removeCourse}
              />
            )}
          </CardContent>
        </Card>

        {submitError && (
          <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
            {submitError}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <div>
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep((value) => value - 1)} disabled={submitting}>
                Back
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {step === STEPS.length - 1 && (
              <Button variant="outline" onClick={finish} disabled={submitting}>
                Skip and finish
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={goNext}>Continue</Button>
            ) : (
              <Button onClick={finish} disabled={submitting}>
                {submitting ? 'Setting up…' : 'Finish setup'}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}