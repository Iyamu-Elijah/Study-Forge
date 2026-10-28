import FormField from '@/components/common/FormField';
import { Input } from '@/components/ui/input';
import { FACULTY_SUGGESTIONS, UNIVERSITY_SUGGESTIONS } from '@/lib/constants';

export default function StepProfile({ values, errors, onChange }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        id="full_name"
        label="Full name"
        required
        error={errors.full_name}
        className="sm:col-span-2"
      >
        <Input
          id="full_name"
          value={values.full_name}
          autoComplete="name"
          placeholder="e.g. Amaka Okafor"
          onChange={(event) => onChange('full_name', event.target.value)}
        />
      </FormField>

      <FormField
        id="university"
        label="University"
        required
        error={errors.university}
        hint="Suggestions are optional — type your own institution."
        className="sm:col-span-2"
      >
        <Input
          id="university"
          list="university-suggestions"
          value={values.university}
          placeholder="e.g. University of Lagos"
          onChange={(event) => onChange('university', event.target.value)}
        />
        <datalist id="university-suggestions">
          {UNIVERSITY_SUGGESTIONS.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </FormField>

      <FormField id="faculty" label="Faculty" error={errors.faculty}>
        <Input
          id="faculty"
          list="faculty-suggestions"
          value={values.faculty}
          placeholder="e.g. Faculty of Science"
          onChange={(event) => onChange('faculty', event.target.value)}
        />
        <datalist id="faculty-suggestions">
          {FACULTY_SUGGESTIONS.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </FormField>

      <FormField id="department" label="Department" error={errors.department}>
        <Input
          id="department"
          value={values.department}
          placeholder="e.g. Computer Science"
          onChange={(event) => onChange('department', event.target.value)}
        />
      </FormField>
    </div>
  );
}