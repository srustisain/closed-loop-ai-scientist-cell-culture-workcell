import { Link, NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'block px-3 py-2 rounded-md text-sm transition-colors',
    isActive
      ? 'bg-primary text-primary-foreground font-medium'
      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
  );

/** Default iteration when opening "Iteration View" from the sidebar (first known id). */
const DEFAULT_ITERATION_PATH = '/iterations/iter_001';

export function Sidebar() {
  const { pathname } = useLocation();
  const iterationNavActive = pathname.startsWith('/iterations/');

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-muted/40 flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-sm font-semibold tracking-tight">Cell Culture Optimizer</h1>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        <NavLink to="/" end className={navClass}>
          Dashboard
        </NavLink>
        <Link
          to={DEFAULT_ITERATION_PATH}
          className={cn(
            'block px-3 py-2 rounded-md text-sm transition-colors',
            iterationNavActive
              ? 'bg-primary text-primary-foreground font-medium'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          Iteration View
        </Link>
        <NavLink to="/history" end className={navClass}>
          History
        </NavLink>
        <NavLink to="/compare" end className={navClass}>
          Compare
        </NavLink>
      </nav>
    </aside>
  );
}
