import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore.ts';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute.tsx';
import { MainLayout } from '@/components/layout/MainLayout.tsx';
import { AuthLayout } from '@/components/layout/AuthLayout.tsx';
import { ThemeProvider } from '@/components/layout/ThemeProvider.tsx';
import { LoginPage } from '@/pages/LoginPage.tsx';
import { RegisterPage } from '@/pages/RegisterPage.tsx';
import { DashboardPage } from '@/pages/DashboardPage.tsx';
import { TransactionListPage } from '@/pages/TransactionListPage.tsx';
import { TransactionFormPage } from '@/pages/TransactionFormPage.tsx';
import { ReportsPage } from '@/pages/ReportsPage.tsx';
import { SettingsPage } from '@/pages/SettingsPage.tsx';
import { SharedPage } from '@/pages/SharedPage.tsx';
import { CreateGroupPage } from '@/pages/CreateGroupPage.tsx';
import { GroupDetailPage } from '@/pages/GroupDetailPage.tsx';

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
    <ThemeProvider>
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
            <Route path="/shared" element={<SharedPage />} />
            <Route path="/shared/groups/new" element={<CreateGroupPage />} />
            <Route path="/shared/groups/:id" element={<GroupDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
