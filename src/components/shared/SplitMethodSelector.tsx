import { cn } from '@/utils/cn.ts';
import { Input } from '@/components/ui/Input.tsx';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import type { SplitMethod, UserSearchResult } from '@/types/shared.ts';

interface SplitMethodSelectorProps {
  method: SplitMethod;
  onChange: (method: SplitMethod) => void;
  totalAmount: number;
  participants: UserSearchResult[];
  splits: Map<string, number>;
  onSplitsChange: (splits: Map<string, number>) => void;
  currency?: string;
}

const methods: { value: SplitMethod; label: string }[] = [
  { value: 'equal', label: 'Iguales' },
  { value: 'custom', label: 'Montos' },
  { value: 'percentage', label: 'Porcentaje' },
];

export function SplitMethodSelector({
  method,
  onChange,
  totalAmount,
  participants,
  splits,
  onSplitsChange,
  currency = 'ARS',
}: SplitMethodSelectorProps) {
  const perPerson =
    participants.length > 0
      ? Math.round((totalAmount / participants.length) * 100) / 100
      : 0;

  const handleMethodChange = (m: SplitMethod) => {
    onChange(m);
    const newSplits = new Map<string, number>();
    if (m === 'equal') {
      for (const p of participants) newSplits.set(p.id, perPerson);
    } else if (m === 'percentage') {
      const pct =
        participants.length > 0
          ? Math.round((100 / participants.length) * 100) / 100
          : 0;
      for (const p of participants) newSplits.set(p.id, pct);
    }
    onSplitsChange(newSplits);
  };

  const handleSplitChange = (userId: string, value: number) => {
    const newSplits = new Map(splits);
    newSplits.set(userId, value);
    onSplitsChange(newSplits);
  };

  const totalSplit = Array.from(splits.values()).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-1 rounded-[14px] border border-white/10 bg-white/[0.02] p-1">
        {methods.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => handleMethodChange(m.value)}
            className={cn(
              'rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors',
              method === m.value
                ? 'text-white'
                : 'text-white/50 hover:text-white/70',
            )}
            style={
              method === m.value
                ? { backgroundColor: 'rgba(255,255,255,0.06)' }
                : undefined
            }
          >
            {m.label}
          </button>
        ))}
      </div>

      {participants.length > 0 && (
        <div className="flex flex-col gap-2">
          {participants.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3"
            >
              <span className="min-w-0 truncate text-sm text-white/80">
                @{p.nickname}
                {p.full_name ? (
                  <span className="text-white/40"> · {p.full_name}</span>
                ) : null}
              </span>
              {method === 'equal' ? (
                <span className="shrink-0 text-sm font-medium tabular-nums text-white">
                  {formatCurrency(perPerson, currency)}
                </span>
              ) : method === 'custom' ? (
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={splits.get(p.id) ?? 0}
                  onChange={(e) =>
                    handleSplitChange(p.id, parseFloat(e.target.value) || 0)
                  }
                  className="w-32 text-right"
                />
              ) : (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={splits.get(p.id) ?? 0}
                    onChange={(e) =>
                      handleSplitChange(
                        p.id,
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="w-20 text-right"
                  />
                  <span className="text-sm text-white/40">%</span>
                </div>
              )}
            </div>
          ))}

          {method === 'custom' && (
            <p
              className="text-xs"
              style={{
                color:
                  Math.abs(totalSplit - totalAmount) < 0.01
                    ? 'var(--color-green)'
                    : 'var(--color-red)',
              }}
            >
              Total: {formatCurrency(totalSplit, currency)} /{' '}
              {formatCurrency(totalAmount, currency)}
              {Math.abs(totalSplit - totalAmount) >= 0.01 &&
                ` · faltan ${formatCurrency(totalAmount - totalSplit, currency)}`}
            </p>
          )}

          {method === 'percentage' && (
            <p
              className="text-xs"
              style={{
                color:
                  Math.abs(totalSplit - 100) < 0.01
                    ? 'var(--color-green)'
                    : 'var(--color-red)',
              }}
            >
              Total: {totalSplit.toFixed(1)}%
              {Math.abs(totalSplit - 100) >= 0.01 &&
                ` · faltan ${(100 - totalSplit).toFixed(1)}%`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
