import { Link } from 'react-router-dom';
import { BookPlus, NotebookPen, PlusCircle, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ACTIONS = [
  { to: '/assignments?new=1', label: 'New task', icon: PlusCircle },
  { to: '/courses?new=1', label: 'Add course', icon: BookPlus },
  { to: '/notes?new=1', label: 'New note', icon: NotebookPen },
  { to: '/study', label: 'Focus session', icon: Timer },
];

export default function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map(({ to, label, icon: Icon }) => (
        <Button key={to} asChild variant="outline" size="sm">
          <Link to={to}>
            <Icon className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        </Button>
      ))}
    </div>
  );
}