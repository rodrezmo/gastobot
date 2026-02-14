import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/Card.tsx';
import { formatCurrency } from '@/utils/formatCurrency.ts';

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export function SummaryCards({ totalIncome, totalExpense, balance }: SummaryCardsProps) {
  const cards = [
    {
      label: 'Ingresos',
      value: totalIncome,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Gastos',
      value: totalExpense,
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'Balance',
      value: balance,
      icon: Wallet,
      color: balance >= 0 ? 'text-primary-600' : 'text-red-600',
      bg: 'bg-primary-50 dark:bg-primary-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label} className="flex items-center gap-4">
          <div className={`rounded-lg p-3 ${bg}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{formatCurrency(value)}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
