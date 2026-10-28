export default function CourseChip({ course, fallback = 'No course', className = '' }) {
  if (!course) {
    return (
      <span
        className={`inline-flex items-center rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground ${className}`}
      >
        {fallback}
      </span>
    );
  }
  return (
    <span
      title={course.title}
      className={`inline-flex max-w-[10rem] items-center rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground ${className}`}
    >
      <span className="truncate">{course.code}</span>
    </span>
  );
}