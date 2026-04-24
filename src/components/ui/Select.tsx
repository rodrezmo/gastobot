import { cn } from '@/utils/cn.ts';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export function Select({
  label,
  options,
  error,
  className,
  id,
  ...props
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-medium uppercase tracking-wider text-white/50"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'h-11 w-full appearance-none rounded-[14px] border bg-white/[0.04] px-4 text-sm text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/10',
          error
            ? 'border-[color:var(--color-red)]'
            : 'border-white/10 focus:border-white/20 focus:bg-white/[0.06]',
          className,
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
          paddingRight: '2.25rem',
        }}
        {...props}
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            style={{
              backgroundColor: 'var(--color-surface-2)',
              color: '#fff',
            }}
          >
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-[color:var(--color-red)]">{error}</p>
      )}
    </div>
  );
}
