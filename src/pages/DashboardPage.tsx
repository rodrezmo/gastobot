import { useEffect, useState } from 'react';
import { SummaryCards } from '@/components/dashboard/SummaryCards.tsx';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions.tsx';
import { SpendingChart } from '@/components/dashboard/SpendingChart.tsx';
import { BudgetProgress } from '@/components/dashboard/BudgetProgress.tsx';
import { SavingsWidget } from '@/components/dashboard/SavingsWidget.tsx';
import { Spinner } from '@/components/ui/Spinner.tsx';
import { useTransactionStore } from '@/stores/transactionStore.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import { useBudgetStore } from '@/stores/budgetStore.ts';
import { useSavingsStore } from '@/stores/savingsStore.ts';
import { getReport } from '@/services/reportService.ts';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ReportData } from '@/types/api.ts';

export function DashboardPage() {
  const { transactions, loading, fetchTransactions } = useTransactionStore();
  const { user } = useAuthStore();
  const { summary, fetchSummary } = useBudgetStore();
  const { totalSavedArs, totalSavedUsd, goals, fetchSummary: fetchSavingsSummary } = useSavingsStore();
  const [report, setReport] = useState<ReportData | null>(null);

  const now = new Date();
  const monthName = format(now, 'MMMM yyyy', { locale: es });
  const firstName = user?.full_name?.split(' ')[0] ?? null;

  useEffect(() => {
    void fetchTransactions();
    void fetchSummary(now);
    void fetchSavingsSummary();

    const from = format(startOfMonth(now), 'yyyy-MM-dd');
    const to = format(endOfMonth(now), 'yyyy-MM-dd');
    void getReport(from, to).then(setReport).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTransactions, fetchSummary, fetchSavingsSummary]);

  if (loading && transactions.length === 0) return <Spinner className="py-12" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {firstName ? `Hola, ${firstName} 👋` : 'Panel'}
        </h1>
        <p className="mt-0.5 text-sm capitalize text-slate-400">{monthName}</p>
      </div>

      <SummaryCards
        totalIncome={report?.total_income ?? 0}
        totalExpense={report?.total_expense ?? 0}
        balance={report?.balance ?? 0}
      />

      {summary.length > 0 && <BudgetProgress items={summary} />}

      <SavingsWidget totalSavedArs={totalSavedArs} totalSavedUsd={totalSavedUsd} goals={goals} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentTransactions transactions={transactions} />
        <SpendingChart data={report?.by_category ?? []} />
      </div>
    </div>
  );
}
