import { cn } from '@/utils/cn.ts';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface FilterPillsProps<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  className,
}: FilterPillsProps<T>) {
  return (
    <div
      className={cn(
        '-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden',
        className,
      )}
      style={{ scrollbarWidth: 'none' }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all duration-200',
              active
                ? 'bg-grad-primary text-white shadow-cta'
                : 'border border-white/10 bg-white/[0.03] text-white/60 hover:text-white',
            )}
          >
            <span>{opt.label}</span>
            {typeof opt.count === 'number' && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                  active ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60',
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
