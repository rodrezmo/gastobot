import { ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn.ts';
import { hexToRgba } from '@/utils/color.ts';

interface SettingsRowProps {
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  /** Color del ícono y tintado. Default indigo. */
  color?: string;
  onClick?: () => void;
  /** Slot derecho custom (ej: toggle, valor, chip). Si se pasa, oculta la flecha por default salvo que se fuerce con showArrow. */
  right?: ReactNode;
  showArrow?: boolean;
  danger?: boolean;
  className?: string;
}

export function SettingsRow({
  icon: Icon,
  label,
  sublabel,
  color = '#5352ED',
  onClick,
  right,
  showArrow,
  danger = false,
  className,
}: SettingsRowProps) {
  const Tag = onClick ? 'button' : 'div';
  const effectiveColor = danger ? '#FF4757' : color;
  const displayArrow = showArrow ?? (onClick && !right);

  return (
    <Tag
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left transition-colors',
        onClick && 'hover:bg-white/5 active:bg-white/[0.08]',
        className,
      )}
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
        style={{
          backgroundColor: hexToRgba(effectiveColor, 0.16),
          color: effectiveColor,
        }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm font-medium',
            danger ? 'text-[color:var(--color-red)]' : 'text-white',
          )}
        >
          {label}
        </p>
        {sublabel && (
          <p className="truncate text-xs text-white/40">{sublabel}</p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
      {displayArrow && <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />}
    </Tag>
  );
}
