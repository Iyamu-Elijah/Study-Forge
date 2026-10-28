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
import { PRIORITIES, TASK_STATUSES, TASK_TYPES } from '@/lib/constants';
import { todayISO } from '@/lib/date';
import { createTask, updateTask } from '@/services/taskService';

const blank = (presetCourseId) => ({
  title: '',
  description: '',
  course_id: presetCourseId || '',
  type: 'assignment',
  due_date: todayISO(),
  due_time: '',
  priority: 'medium',
  status: 'not_started',
  estimated_minutes: '',
});

export default function TaskFormDialog({
  open,
  onOpenChange,
  task,
  courses,
  presetCourseId,
  profile,
  onSaved,
}) {
  const [values, setValues] = useState(blank(presetCourseId));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(
      task
        ? {
            ...blank(),
            ...task,
            course_id: task.course_id || '',
            due_time: task.due_time || '',
            estimated_minutes: task.estimated_minutes ?? '',
          }
        : blank(presetCourseId),
    );
    setErrors({});
    setFormError('');
    setSaving(false);
  }, [open, task, presetCourseId]);

  const change = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!values.title.trim()) next.title = 'Give this task a title.';
    if (!values.due_date) next.due_date = 'Pick the due date.';
    if (values.estimated_minutes !== '') {
      const estimate = Number(values.estimated_minutes);
      if (Number.isNaN(estimate) || estimate < 0 || estimate > 1440) {
        next.estimated_minutes = 'Estimated minutes must be between 0 and 1440.';
      }
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
      due_date: values.due_date,
      due_time: values.due_time || null,
      priority: values.priority,
      status: values.status,
      estimated_minutes: values.estimated_minutes === '' ? null : Number(values.estimated_minutes),
    };

    try {
      if (task) await updateTask(task.id, payload);
      else await createTask(profile.id, payload);
      onSaved?.(task ? 'Task updated' : 'Task added');
      onOpenChange(false);
    } catch (error) {
      setFormError(error?.message || 'We could not save this task.');
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {task ? 'Edit task' : 'New assignment or exam'}
          </DialogTitle>
          <DialogDescription>
            Dates are saved exactly as you type them, so a deadline never shifts time zones.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <FormField id="task-title" label="Title" required error={errors.title} className="sm:col-span-2">
            <Input
              id="task-title"
              value={values.title}
              placeholder="e.g. MTH101 assignment 2"
              onChange={(event) => change('title', event.target.value)}
            />
          </FormField>

          <FormField id="task-course" label="Course">
            <Select value={values.course_id || 'none'} onValueChange={(value) => change('course_id', value === 'none' ? '' : value)}>
              <SelectTrigger id="task-course">
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

          <FormField id="task-type" label="Type">
            <Select value={values.type} onValueChange={(value) => change('type', value)}>
              <SelectTrigger id="task-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField id="task-due-date" label="Due date" required error={errors.due_date}>
            <Input
              id="task-due-date"
              type="date"
              value={values.due_date}
              onChange={(event) => change('due_date', event.target.value)}
            />
          </FormField>

          <FormField id="task-due-time" label="Due time (optional)">
            <Input
              id="task-due-time"
              type="time"
              value={values.due_time}
              onChange={(event) => change('due_time', event.target.value)}
            />
          </FormField>

          <FormField id="task-priority" label="Priority">
            <Select value={values.priority} onValueChange={(value) => change('priority', value)}>
              <SelectTrigger id="task-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField id="task-status" label="Status">
            <Select value={values.status} onValueChange={(value) => change('status', value)}>
              <SelectTrigger id="task-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            id="task-estimate"
            label="Estimated minutes (optional)"
            error={errors.estimated_minutes}
            className="sm:col-span-2"
          >
            <Input
              id="task-estimate"
              type="number"
              min="0"
              max="1440"
              inputMode="numeric"
              value={values.estimated_minutes}
              placeholder="e.g. 90"
              onChange={(event) => change('estimated_minutes', event.target.value)}
            />
          </FormField>

          <FormField id="task-description" label="Description (optional)" className="sm:col-span-2">
            <Textarea
              id="task-description"
              rows={3}
              value={values.description}
              placeholder="What exactly is required?"
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
              {saving ? 'Saving…' : task ? 'Save changes' : 'Add task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}