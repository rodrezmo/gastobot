import { useEffect, useMemo, useState } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { BalanceHero } from '@/components/dashboard/BalanceHero.tsx';
import { DonutChart } from '@/components/dashboard/DonutChart.tsx';
import { ReportBarChart } from '@/components/reports/ReportBarChart.tsx';
import { CategoryBreakdown } from '@/components/reports/CategoryBreakdown.tsx';
import { DateRangePicker } from '@/components/reports/DateRangePicker.tsx';
import { Spinner } from '@/components/ui/Spinner.tsx';
import { getReport } from '@/services/reportService.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import type { ReportData } from '@/types/api.ts';

export function ReportsPage() {
  const now = new Date();
  const { user } = useAuthStore();
  const currency = user?.currency ?? 'ARS';

  const [dateFrom, setDateFrom] = useState(
    format(startOfMonth(now), 'yyyy-MM-dd'),
  );
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

  const donutData = useMemo(
    () =>
      (report?.by_category ?? [])
        .filter((d) => d.category != null)
        .map((d) => ({
          name: d.category.name,
          value: d.total,
          color: d.category.color,
        })),
    [report],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-white">Reportes</h1>
        <p className="mt-1 text-sm text-white/50">
          Analizá tu actividad por período
        </p>
      </div>

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
          <BalanceHero
            balance={report.balance}
            totalIncome={report.total_income}
            totalExpense={report.total_expense}
            subtitle="Balance del período"
            currency={currency}
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DonutChart
              title="Gastos por categoría"
              data={donutData}
              centerSubtitle="Total"
              currency={currency}
            />
            <CategoryBreakdown
              data={report.by_category}
              currency={currency}
            />
          </div>
          <ReportBarChart data={report.by_date} currency={currency} />
        </>
      ) : null}
    </div>
  );
}
