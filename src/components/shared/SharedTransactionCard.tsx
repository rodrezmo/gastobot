import { Badge } from '@/components/ui/Badge.tsx';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import { formatDate } from '@/utils/formatDate.ts';
import type { SharedTransactionWithDetails } from '@/types/shared.ts';

interface SharedTransactionCardProps {
  shared: SharedTransactionWithDetails;
}

const statusConfig = {
  pending: { label: 'Pendiente', color: '#f59e0b' },
  accepted: { label: 'Aceptado', color: '#10b981' },
  rejected: { label: 'Rechazado', color: '#ef4444' },
};

const methodLabels = {
  equal: 'Partes iguales',
  custom: 'Montos personalizados',
  percentage: 'Porcentaje',
};

export function SharedTransactionCard({ shared }: SharedTransactionCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {shared.transaction?.description ?? 'Gasto compartido'}
          </p>
          <p className="text-xs text-gray-500">{formatDate(shared.created_at)}</p>
        </div>
        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
          {formatCurrency(shared.total_amount)}
        </span>
      </div>

      <p className="mt-1 text-xs text-gray-500">{methodLabels[shared.split_method]}</p>

      {shared.note && (
        <p className="mt-1 text-xs italic text-gray-400">{shared.note}</p>
      )}

      <div className="mt-3 space-y-1">
        {shared.participants.map((p) => (
          <div key={p.id} className="flex items-center justify-between">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {p.user.full_name || p.user.email}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                {formatCurrency(p.amount)}
              </span>
              <Badge {...statusConfig[p.status]} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
