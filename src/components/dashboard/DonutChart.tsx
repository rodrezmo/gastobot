import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/Card.tsx';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import { useMemo } from 'react';

interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  title?: string;
  data: DonutSlice[];
  /** Texto central del donut. Default: formatCurrency(total). */
  centerLabel?: string;
  /** Etiqueta debajo del centro (ej: "Gastos totales"). */
  centerSubtitle?: string;
  emptyLabel?: string;
  currency?: string;
}

export function DonutChart({
  title = 'Distribución',
  data,
  centerLabel,
  centerSubtitle,
  emptyLabel = 'Sin datos para este período',
  currency = 'ARS',
}: DonutChartProps) {
  const total = useMemo(
    () => data.reduce((acc, d) => acc + d.value, 0),
    [data],
  );

  const hasData = total > 0 && data.length > 0;

  return (
    <Card title={title}>
      {!hasData ? (
        <p className="py-12 text-center text-sm text-white/40">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative h-60 w-full lg:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((slice, i) => (
                    <Cell key={i} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                    fontSize: 12,
                    color: '#fff',
                  }}
                  formatter={(v: number | undefined) =>
                    v != null ? formatCurrency(v, currency) : ''
                  }
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centro del donut */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-xl text-white sm:text-2xl">
                {centerLabel ?? formatCurrency(total, currency)}
              </span>
              {centerSubtitle && (
                <span className="mt-0.5 text-[10px] uppercase tracking-widest text-white/40">
                  {centerSubtitle}
                </span>
              )}
            </div>
          </div>

          {/* Leyenda custom */}
          <ul className="flex flex-1 flex-col gap-2">
            {data.map((slice) => {
              const pct = total > 0 ? (slice.value / total) * 100 : 0;
              return (
                <li
                  key={slice.name}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="truncate text-white/80">{slice.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <span>{pct.toFixed(0)}%</span>
                    <span className="tabular-nums text-white">
                      {formatCurrency(slice.value, currency)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
