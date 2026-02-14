import { Menu, Moon, Sun, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore.ts';
import { useUIStore } from '@/stores/uiStore.ts';

export function Navbar() {
  const { user, signOut } = useAuthStore();
  const { theme, toggleTheme, toggleSidebar } = useUIStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-primary-600">GastoBot</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">{user?.full_name ?? user?.email ?? ''}</span>
        </div>

        <button
          onClick={() => void signOut()}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          title="Cerrar sesion"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
