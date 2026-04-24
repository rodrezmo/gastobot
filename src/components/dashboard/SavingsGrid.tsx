import type { LucideIcon } from 'lucide-react';
import { TintCard } from '@/components/ui/TintCard.tsx';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import { hexToRgba } from '@/utils/color.ts';

export interface SavingsBucket {
  id: string;
  label: string;
  amount: number;
  currency: string;
  color: string;
  icon: LucideIcon;
  /** Texto opcional (ej: tasa, variación, meta) */
  hint?: string;
}

interface SavingsGridProps {
  buckets: SavingsBucket[];
  onSelect?: (bucket: SavingsBucket) => void;
}

export function SavingsGrid({ buckets, onSelect }: SavingsGridProps) {
  if (buckets.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {buckets.map((b) => {
        const Icon = b.icon;
        return (
          <TintCard
            key={b.id}
            color={b.color}
            as={onSelect ? 'button' : 'div'}
            onClick={onSelect ? () => onSelect(b) : undefined}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span
                aria-hidden
                className="flex h-9 w-9 items-center justify-center rounded-[10px]"
                style={{
                  backgroundColor: hexToRgba(b.color, 0.2),
                  color: b.color,
                }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-[10px] uppercase tracking-wider text-white/40">
                {b.currency}
              </span>
            </div>
            <div>
              <p className="text-xs text-white/60">{b.label}</p>
              <p className="font-display mt-1 text-xl text-white">
                {formatCurrency(b.amount, b.currency)}
              </p>
              {b.hint && (
                <p className="mt-1 text-[11px] text-white/40">{b.hint}</p>
              )}
            </div>
          </TintCard>
        );
      })}
    </div>
  );
}
