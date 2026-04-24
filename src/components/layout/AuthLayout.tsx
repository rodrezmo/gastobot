import { Navigate, Outlet } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore.ts';
import { ThemeProvider } from './ThemeProvider.tsx';

export function AuthLayout() {
  const { session, loading } = useAuthStore();

  if (!loading && session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <ThemeProvider>
      <div
        className="min-h-screen lg:grid lg:grid-cols-2"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        {/* Preview pane (desktop) */}
        <aside className="relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full opacity-40 blur-3xl"
            style={{ background: 'var(--grad-primary)' }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full opacity-20 blur-3xl"
            style={{ background: 'var(--grad-primary)' }}
          />

          <header className="relative">
            <span className="font-display text-grad-primary text-3xl leading-none">
              GastoBot
            </span>
            <p className="mt-3 max-w-sm text-sm text-white/50">
              Control de gastos personales. Simple, rápido, en tu bolsillo.
            </p>
          </header>

          <div className="relative space-y-4">
            <PreviewStat
              icon={Wallet}
              label="Balance del mes"
              value="$ 1.248.520"
              tone="white"
            />
            <div className="grid grid-cols-2 gap-3">
              <PreviewStat
                icon={TrendingUp}
                label="Ingresos"
                value="$ 2.100.000"
                tone="green"
              />
              <PreviewStat
                icon={TrendingDown}
                label="Gastos"
                value="$ 851.480"
                tone="red"
              />
            </div>
          </div>

          <p className="relative text-[11px] uppercase tracking-[0.3em] text-white/30">
            v2 · dark edition
          </p>
        </aside>

        {/* Form pane */}
        <main className="flex min-h-screen flex-col items-center justify-center px-6 py-10 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:hidden">
              <span className="font-display text-grad-primary text-3xl leading-none">
                GastoBot
              </span>
              <p className="mt-2 text-sm text-white/50">
                Control de gastos personales
              </p>
            </div>
            <div
              className="shadow-card rounded-[24px] border p-6 sm:p-8"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}

function PreviewStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone: 'white' | 'green' | 'red';
}) {
  const color =
    tone === 'green'
      ? 'var(--color-green)'
      : tone === 'red'
        ? 'var(--color-red)'
        : '#fff';
  return (
    <div
      className="rounded-[20px] border p-4"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-[12px]"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', color }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-white/40">
            {label}
          </p>
          <p
            className="font-display mt-0.5 text-lg"
            style={{ color: tone === 'white' ? '#fff' : color }}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
