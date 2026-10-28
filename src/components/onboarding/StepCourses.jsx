import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function StepCourses({ courses, errors, onChange, onAdd, onRemove }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add the courses you are registered for this semester. You can skip this and add them
        later from the Courses page.
      </p>

      <ul className="space-y-3">
        {courses.map((course, index) => (
          <li key={index} className="rounded-xl border border-border bg-card p-3">
            <div className="grid gap-3 sm:grid-cols-[8rem_1fr_6rem_auto]">
              <div>
                <Label htmlFor={`course-code-${index}`} className="text-xs font-medium">
                  Course code
                </Label>
                <Input
                  id={`course-code-${index}`}
                  className="mt-1"
                  value={course.code}
                  placeholder="MTH101"
                  onChange={(event) => onChange(index, 'code', event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`course-title-${index}`} className="text-xs font-medium">
                  Course title
                </Label>
                <Input
                  id={`course-title-${index}`}
                  className="mt-1"
                  value={course.title}
                  placeholder="Elementary Mathematics I"
                  onChange={(event) => onChange(index, 'title', event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`course-units-${index}`} className="text-xs font-medium">
                  Units
                </Label>
                <Input
                  id={`course-units-${index}`}
                  className="mt-1"
                  type="number"
                  min="0"
                  max="12"
                  inputMode="numeric"
                  value={course.credit_units}
                  placeholder="3"
                  onChange={(event) => onChange(index, 'credit_units', event.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove course ${index + 1}`}
                  disabled={courses.length === 1}
                  onClick={() => onRemove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {errors.courses && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {errors.courses}
        </p>
      )}

      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
        Add another course
      </Button>
    </div>
  );
}