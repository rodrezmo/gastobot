import { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { BalanceHero } from '@/components/dashboard/BalanceHero.tsx';
import { DonutChart } from '@/components/dashboard/DonutChart.tsx';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions.tsx';
import { Spinner } from '@/components/ui/Spinner.tsx';
import { useTransactionStore } from '@/stores/transactionStore.ts';
import { getReport } from '@/services/reportService.ts';
import type { ReportData } from '@/types/api.ts';

export function DashboardPage() {
  const { transactions, loading, fetchTransactions } = useTransactionStore();
  const [report, setReport] = useState<ReportData | null>(null);

  useEffect(() => {
    void fetchTransactions();

    const now = new Date();
    const from = format(startOfMonth(now), 'yyyy-MM-dd');
    const to = format(endOfMonth(now), 'yyyy-MM-dd');
    void getReport(from, to).then(setReport).catch(() => {});
  }, [fetchTransactions]);

  if (loading && transactions.length === 0) return <Spinner className="py-12" />;

  const monthLabel = format(new Date(), 'MMMM', { locale: es });

  const donutData =
    report?.by_category
      .filter((d) => d.category != null)
      .map((d) => ({
        name: d.category.name,
        value: d.total,
        color: d.category.color,
      })) ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-white">Panel</h1>
        <p className="mt-1 text-sm text-white/50">Tu resumen financiero</p>
      </div>

      <BalanceHero
        balance={report?.balance ?? 0}
        totalIncome={report?.total_income ?? 0}
        totalExpense={report?.total_expense ?? 0}
        subtitle={`Balance de ${monthLabel}`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentTransactions transactions={transactions} />
        <DonutChart
          title="Gastos por categoría"
          data={donutData}
          centerSubtitle="Gastos totales"
        />
      </div>
    </div>
  );
}
