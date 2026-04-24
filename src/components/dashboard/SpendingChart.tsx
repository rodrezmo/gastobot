import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card } from '@/components/ui/Card.tsx';
import type { Category } from '@/types/database.ts';

interface SpendingChartProps {
  data: { category: Category; total: number }[];
}

export function SpendingChart({ data }: SpendingChartProps) {
  const chartData = data
    .filter((d) => d.category != null)
    .map((d) => ({
      name: d.category.name,
      value: d.total,
      color: d.category.color,
    }));

  if (chartData.length === 0) {
    return (
      <Card title="Gastos por categoría">
        <p className="py-8 text-center text-sm text-gray-500">Sin datos para este periodo</p>
      </Card>
    );
  }

  return (
    <Card title="Gastos por categoría">
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
