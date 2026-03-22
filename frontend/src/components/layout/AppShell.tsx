import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { SiteMainHeader } from './SiteMainHeader';

export function AppShell() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <SiteMainHeader />
        <Outlet />
      </main>
    </div>
  );
}
