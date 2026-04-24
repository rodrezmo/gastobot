interface NotificationBadgeProps {
  count: number;
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
      style={{
        background: 'var(--grad-primary)',
        boxShadow: 'var(--shadow-cta)',
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
