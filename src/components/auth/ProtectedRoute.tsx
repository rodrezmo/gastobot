import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore.ts';
import { Spinner } from '@/components/ui/Spinner.tsx';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
