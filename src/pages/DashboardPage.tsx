import { useEffect, useState } from 'react';
import { SummaryCards } from '@/components/dashboard/SummaryCards.tsx';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions.tsx';
import { SpendingChart } from '@/components/dashboard/SpendingChart.tsx';
import { Spinner } from '@/components/ui/Spinner.tsx';
import { useTransactionStore } from '@/stores/transactionStore.ts';
import { getReport } from '@/services/reportService.ts';
import { startOfMonth, endOfMonth, format } from 'date-fns';
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Panel</h1>

      <SummaryCards
        totalIncome={report?.total_income ?? 0}
        totalExpense={report?.total_expense ?? 0}
        balance={report?.balance ?? 0}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentTransactions transactions={transactions} />
        <SpendingChart data={report?.by_category ?? []} />
      </div>
    </div>
  );
}
