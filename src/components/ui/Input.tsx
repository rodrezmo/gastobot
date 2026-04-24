import { cn } from '@/utils/cn.ts';
import type { ReactNode } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
}

export function Input({
  label,
  error,
  hint,
  leftSlot,
  rightSlot,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium uppercase tracking-wider text-white/50"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftSlot && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
            {leftSlot}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            'h-11 w-full rounded-[14px] border bg-white/[0.04] px-4 text-sm text-white placeholder:text-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white/10 disabled:opacity-50',
            Boolean(leftSlot) && 'pl-10',
            Boolean(rightSlot) && 'pr-10',
            error
              ? 'border-[color:var(--color-red)] focus:border-[color:var(--color-red)]'
              : 'border-white/10 focus:border-white/20 focus:bg-white/[0.06]',
            className,
          )}
          {...props}
        />
        {rightSlot && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
            {rightSlot}
          </span>
        )}
      </div>
      {error ? (
        <p className="text-xs text-[color:var(--color-red)]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-white/40">{hint}</p>
      ) : null}
    </div>
  );
}
