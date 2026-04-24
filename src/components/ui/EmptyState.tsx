import type { LucideIcon } from 'lucide-react';
import { Button } from './Button.tsx';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[16px] border border-white/10 bg-white/5">
        <Icon className="h-6 w-6 text-white/40" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-white">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-white/50">{description}</p>
      {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}
