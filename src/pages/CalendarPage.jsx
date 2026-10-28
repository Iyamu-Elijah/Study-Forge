import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addMonths, addWeeks, subMonths, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import MonthView from '@/components/calendar/MonthView';
import WeekView from '@/components/calendar/WeekView';
import EventFormDialog from '@/components/calendar/EventFormDialog';
import EventDetailsDialog from '@/components/calendar/EventDetailsDialog';
import CalendarDayDialog from '@/components/calendar/CalendarDayDialog';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import useAsyncData from '@/hooks/useAsyncData';
import { useProfile } from '@/lib/profile-context';
import { listCourses } from '@/services/courseService';
import { deleteEvent, listEvents } from '@/services/eventService';
import { listTasks } from '@/services/taskService';
import { formatMonthLabel, monthGridISO, weekDaysISO } from '@/lib/date';
import { groupByDate, toCalendarItems } from '@/components/calendar/calendarItems';

export default function CalendarPage() {
  const { profile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [view, setView] = useState('month');
  const [anchor, setAnchor] = useState(() => new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dayISO, setDayISO] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [presetDate, setPresetDate] = useState('');
  const [presetCourseId, setPresetCourseId] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const range = useMemo(() => {
    if (view === 'week') {
      const days = weekDaysISO(anchor);
      return { from: days[0], to: days[6] };
    }
    const days = monthGridISO(anchor);
    return { from: days[0], to: days[days.length - 1] };
  }, [view, anchor]);

  const coursesData = useAsyncData(
    () => listCourses(profile.id, { includeArchived: true, limit: 60 }),
    [profile.id],
  );
  const courses = coursesData.data?.items ?? [];
  const coursesById = useMemo(
    () => courses.reduce((acc, course) => ({ ...acc, [course.id]: course }), {}),
    [courses],
  );

  const calendar = useAsyncData(async () => {
    const [tasks, events] = await Promise.all([
      listTasks(profile.id, { from: range.from, to: range.to }, { sort: 'due_asc', limit: 200 }),
      listEvents(profile.id, { from: range.from, to: range.to, limit: 200 }),
    ]);
    return { tasks: tasks.items ?? [], events: events.items ?? [] };
  }, [profile.id, range.from, range.to]);

  const items = useMemo(
    () => toCalendarItems(calendar.data?.tasks ?? [], calendar.data?.events ?? []),
    [calendar.data],
  );
  const itemsByDate = useMemo(() => groupByDate(items), [items]);

  useEffect(() => {
    const courseParam = searchParams.get('course') || '';
    if (searchParams.get('new')) {
      setEditingEvent(null);
      setPresetDate('');
      setPresetCourseId(courseParam);
      setFormOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const refresh = () => calendar.reload();

  const handleSelectItem = (item) => {
    if (item.kind === 'event') setSelectedEvent(item.raw);
    else navigate(`/assignments?task=${item.id}`);
  };

  const openCreate = (dateISO) => {
    setEditingEvent(null);
    setPresetDate(dateISO || '');
    setPresetCourseId('');
    setDayISO(null);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteEvent(pendingDelete.id);
      toast({ title: 'Event deleted', description: pendingDelete.title });
      setPendingDelete(null);
      setSelectedEvent(null);
      refresh();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Could not delete that event', description: error?.message });
    } finally {
      setDeleting(false);
    }
  };

  const step = (direction) => {
    setAnchor((current) =>
      view === 'week'
        ? direction > 0
          ? addWeeks(current, 1)
          : subWeeks(current, 1)
        : direction > 0
          ? addMonths(current, 1)
          : subMonths(current, 1),
    );
  };

  const label =
    view === 'week'
      ? `${range.from} → ${range.to}`
      : formatMonthLabel(anchor);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic calendar"
        description="Lectures, tests, examinations and every deadline, month by month."
        actions={
          <Button onClick={() => openCreate('')}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            New event
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={view}
          onValueChange={(value) => {
            setView(value);
            setAnchor(new Date());
          }}
        >
          <TabsList>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Previous" onClick={() => step(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAnchor(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" aria-label="Next" onClick={() => step(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="font-heading text-lg font-semibold" aria-live="polite">
        {label}
      </p>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="text-primary">
            ◆
          </span>
          Deadline (assignment, test, exam)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="text-accent-foreground">
            ●
          </span>
          Event (lecture, test, exam, project)
        </span>
      </div>

      {calendar.loading && <LoadingState rows={4} />}
      {calendar.error && <ErrorState message={calendar.error} onRetry={refresh} />}

      {!calendar.loading && !calendar.error && (
        <>
          {view === 'month' ? (
            <MonthView
              anchor={anchor}
              itemsByDate={itemsByDate}
              coursesById={coursesById}
              onSelectItem={handleSelectItem}
              onSelectDay={setDayISO}
              onAddOn={openCreate}
            />
          ) : (
            <WeekView
              anchor={anchor}
              itemsByDate={itemsByDate}
              coursesById={coursesById}
              onSelectItem={handleSelectItem}
              onAddOn={openCreate}
            />
          )}

          {items.length === 0 && (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                Nothing on the calendar for this period. Add a lecture, test or project — deadlines
                from your assignments appear here automatically.
              </CardContent>
            </Card>
          )}
        </>
      )}

      <EventDetailsDialog
        event={selectedEvent}
        course={selectedEvent?.course_id ? coursesById[selectedEvent.course_id] : null}
        open={Boolean(selectedEvent)}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
        onEdit={(event) => {
          setSelectedEvent(null);
          setEditingEvent(event);
          setPresetDate('');
          setFormOpen(true);
        }}
        onDelete={(event) => setPendingDelete(event)}
      />

      <CalendarDayDialog
        dateISO={dayISO}
        items={dayISO ? itemsByDate[dayISO] ?? [] : []}
        coursesById={coursesById}
        open={Boolean(dayISO)}
        onOpenChange={(open) => !open && setDayISO(null)}
        onSelectItem={handleSelectItem}
        onAddOn={openCreate}
      />

      <EventFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        event={editingEvent}
        courses={courses}
        presetDate={presetDate}
        presetCourseId={presetCourseId}
        profile={profile}
        onSaved={(message) => {
          toast({ title: message });
          refresh();
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this event?"
        description={pendingDelete ? `“${pendingDelete.title}” will be removed from your calendar.` : ''}
        confirmLabel="Delete event"
        pending={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}