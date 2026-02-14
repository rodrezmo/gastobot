import { cn } from '@/utils/cn.ts';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800',
        className,
      )}
    >
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      )}
      {children}
    </div>
  );
}
