import { cn } from '@/utils/cn.ts';
import { hexToRgba } from '@/utils/color.ts';

interface BadgeProps {
  label: string;
  /** Color semántico (hex). Default indigo. */
  color?: string;
  /** solid usa fondo lleno; tint (default) fondo semitransparente + texto del color. */
  variant?: 'tint' | 'solid';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  label,
  color = '#5352ED',
  variant = 'tint',
  size = 'sm',
  className,
}: BadgeProps) {
  const sizeClass =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px]'
      : 'px-2.5 py-1 text-xs';

  if (variant === 'solid') {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full font-medium text-white',
          sizeClass,
          className,
        )}
        style={{ backgroundColor: color }}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeClass,
        className,
      )}
      style={{
        backgroundColor: hexToRgba(color, 0.16),
        color,
      }}
    >
      {label}
    </span>
  );
}
