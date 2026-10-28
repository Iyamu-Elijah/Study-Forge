import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import NotesList from '@/components/notes/NotesList';
import NoteEditor from '@/components/notes/NoteEditor';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import LoadingState from '@/components/common/LoadingState';
import EmptyState from '@/components/common/EmptyState';
import { NotebookPen } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import useAsyncData from '@/hooks/useAsyncData';
import { useProfile } from '@/lib/profile-context';
import { listCourses } from '@/services/courseService';
import { createNote, deleteNote, getNote, listNotes, updateNote } from '@/services/noteService';

const PAGE_SIZE = 50;
const EMPTY_FILTERS = { search: '', courseId: 'all', tag: '' };

export default function Notes() {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listError, setListError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const coursesData = useAsyncData(
    () => listCourses(profile.id, { includeArchived: true, limit: 60 }),
    [profile.id],
  );
  const courses = coursesData.data?.items ?? [];
  const coursesById = useMemo(
    () => courses.reduce((acc, course) => ({ ...acc, [course.id]: course }), {}),
    [courses],
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search.trim()), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const query = useMemo(
    () => ({
      search: debouncedSearch,
      courseId: filters.courseId === 'all' ? '' : filters.courseId,
      tag: filters.tag,
    }),
    [debouncedSearch, filters.courseId, filters.tag],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setListError(null);
    listNotes(profile.id, { ...query, limit: PAGE_SIZE })
      .then((page) => {
        if (cancelled) return;
        setItems(page.items ?? []);
        setCursor(page.next_cursor ?? null);
        setHasMore(Boolean(page.has_more));
        setLoading(false);
      })
      .catch((caught) => {
        if (cancelled) return;
        setItems([]);
        setListError(caught?.message || 'We could not load your notes.');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile.id, query, reloadKey]);

  const reloadList = useCallback(() => setReloadKey((value) => value + 1), []);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await listNotes(profile.id, { ...query, limit: PAGE_SIZE, cursor });
      setItems((prev) => [...prev, ...(page.items ?? [])]);
      setCursor(page.next_cursor ?? null);
      setHasMore(Boolean(page.has_more));
    } catch (caught) {
      toast({ variant: 'destructive', title: 'Could not load more notes', description: caught?.message });
    } finally {
      setLoadingMore(false);
    }
  };

  const startNew = (courseId = '') => {
    setDraft({ id: null, title: '', content: '', course_id: courseId, tags: '' });
    setDirty(false);
    setSaveError('');
  };

  const loadNote = async (noteId) => {
    try {
      const note = await getNote(noteId);
      if (!note) {
        toast({ variant: 'destructive', title: 'That note could not be found' });
        return;
      }
      setDraft({
        id: note.id,
        title: note.title || '',
        content: note.content || '',
        course_id: note.course_id || '',
        tags: (note.tags ?? []).join(', '),
      });
      setDirty(false);
      setSaveError('');
    } catch (caught) {
      toast({ variant: 'destructive', title: 'Could not open that note', description: caught?.message });
    }
  };

  const runPendingAction = () => {
    const action = pendingAction;
    setPendingAction(null);
    if (!action) return;
    if (action.type === 'new') startNew(action.courseId);
    else if (action.type === 'open') loadNote(action.id);
  };

  const requestOpen = (noteId) => {
    if (draft?.id === noteId) return;
    if (dirty) setPendingAction({ type: 'open', id: noteId });
    else loadNote(noteId);
  };

  const requestNew = (courseId = '') => {
    if (dirty) setPendingAction({ type: 'new', courseId });
    else startNew(courseId);
  };

  useEffect(() => {
    const noteParam = searchParams.get('note');
    const courseParam = searchParams.get('course') || '';
    if (noteParam) {
      loadNote(noteParam);
      setSearchParams({}, { replace: true });
    } else if (searchParams.get('new')) {
      startNew(courseParam);
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const change = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    setSaveError('');
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      setSaveError('Give this note a title before saving.');
      return;
    }
    setSaving(true);
    setSaveError('');
    const payload = {
      title: draft.title.trim(),
      content: draft.content,
      course_id: draft.course_id || null,
      tags: draft.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      if (draft.id) {
        await updateNote(draft.id, payload);
      } else {
        const created = await createNote(profile.id, payload);
        setDraft((prev) => ({ ...prev, id: created.id }));
      }
      setDirty(false);
      toast({ title: 'Note saved' });
      reloadList();
    } catch (caught) {
      setSaveError(caught?.message || 'We could not save this note.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!draft?.id) {
      setPendingDelete(false);
      setDraft(null);
      setDirty(false);
      return;
    }
    setDeleting(true);
    try {
      await deleteNote(draft.id);
      toast({ title: 'Note deleted' });
      setDraft(null);
      setDirty(false);
      setPendingDelete(false);
      reloadList();
    } catch (caught) {
      toast({ variant: 'destructive', title: 'Could not delete that note', description: caught?.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes"
        description="Searchable notes you can link to a course and tag for revision."
      />

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <div className={draft ? 'hidden lg:block' : ''}>
          <NotesList
            notes={items}
            activeId={draft?.id ?? null}
            courses={courses}
            coursesById={coursesById}
            filters={filters}
            loading={loading}
            error={listError}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onFilterChange={(field, value) =>
              setFilters((prev) => ({ ...prev, [field]: value }))
            }
            onSelect={requestOpen}
            onTagClick={(tag) => setFilters((prev) => ({ ...prev, tag }))}
            onLoadMore={loadMore}
            onNew={() => requestNew('')}
          />
        </div>

        <div className={draft ? '' : 'hidden lg:block'}>
          {draft ? (
            <NoteEditor
              draft={draft}
              dirty={dirty}
              saving={saving}
              error={saveError}
              courses={courses}
              onChange={change}
              onSave={save}
              onDelete={() => setPendingDelete(true)}
              onBack={() => setDraft(null)}
            />
          ) : loading ? (
            <LoadingState rows={5} />
          ) : (
            <EmptyState
              icon={NotebookPen}
              title="Select a note to read or edit"
              description="Choose a note from the list, or start a new one. You can link each note to a course and add tags."
              action={null}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title="Discard unsaved changes?"
        description="This note has edits that are not saved yet. Opening another note will lose them."
        confirmLabel="Discard and continue"
        cancelLabel="Keep editing"
        onConfirm={runPendingAction}
      />

      <ConfirmDialog
        open={pendingDelete}
        onOpenChange={setPendingDelete}
        title="Delete this note?"
        description="This note will be permanently removed from your notes."
        confirmLabel="Delete note"
        pending={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}