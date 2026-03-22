import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/iterations/iter_001', label: 'Iteration View' },
  { to: '/history', label: 'History' },
  { to: '/compare', label: 'Compare' },
];

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-muted/40 flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-sm font-semibold tracking-tight">Cell Culture Optimizer</h1>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
