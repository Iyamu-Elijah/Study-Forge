import { Search, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PRIORITIES, TASK_STATUSES, TASK_TYPES } from '@/lib/constants';

const SORTS = [
  { value: 'due_asc', label: 'Due soonest' },
  { value: 'due_desc', label: 'Due latest' },
  { value: 'recent', label: 'Recently added' },
];

export default function TaskFiltersBar({ filters, onChange, courses, onReset, resultLabel }) {
  const isFiltered =
    filters.search.trim() !== '' ||
    ['status', 'courseId', 'type', 'priority'].some((key) => filters[key] !== 'all');

  return (
    <Card>
      <CardContent className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <label htmlFor="task-search" className="sr-only">
            Search assignments
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="task-search"
            className="pl-9"
            placeholder="Search assignments"
            value={filters.search}
            onChange={(event) => onChange('search', event.target.value)}
          />
        </div>

        <Select value={filters.status} onValueChange={(value) => onChange('status', value)}>
          <SelectTrigger aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {TASK_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.courseId} onValueChange={(value) => onChange('courseId', value)}>
          <SelectTrigger aria-label="Filter by course">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.type} onValueChange={(value) => onChange('type', value)}>
          <SelectTrigger aria-label="Filter by type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TASK_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.priority} onValueChange={(value) => onChange('priority', value)}>
          <SelectTrigger aria-label="Filter by priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {PRIORITIES.map((priority) => (
              <SelectItem key={priority.value} value={priority.value}>
                {priority.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.sort} onValueChange={(value) => onChange('sort', value)}>
          <SelectTrigger aria-label="Sort assignments">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((sort) => (
              <SelectItem key={sort.value} value={sort.value}>
                {sort.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center justify-between gap-2 sm:col-span-2 lg:col-span-3">
          <p className="text-xs text-muted-foreground">{resultLabel}</p>
          {isFiltered && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              <X className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Clear filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}