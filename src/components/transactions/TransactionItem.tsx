import { useState } from 'react';
import { Pencil, Trash2, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ShareTransactionModal } from '@/components/shared/ShareTransactionModal.tsx';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import { formatDate } from '@/utils/formatDate.ts';
import type { TransactionWithCategory } from '@/types/database.ts';

interface TransactionItemProps {
  transaction: TransactionWithCategory;
  onDelete: (id: string) => void;
}

export function TransactionItem({ transaction: t, onDelete }: TransactionItemProps) {
  const navigate = useNavigate();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const categoryInitial = (t.category?.name ?? 'S')[0].toUpperCase();
  const categoryColor = t.category?.color ?? '#6b7280';

  return (
    <>
      <div className="group flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-800">
        {/* Accent lateral */}
        <div
          className={`w-0.5 self-stretch rounded-full flex-shrink-0 ${
            t.type === 'income' ? 'bg-green-500' : 'bg-red-500'
          }`}
        />

        {/* Avatar categoría */}
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: categoryColor }}
        >
          {categoryInitial}
        </div>

        {/* Descripción y categoría */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t.description ?? t.category?.name ?? 'Sin categoría'}
          </p>
          <p className="text-xs text-slate-400">
            {t.category?.name ?? 'Sin categoría'} · {formatDate(t.date)}
          </p>
        </div>

        {/* Monto + acciones */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex flex-col items-end gap-0.5">
            <span
              className={`text-sm font-bold tabular-nums ${
                t.type === 'income' ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
            </span>
            {t.installments_total > 1 && (
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                {t.installment_number}/{t.installments_total} cuotas
              </span>
            )}
          </div>

          <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => setShareModalOpen(true)}
              title="Compartir"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => navigate(`/transactions/${t.id}/edit`)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                if (window.confirm('¿Eliminar esta transacción?')) onDelete(t.id);
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {shareModalOpen && (
        <ShareTransactionModal
          transaction={t}
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </>
  );
}
