import { useRef, useState } from 'react';
import { ArrowLeft, Bold, Code2, Eye, Heading2, Italic, List, Pencil, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import MarkdownView from './MarkdownView';

export default function NoteEditor({
  draft,
  dirty,
  saving,
  error,
  courses,
  onChange,
  onSave,
  onDelete,
  onBack,
}) {
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef(null);

  const wrapSelection = (before, after = before) => {
    const element = textareaRef.current;
    if (!element) return;
    const { selectionStart, selectionEnd, value } = element;
    const selected = value.slice(selectionStart, selectionEnd) || 'text';
    const next = `${value.slice(0, selectionStart)}${before}${selected}${after}${value.slice(selectionEnd)}`;
    onChange('content', next);
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(selectionStart + before.length, selectionStart + before.length + selected.length);
    });
  };

  const TOOLS = [
    { label: 'Bold', icon: Bold, action: () => wrapSelection('**') },
    { label: 'Italic', icon: Italic, action: () => wrapSelection('_') },
    { label: 'Heading', icon: Heading2, action: () => wrapSelection('\n## ', '') },
    { label: 'Bulleted list', icon: List, action: () => wrapSelection('\n- ', '') },
    { label: 'Code', icon: Code2, action: () => wrapSelection('`') },
  ];

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="md:hidden" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          All notes
        </Button>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="text-xs font-medium text-accent-foreground">Unsaved changes</span>
          )}
          <Button variant="ghost" size="icon" aria-label="Delete this note" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving || !dirty}>
            <Save className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <FormField id="note-title" label="Title" required>
        <Input
          id="note-title"
          value={draft.title}
          placeholder="e.g. Electromagnetism — key formulas"
          onChange={(event) => onChange('title', event.target.value)}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="note-course" label="Course">
          <Select
            value={draft.course_id || 'none'}
            onValueChange={(value) => onChange('course_id', value === 'none' ? '' : value)}
          >
            <SelectTrigger id="note-course">
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

        <FormField id="note-tags" label="Tags" hint="Separate tags with commas, e.g. formulas, revision">
          <Input
            id="note-tags"
            value={draft.tags}
            placeholder="formulas, revision"
            onChange={(event) => onChange('tags', event.target.value)}
          />
        </FormField>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {TOOLS.map(({ label, icon: Icon, action }) => (
              <Button
                key={label}
                type="button"
                variant="ghost"
                size="icon"
                aria-label={label}
                title={label}
                onClick={action}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setPreview((value) => !value)}>
            {preview ? (
              <>
                <Pencil className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Edit
              </>
            ) : (
              <>
                <Eye className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Preview
              </>
            )}
          </Button>
        </div>

        <div className="mt-2">
          {preview ? (
            <div className="min-h-[16rem] rounded-lg border border-border bg-background p-3">
              <MarkdownView content={draft.content} />
            </div>
          ) : (
            <>
              <label htmlFor="note-content" className="sr-only">
                Note content
              </label>
              <Textarea
                id="note-content"
                ref={textareaRef}
                rows={14}
                value={draft.content}
                placeholder="Write your note. Markdown works: **bold**, _italic_, ## heading, - list."
                onChange={(event) => onChange('content', event.target.value)}
              />
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}