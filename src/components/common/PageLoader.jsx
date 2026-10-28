export default function PageLoader({ label = 'Loading your workspace' }) {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary motion-reduce:animate-none" />
      <p>{label}</p>
    </div>
  );
}