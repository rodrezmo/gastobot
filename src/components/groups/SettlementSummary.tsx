import { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import type {
  SettlementTransfer,
  CreateSettlementParams,
  MemberBalance,
} from '@/types/shared.ts';

interface SettlementSummaryProps {
  transfers: SettlementTransfer[];
  groupId: string;
  currentUserId: string;
  onCreateSettlement: (params: CreateSettlementParams) => Promise<void>;
  onSettleGroup: () => Promise<void>;
  groupStatus: string;
  memberBalances?: MemberBalance[];
  currency?: string;
}

export function SettlementSummary({
  transfers,
  groupId,
  currentUserId,
  onCreateSettlement,
  onSettleGroup,
  groupStatus,
  memberBalances = [],
  currency = 'ARS',
}: SettlementSummaryProps) {
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [settling, setSettling] = useState(false);

  const handleMarkAsPaid = async (transfer: SettlementTransfer) => {
    const key = `${transfer.fromUserId}-${transfer.toUserId}`;
    setSettlingId(key);
    try {
      await onCreateSettlement({
        to_user_id: transfer.toUserId,
        amount: transfer.amount,
        group_id: groupId,
      });
    } finally {
      setSettlingId(null);
    }
  };

  const handleSettleGroup = async () => {
    setSettling(true);
    try {
      await onSettleGroup();
    } finally {
      setSettling(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {memberBalances.length > 0 && (
        <div>
          <h4 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-white/50">
            Balance por miembro · parte justa{' '}
            <span className="text-white">
              {formatCurrency(memberBalances[0]?.fairShare ?? 0, currency)}
            </span>
          </h4>
          <div className="flex flex-col gap-2">
            {memberBalances.map((m) => {
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
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{
                        background: 'var(--grad-primary)',
                        boxShadow: 'var(--shadow-cta)',
                      }}
                    >
                      {m.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {m.userName}
                        {m.userId === currentUserId && (
                          <span className="ml-1 text-xs text-white/40">
                            (vos)
                          </span>
                        )}
                      </p>
                      <p className="truncate text-[11px] text-white/40">
                        Pagó {formatCurrency(m.paid, currency)}
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
        </div>
      )}

      {transfers.length === 0 ? (
        <div
          className="flex flex-col items-center gap-2 rounded-[16px] border py-8"
          style={{
            backgroundColor: 'rgba(46,213,115,0.06)',
            borderColor: 'rgba(46,213,115,0.18)',
          }}
        >
          <CheckCircle2
            className="h-8 w-8"
            style={{ color: 'var(--color-green)' }}
          />
          <p className="text-sm text-white/70">No hay deudas pendientes</p>
        </div>
      ) : (
        <div>
          <h4 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-white/50">
            Transferencias sugeridas
          </h4>
          <div className="flex flex-col gap-2">
            {transfers.map((t) => {
              const key = `${t.fromUserId}-${t.toUserId}`;
              const canSettle = t.fromUserId === currentUserId;

              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 rounded-[14px] border px-3 py-2.5"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <span className="truncate font-medium text-white">
                      {t.fromUserName}
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-white/40" />
                    <span className="truncate font-medium text-white">
                      {t.toUserName}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-bold tabular-nums text-white">
                      {formatCurrency(t.amount, currency)}
                    </span>
                    {canSettle && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void handleMarkAsPaid(t)}
                        loading={settlingId === key}
                      >
                        Liquidar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {groupStatus === 'active' && (
        <Button
          variant="primary"
          onClick={() => void handleSettleGroup()}
          loading={settling}
          fullWidth
        >
          Cerrar vaquita
        </Button>
      )}
    </div>
  );
}
