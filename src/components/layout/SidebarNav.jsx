import { Link, NavLink } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  Settings,
  Timer,
} from 'lucide-react';
import { useProfile } from '@/lib/profile-context';
import { APP } from '@/config/env';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/assignments', label: 'Assignments', icon: ListChecks },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/study', label: 'Focus timer', icon: Timer },
  { to: '/notes', label: 'Notes', icon: NotebookPen },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function SidebarNav({ onNavigate }) {
  const { profile } = useProfile();
  const context = [
    profile?.academic_level && `${profile.academic_level} Level`,
    profile?.department,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <div className="flex items-center gap-2 px-1 pt-1">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
          SF
        </span>
        <span className="font-heading text-lg font-semibold tracking-tight">{APP.name}</span>
      </div>

      <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-1">
        {LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/60'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3">
        <p className="truncate text-sm font-medium">{profile?.full_name || 'Student'}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {context || profile?.university || 'Add your academic details'}
        </p>
        <Link
          to="/settings"
          onClick={onNavigate}
          className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
        >
          Edit profile
        </Link>
      </div>
    </div>
  );
}