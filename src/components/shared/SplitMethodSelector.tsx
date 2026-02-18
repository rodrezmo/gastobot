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
}

const methods: { value: SplitMethod; label: string }[] = [
  { value: 'equal', label: 'Partes iguales' },
  { value: 'custom', label: 'Montos personalizados' },
  { value: 'percentage', label: 'Porcentaje' },
];

export function SplitMethodSelector({
  method,
  onChange,
  totalAmount,
  participants,
  splits,
  onSplitsChange,
}: SplitMethodSelectorProps) {
  const perPerson =
    participants.length > 0 ? Math.round((totalAmount / participants.length) * 100) / 100 : 0;

  const handleMethodChange = (m: SplitMethod) => {
    onChange(m);
    const newSplits = new Map<string, number>();
    if (m === 'equal') {
      for (const p of participants) newSplits.set(p.id, perPerson);
    } else if (m === 'percentage') {
      const pct = participants.length > 0 ? Math.round((100 / participants.length) * 100) / 100 : 0;
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
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
        {methods.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => handleMethodChange(m.value)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              method === m.value
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-gray-100'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {participants.length > 0 && (
        <div className="space-y-2">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                @{p.nickname}
                {p.full_name ? ` · ${p.full_name}` : ''}
              </span>
              {method === 'equal' ? (
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(perPerson)}
                </span>
              ) : method === 'custom' ? (
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={splits.get(p.id) ?? 0}
                  onChange={(e) => handleSplitChange(p.id, parseFloat(e.target.value) || 0)}
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
                    onChange={(e) => handleSplitChange(p.id, parseFloat(e.target.value) || 0)}
                    className="w-20 text-right"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              )}
            </div>
          ))}

          {method === 'custom' && (
            <p
              className={cn(
                'text-xs',
                Math.abs(totalSplit - totalAmount) < 0.01 ? 'text-green-600' : 'text-red-500',
              )}
            >
              Total: {formatCurrency(totalSplit)} / {formatCurrency(totalAmount)}
              {Math.abs(totalSplit - totalAmount) >= 0.01 &&
                ` (faltan ${formatCurrency(totalAmount - totalSplit)})`}
            </p>
          )}

          {method === 'percentage' && (
            <p
              className={cn(
                'text-xs',
                Math.abs(totalSplit - 100) < 0.01 ? 'text-green-600' : 'text-red-500',
              )}
            >
              Total: {totalSplit.toFixed(1)}%
              {Math.abs(totalSplit - 100) >= 0.01 && ` (faltan ${(100 - totalSplit).toFixed(1)}%)`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
