import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Navbar } from './Navbar.tsx';
import { Sidebar } from './Sidebar.tsx';
import { useUIStore } from '@/stores/uiStore.ts';

export function MainLayout() {
  const theme = useUIStore((s) => s.theme);
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-center" theme={theme === 'dark' ? 'dark' : 'light'} richColors />
    </div>
  );
}
