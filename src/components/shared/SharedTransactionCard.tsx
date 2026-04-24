import { Badge } from '@/components/ui/Badge.tsx';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import { formatDate } from '@/utils/formatDate.ts';
import type { SharedTransactionWithDetails } from '@/types/shared.ts';

interface SharedTransactionCardProps {
  shared: SharedTransactionWithDetails;
  currency?: string;
}

const statusConfig = {
  pending: { label: 'Pendiente', color: '#FFA502' },
  accepted: { label: 'Aceptado', color: '#2ED573' },
  rejected: { label: 'Rechazado', color: '#FF4757' },
};

const methodLabels = {
  equal: 'Partes iguales',
  custom: 'Montos personalizados',
  percentage: 'Porcentaje',
};

export function SharedTransactionCard({
  shared,
  currency = 'ARS',
}: SharedTransactionCardProps) {
  return (
    <div
      className="rounded-[14px] border p-4"
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {shared.transaction?.description ?? 'Gasto compartido'}
          </p>
          <p className="mt-0.5 text-[11px] uppercase tracking-wider text-white/40">
            {formatDate(shared.created_at)} · {methodLabels[shared.split_method]}
          </p>
        </div>
        <span className="shrink-0 text-sm font-bold tabular-nums text-white">
          {formatCurrency(shared.total_amount, currency)}
        </span>
      </div>

      {shared.note && (
        <p className="mt-2 text-xs italic text-white/50">{shared.note}</p>
      )}

      <div className="mt-3 flex flex-col gap-1.5">
        {shared.participants.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-xs text-white/60">
              {p.user.full_name || p.user.email}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs font-medium tabular-nums text-white/80">
                {formatCurrency(p.amount, currency)}
              </span>
              <Badge {...statusConfig[p.status]} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
