import { cn } from '@/utils/cn.ts';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'h-4 w-4', md: 'h-7 w-7', lg: 'h-10 w-10' };

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2
        className={cn('animate-spin text-white/40', sizeMap[size])}
        strokeWidth={2}
      />
    </div>
  );
}
