import { useState } from 'react';
import { Pencil, Trash2, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge.tsx';
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

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <Badge label={t.category.name} color={t.category.color} />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t.description ?? t.category.name}
            </p>
            <p className="text-xs text-gray-500">{formatDate(t.date)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-sm font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}
          >
            {t.type === 'income' ? '+' : '-'}
            {formatCurrency(t.amount)}
          </span>

          <div className="flex gap-1">
            <button
              onClick={() => setShareModalOpen(true)}
              title="Compartir gasto"
              className="rounded p-1 text-gray-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate(`/transactions/${t.id}/edit`)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(t.id)}
              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
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
