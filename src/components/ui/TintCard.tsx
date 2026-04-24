import { cn } from '@/utils/cn.ts';
import { hexToRgba } from '@/utils/color.ts';
import type { ReactNode } from 'react';

interface TintCardProps {
  /** Color base para el tintado (hex). */
  color: string;
  /** Intensidad del tintado (0–1). Default 0.12 */
  intensity?: number;
  /** Opacidad del borde. Default 0.18 */
  borderIntensity?: number;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  as?: 'div' | 'button';
}

export function TintCard({
  color,
  intensity = 0.12,
  borderIntensity = 0.18,
  children,
  className,
  onClick,
  as = 'div',
}: TintCardProps) {
  const Tag = as;
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'rounded-[20px] border p-5 transition-all duration-200',
        as === 'button' && 'text-left hover:brightness-110 active:scale-[0.99]',
        className,
      )}
      style={{
        backgroundColor: hexToRgba(color, intensity),
        borderColor: hexToRgba(color, borderIntensity),
      }}
    >
      {children}
    </Tag>
  );
}
