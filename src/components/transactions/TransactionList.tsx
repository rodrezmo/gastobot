import { useMemo, useState } from 'react';
import { ArrowLeftRight, Pencil, Share2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { EmptyState } from '@/components/ui/EmptyState.tsx';
import { Spinner } from '@/components/ui/Spinner.tsx';
import { TransactionRow } from '@/components/ui/TransactionRow.tsx';
import { ShareTransactionModal } from '@/components/shared/ShareTransactionModal.tsx';
import { formatDateShort } from '@/utils/formatDate.ts';
import type { TransactionWithCategory } from '@/types/database.ts';

interface TransactionListProps {
  transactions: TransactionWithCategory[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export function TransactionList({
  transactions,
  loading,
  onDelete,
}: TransactionListProps) {
  const navigate = useNavigate();
  const [shareTarget, setShareTarget] = useState<TransactionWithCategory | null>(
    null,
  );

  const grouped = useMemo(() => groupByMonth(transactions), [transactions]);

  if (loading) return <Spinner className="py-12" />;

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="Sin transacciones"
        description="No se encontraron transacciones con los filtros actuales"
        actionLabel="Nueva transacción"
        onAction={() => navigate('/transactions/new')}
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {grouped.map((group) => (
          <section key={group.key}>
            <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-white/40">
              {group.label}
            </h3>
            <ul
              className="shadow-card flex flex-col overflow-hidden rounded-[20px] border"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              {group.items.map((t, idx) => (
                <li
                  key={t.id}
                  className="group relative"
                  style={{
                    borderTop:
                      idx === 0 ? 'none' : '1px solid var(--color-border)',
                  }}
                >
                  <TransactionRow
                    icon={t.category?.icon ?? '💸'}
                    title={t.description ?? t.category?.name ?? 'Sin categoría'}
                    subtitle={formatDateShort(t.date)}
                    color={t.category?.color ?? '#5352ED'}
                    category={t.category?.name}
                    amount={t.amount}
                    type={t.type}
                    onClick={() => navigate(`/transactions/${t.id}/edit`)}
                    className="rounded-none"
                    rightSlot={
                      <div className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-[10px] border border-white/10 bg-[color:var(--color-surface-2)] p-1 group-hover:flex">
                        <ActionButton
                          title="Compartir"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShareTarget(t);
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                        </ActionButton>
                        <ActionButton
                          title="Editar"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/transactions/${t.id}/edit`);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </ActionButton>
                        <ActionButton
                          title="Eliminar"
                          danger
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(t.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </ActionButton>
                      </div>
                    }
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {shareTarget && (
        <ShareTransactionModal
          transaction={shareTarget}
          open={true}
          onClose={() => setShareTarget(null)}
        />
      )}
    </>
  );
}

function ActionButton({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={
        'flex h-7 w-7 items-center justify-center rounded-[8px] transition-colors ' +
        (danger
          ? 'text-white/50 hover:bg-[color:var(--color-red)]/15 hover:text-[color:var(--color-red)]'
          : 'text-white/50 hover:bg-white/10 hover:text-white')
      }
    >
      {children}
    </button>
  );
}

interface Group {
  key: string;
  label: string;
  items: TransactionWithCategory[];
}

function groupByMonth(transactions: TransactionWithCategory[]): Group[] {
  const map = new Map<string, Group>();
  for (const t of transactions) {
    const d = parseISO(t.date);
    const key = format(d, 'yyyy-MM');
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: capitalize(format(d, 'MMMM yyyy', { locale: es })),
        items: [],
      });
    }
    map.get(key)!.items.push(t);
  }
  return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
