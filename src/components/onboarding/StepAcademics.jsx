import FormField from '@/components/common/FormField';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LEVELS, SEMESTERS } from '@/lib/constants';

export default function StepAcademics({ values, errors, onChange, showTarget = true }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField id="academic_level" label="Academic level" required error={errors.academic_level}>
        <Select
          value={values.academic_level}
          onValueChange={(value) => onChange('academic_level', value)}
        >
          <SelectTrigger id="academic_level">
            <SelectValue placeholder="Select your level" />
          </SelectTrigger>
          <SelectContent>
            {LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField
        id="academic_session"
        label="Academic session"
        required
        error={errors.academic_session}
        hint="In your school's format, e.g. 2025/2026."
      >
        <Input
          id="academic_session"
          value={values.academic_session}
          placeholder="2025/2026"
          onChange={(event) => onChange('academic_session', event.target.value)}
        />
      </FormField>

      <FormField
        id="semester"
        label="Current semester"
        required
        error={errors.semester}
        className="sm:col-span-2"
      >
        <Select value={values.semester} onValueChange={(value) => onChange('semester', value)}>
          <SelectTrigger id="semester">
            <SelectValue placeholder="Select your semester" />
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

      <FormField
        id="semester_start"
        label="Semester starts (optional)"
        error={errors.semester_start}
        hint="Used to frame your calendar."
      >
        <Input
          id="semester_start"
          type="date"
          value={values.semester_start}
          onChange={(event) => onChange('semester_start', event.target.value)}
        />
      </FormField>

      <FormField
        id="semester_end"
        label="Semester ends (optional)"
        error={errors.semester_end}
      >
        <Input
          id="semester_end"
          type="date"
          value={values.semester_end}
          onChange={(event) => onChange('semester_end', event.target.value)}
        />
      </FormField>

      {showTarget && (
        <FormField
        id="weekly_target"
        label="Weekly study target (optional)"
        error={errors.weekly_target}
        hint="Hours you would like to study each week. Leave blank if unsure."
        className="sm:col-span-2"
      >
        <Input
          id="weekly_target"
          type="number"
          min="0"
          max="80"
          inputMode="numeric"
          value={values.weekly_target}
          placeholder="e.g. 10"
          onChange={(event) => onChange('weekly_target', event.target.value)}
        />
        </FormField>
      )}
    </div>
  );
}