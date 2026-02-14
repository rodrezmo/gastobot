import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.tsx';
import { Sidebar } from './Sidebar.tsx';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
