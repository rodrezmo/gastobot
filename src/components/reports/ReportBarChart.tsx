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

interface ReportBarChartProps {
  data: { date: string; income: number; expense: number }[];
}

export function ReportBarChart({ data }: ReportBarChartProps) {
  if (data.length === 0) {
    return (
      <Card title="Ingresos vs Gastos">
        <p className="py-8 text-center text-sm text-gray-500">Sin datos</p>
      </Card>
    );
  }

  return (
    <Card title="Ingresos vs Gastos">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number | undefined) =>
              value != null
                ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
                : ''
            }
          />
          <Legend />
          <Bar dataKey="income" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
