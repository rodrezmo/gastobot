import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore.ts';

export function AuthLayout() {
  const { session, loading } = useAuthStore();

  if (!loading && session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary-600">GastoBot</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Control de gastos personales
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
