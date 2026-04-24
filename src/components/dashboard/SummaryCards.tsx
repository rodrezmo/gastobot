import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency.ts';

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export function SummaryCards({ totalIncome, totalExpense, balance }: SummaryCardsProps) {
  const isPositive = balance >= 0;

  return (
    <div className="space-y-3">
      <div
        className={`overflow-hidden rounded-2xl p-6 text-white shadow-lg ${
          isPositive
            ? 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/20'
            : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/20'
        }`}
      >
        <p className="text-sm font-medium text-white/70">Balance del mes</p>
        <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          <span className="truncate block">
            {isPositive ? '+' : ''}{formatCurrency(balance)}
          </span>
        </p>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="rounded-lg bg-white/20 p-1.5">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-300">Ingresos</p>
              <p className="font-bold text-emerald-300">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <div className="rounded-lg bg-white/20 p-1.5">
              <TrendingDown className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-red-300">Gastos</p>
              <p className="font-bold text-red-300">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
