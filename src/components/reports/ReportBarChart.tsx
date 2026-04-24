import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/Card.tsx';
import { formatCurrency } from '@/utils/formatCurrency.ts';

interface ReportBarChartProps {
  data: { date: string; income: number; expense: number }[];
  currency?: string;
}

export function ReportBarChart({ data, currency = 'ARS' }: ReportBarChartProps) {
  if (data.length === 0) {
    return (
      <Card title="Ingresos vs Gastos">
        <p className="py-12 text-center text-sm text-white/40">
          Sin datos para este período
        </p>
      </Card>
    );
  }

  return (
    <Card title="Ingresos vs Gastos">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            contentStyle={{
              backgroundColor: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              fontSize: 12,
              color: '#fff',
            }}
            formatter={(value: number | undefined) =>
              value != null ? formatCurrency(value, currency) : ''
            }
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}
            iconType="circle"
          />
          <Bar
            dataKey="income"
            name="Ingresos"
            fill="var(--color-green)"
            radius={[6, 6, 0, 0]}
          />
          <Bar
            dataKey="expense"
            name="Gastos"
            fill="var(--color-red)"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
