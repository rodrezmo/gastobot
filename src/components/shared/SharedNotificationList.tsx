import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import { formatDate } from '@/utils/formatDate.ts';
import type { SharedTransactionWithDetails } from '@/types/shared.ts';

interface SharedNotificationListProps {
  expenses: SharedTransactionWithDetails[];
  onRespond: (
    participantId: string,
    status: 'accepted' | 'rejected',
  ) => Promise<void>;
  currentUserId?: string;
  currency?: string;
}

export function SharedNotificationList({
  expenses,
  onRespond,
  currency = 'ARS',
}: SharedNotificationListProps) {
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const handleRespond = async (
    participantId: string,
    status: 'accepted' | 'rejected',
  ) => {
    setRespondingId(participantId);
    try {
      await onRespond(participantId, status);
    } finally {
      setRespondingId(null);
    }
  };

  if (expenses.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {expenses.map((shared) => {
        const myParticipation =
          shared.participants.find((p) => p.status === 'pending') ??
          shared.participants[0];
        if (!myParticipation) return null;

        return (
          <div
            key={shared.id}
            className="rounded-[14px] border p-4"
            style={{
              backgroundColor: 'rgba(255,165,2,0.08)',
              borderColor: 'rgba(255,165,2,0.22)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {shared.owner.full_name || shared.owner.email} te compartió
                  un gasto
                </p>
                <p className="mt-0.5 truncate text-xs text-white/50">
                  {shared.transaction?.description ?? 'Gasto'} ·{' '}
                  {formatDate(shared.created_at)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums text-white">
                {formatCurrency(myParticipation.amount, currency)}
              </span>
            </div>

            {shared.note && (
              <p className="mt-2 text-xs italic text-white/50">
                {shared.note}
              </p>
            )}

            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={() =>
                  handleRespond(myParticipation.id, 'accepted')
                }
                loading={respondingId === myParticipation.id}
                disabled={respondingId !== null}
              >
                <Check className="h-4 w-4" />
                Aceptar
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() =>
                  handleRespond(myParticipation.id, 'rejected')
                }
                loading={respondingId === myParticipation.id}
                disabled={respondingId !== null}
              >
                <X className="h-4 w-4" />
                Rechazar
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
