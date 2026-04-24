import { cn } from '@/utils/cn.ts';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-grad-primary text-white shadow-cta hover:brightness-110 active:brightness-95',
  secondary:
    'border border-white/10 bg-white/5 text-white hover:bg-white/10 active:bg-white/5',
  danger:
    'bg-[color:var(--color-red)] text-white hover:brightness-110 active:brightness-95',
  ghost: 'bg-transparent text-white/70 hover:bg-white/5 hover:text-white',
  outline:
    'border border-white/15 bg-transparent text-white hover:bg-white/5',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-[10px]',
  md: 'px-4 py-2.5 text-sm rounded-[12px]',
  lg: 'px-6 py-3.5 text-base rounded-[14px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-50',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
