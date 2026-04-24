import { Card } from '@/components/ui/Card.tsx';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import { hexToRgba } from '@/utils/color.ts';
import type { Category } from '@/types/database.ts';

interface CategoryBreakdownProps {
  data: { category: Category; total: number }[];
  currency?: string;
}

export function CategoryBreakdown({ data, currency = 'ARS' }: CategoryBreakdownProps) {
  const grandTotal = data.reduce((sum, d) => sum + d.total, 0);
  const items = data.filter(({ category }) => category != null);

  return (
    <Card title="Desglose por categoría">
      {items.length === 0 ? (
        <p className="py-12 text-center text-sm text-white/40">
          Sin datos para este período
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {items
            .sort((a, b) => b.total - a.total)
            .map(({ category, total }) => {
              const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
              return (
                <div key={category.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="truncate text-white/80">
                        {category.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-white/40">{pct.toFixed(1)}%</span>
                      <span className="tabular-nums text-white">
                        {formatCurrency(total, currency)}
                      </span>
                    </div>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full"
                    style={{ backgroundColor: hexToRgba(category.color, 0.12) }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: category.color,
                      }}
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
