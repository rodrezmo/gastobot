import { useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import type { SettlementTransfer, CreateSettlementParams } from '@/types/shared.ts';

interface SettlementSummaryProps {
  transfers: SettlementTransfer[];
  groupId: string;
  currentUserId: string;
  onCreateSettlement: (params: CreateSettlementParams) => Promise<void>;
  onSettleGroup: () => Promise<void>;
  groupStatus: string;
}

export function SettlementSummary({
  transfers,
  groupId,
  currentUserId,
  onCreateSettlement,
  onSettleGroup,
  groupStatus,
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

  if (transfers.length === 0) {
    return (
      <div className="py-6 text-center">
        <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
        <p className="text-sm text-gray-500">No hay deudas pendientes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Transferencias sugeridas
      </h4>

      {transfers.map((t) => {
        const key = `${t.fromUserId}-${t.toUserId}`;
        const canSettle = t.fromUserId === currentUserId;

        return (
          <div
            key={key}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {t.fromUserName}
              </span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {t.toUserName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(t.amount)}
              </span>
              {canSettle && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleMarkAsPaid(t)}
                  loading={settlingId === key}
                >
                  Liquidar
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {groupStatus === 'active' && (
        <Button
          variant="primary"
          onClick={handleSettleGroup}
          loading={settling}
          className="w-full"
        >
          Cerrar vaquita
        </Button>
      )}
    </div>
  );
}
