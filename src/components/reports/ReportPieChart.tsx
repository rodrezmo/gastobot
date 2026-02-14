import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card } from '@/components/ui/Card.tsx';
import type { Category } from '@/types/database.ts';

interface ReportPieChartProps {
  data: { category: Category; total: number }[];
}

export function ReportPieChart({ data }: ReportPieChartProps) {
  const chartData = data.map((d) => ({
    name: d.category.name,
    value: d.total,
    color: d.category.color,
  }));

  if (chartData.length === 0) {
    return (
      <Card title="Gastos por categoria">
        <p className="py-8 text-center text-sm text-gray-500">Sin datos</p>
      </Card>
    );
  }

  return (
    <Card title="Gastos por categoria">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined) =>
              value != null
                ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
                : ''
            }
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
