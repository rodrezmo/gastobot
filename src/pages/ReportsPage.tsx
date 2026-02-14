import { useEffect, useState } from 'react';
import { SummaryCards } from '@/components/dashboard/SummaryCards.tsx';
import { ReportPieChart } from '@/components/reports/ReportPieChart.tsx';
import { ReportBarChart } from '@/components/reports/ReportBarChart.tsx';
import { CategoryBreakdown } from '@/components/reports/CategoryBreakdown.tsx';
import { DateRangePicker } from '@/components/reports/DateRangePicker.tsx';
import { Spinner } from '@/components/ui/Spinner.tsx';
import { getReport } from '@/services/reportService.ts';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import type { ReportData } from '@/types/api.ts';

export function ReportsPage() {
  const now = new Date();
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(now), 'yyyy-MM-dd'));
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void getReport(dateFrom, dateTo)
      .then(setReport)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reportes</h1>

      <DateRangePicker
        dateFrom={dateFrom}
        dateTo={dateTo}
        onChange={(from, to) => {
          setDateFrom(from);
          setDateTo(to);
        }}
      />

      {loading ? (
        <Spinner className="py-12" />
      ) : report ? (
        <>
          <SummaryCards
            totalIncome={report.total_income}
            totalExpense={report.total_expense}
            balance={report.balance}
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ReportPieChart data={report.by_category} />
            <CategoryBreakdown data={report.by_category} />
          </div>
          <ReportBarChart data={report.by_date} />
        </>
      ) : null}
    </div>
  );
}
