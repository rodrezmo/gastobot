import { Card } from '@/components/ui/Card.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import type { Category } from '@/types/database.ts';

interface CategoryBreakdownProps {
  data: { category: Category; total: number }[];
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const grandTotal = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <Card title="Desglose por categoria">
      {data.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">Sin datos</p>
      ) : (
        <div className="space-y-3">
          {data
            .filter(({ category }) => category != null)
            .sort((a, b) => b.total - a.total)
            .map(({ category, total }) => {
              const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
              return (
                <div key={category.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <Badge label={category.name} color={category.color} />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {formatCurrency(total)} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: category.color }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </Card>
  );
}
