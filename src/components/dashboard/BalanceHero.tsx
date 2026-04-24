import { formatCurrency } from '@/utils/formatCurrency.ts';

interface BalanceHeroProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  /** Subtítulo contextual. Ej: "Balance de marzo" */
  subtitle?: string;
  currency?: string;
}

export function BalanceHero({
  balance,
  totalIncome,
  totalExpense,
  subtitle = 'Balance del mes',
  currency = 'ARS',
}: BalanceHeroProps) {
  const savingsRate =
    totalIncome > 0
      ? Math.max(0, Math.min(100, ((totalIncome - totalExpense) / totalIncome) * 100))
      : 0;

  return (
    <section
      className="shadow-card relative overflow-hidden rounded-[24px] border p-6 sm:p-8"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Glow decorativo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30 blur-3xl"
        style={{ background: 'var(--grad-primary)' }}
      />

      <div className="relative">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">
          {subtitle}
        </p>
        <p className="font-display mt-2 text-4xl text-white sm:text-5xl">
          {formatCurrency(balance, currency)}
        </p>
      </div>

      <div className="relative mt-6 grid grid-cols-3 gap-3 border-t border-white/5 pt-5">
        <Stat
          label="Ingresos"
          value={formatCurrency(totalIncome, currency)}
          color="var(--color-green)"
        />
        <Stat
          label="Gastos"
          value={formatCurrency(totalExpense, currency)}
          color="var(--color-red)"
        />
        <Stat
          label="Tasa ahorro"
          value={`${savingsRate.toFixed(0)}%`}
          color="var(--color-amber)"
        />
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-white/40">{label}</p>
      <p
        className="mt-1 text-sm font-semibold tabular-nums sm:text-base"
        style={{ color }}
      >
        {value}
      </p>
    </div>
  );
}
