import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import FormField from '@/components/common/FormField';

export default function SessionRecordDialog({ pending, courses, saving, onSave, onOpenChange }) {
  const [minutes, setMinutes] = useState(25);
  const [courseId, setCourseId] = useState('');

  useEffect(() => {
    if (!pending) return;
    setMinutes(Math.max(1, pending.elapsedMinutes || 25));
    setCourseId(pending.courseId || '');
  }, [pending]);

  const valid = Number(minutes) > 0 && Number(minutes) <= 600;

  return (
    <Dialog open={Boolean(pending)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">Record this focus session?</DialogTitle>
          <DialogDescription>
            {pending?.restored
              ? 'The countdown finished while the app was closed. Confirm what you actually studied — nothing is saved until you do.'
              : 'Confirm the time you actually studied so your study totals stay honest.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <FormField
            id="session-minutes"
            label="Minutes studied"
            required
            error={valid ? undefined : 'Enter a whole number of minutes (1–600).'}
          >
            <Input
              id="session-minutes"
              type="number"
              min="1"
              max="600"
              inputMode="numeric"
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
            />
          </FormField>

          <FormField id="session-course" label="Course (optional)">
            <Select
              value={courseId || 'none'}
              onValueChange={(value) => setCourseId(value === 'none' ? '' : value)}
            >
              <SelectTrigger id="session-course">
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
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Discard
          </Button>
          <Button
            onClick={() => onSave({ minutes: Number(minutes), courseId })}
            disabled={saving || !valid}
          >
            {saving ? 'Saving…' : 'Save session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}