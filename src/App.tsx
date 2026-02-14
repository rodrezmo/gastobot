import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore.ts';
import { useUIStore } from '@/stores/uiStore.ts';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute.tsx';
import { MainLayout } from '@/components/layout/MainLayout.tsx';
import { AuthLayout } from '@/components/layout/AuthLayout.tsx';
import { LoginPage } from '@/pages/LoginPage.tsx';
import { RegisterPage } from '@/pages/RegisterPage.tsx';
import { DashboardPage } from '@/pages/DashboardPage.tsx';
import { TransactionListPage } from '@/pages/TransactionListPage.tsx';
import { TransactionFormPage } from '@/pages/TransactionFormPage.tsx';
import { ReportsPage } from '@/pages/ReportsPage.tsx';
import { SettingsPage } from '@/pages/SettingsPage.tsx';

function App() {
  const { initialize } = useAuthStore();
  const { theme } = useUIStore();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionListPage />} />
          <Route path="/transactions/new" element={<TransactionFormPage />} />
          <Route path="/transactions/:id/edit" element={<TransactionFormPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
