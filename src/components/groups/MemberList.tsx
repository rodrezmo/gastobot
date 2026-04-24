import { Crown } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import type { MemberBalance } from '@/types/shared.ts';

interface MemberListProps {
  members: MemberBalance[];
  adminIds?: string[];
  currency?: string;
}

export function MemberList({
  members,
  adminIds = [],
  currency = 'ARS',
}: MemberListProps) {
  return (
    <div className="flex flex-col gap-2">
      {members.map((m) => {
        const balanceColor =
          m.netBalance > 0.01
            ? 'var(--color-green)'
            : m.netBalance < -0.01
              ? 'var(--color-red)'
              : 'rgba(255,255,255,0.5)';

        return (
          <div
            key={m.userId}
            className="flex items-center justify-between gap-3 rounded-[14px] border px-3 py-2.5"
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{
                  background: 'var(--grad-primary)',
                  boxShadow: 'var(--shadow-cta)',
                }}
              >
                {m.userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-white">
                    {m.userName}
                  </span>
                  {adminIds.includes(m.userId) && (
                    <Crown
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: 'var(--color-amber)' }}
                    />
                  )}
                </div>
                <p className="truncate text-[11px] text-white/40">
                  Pagó {formatCurrency(m.paid, currency)} · parte justa{' '}
                  {formatCurrency(m.fairShare, currency)}
                </p>
              </div>
            </div>
            <span
              className="shrink-0 text-sm font-bold tabular-nums"
              style={{ color: balanceColor }}
            >
              {m.netBalance > 0.01 && '+'}
              {formatCurrency(m.netBalance, currency)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
