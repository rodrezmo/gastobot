import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import { formatDate } from '@/utils/formatDate.ts';
import type { SharedTransactionWithDetails } from '@/types/shared.ts';

interface SharedNotificationListProps {
  expenses: SharedTransactionWithDetails[];
  onRespond: (participantId: string, status: 'accepted' | 'rejected') => Promise<void>;
  currentUserId?: string;
}

export function SharedNotificationList({
  expenses,
  onRespond,
}: SharedNotificationListProps) {
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const handleRespond = async (participantId: string, status: 'accepted' | 'rejected') => {
    setRespondingId(participantId);
    try {
      await onRespond(participantId, status);
    } finally {
      setRespondingId(null);
    }
  };

  if (expenses.length === 0) return null;

  return (
    <div className="space-y-3">
      {expenses.map((shared) => {
        const myParticipation = shared.participants.find(
          (p) => p.status === 'pending',
        ) ?? shared.participants[0];
        if (!myParticipation) return null;

        return (
          <div
            key={shared.id}
            className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {shared.owner.full_name || shared.owner.email} te compartio un gasto
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {shared.transaction?.description ?? 'Gasto'} - {formatDate(shared.created_at)}
                </p>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(myParticipation.amount)}
              </span>
            </div>

            {shared.note && (
              <p className="mt-1 text-xs italic text-gray-500">{shared.note}</p>
            )}

            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={() => handleRespond(myParticipation.id, 'accepted')}
                loading={respondingId === myParticipation.id}
                disabled={respondingId !== null}
              >
                <Check className="h-4 w-4" />
                Aceptar
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleRespond(myParticipation.id, 'rejected')}
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
