import { useState } from 'react';
import { X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { FriendSearch } from './FriendSearch.tsx';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import { formatDate } from '@/utils/formatDate.ts';
import { useSharedStore } from '@/stores/sharedStore.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import type { TransactionWithCategory } from '@/types/database.ts';
import type { UserSearchResult } from '@/types/shared.ts';

interface ShareTransactionModalProps {
  transaction: TransactionWithCategory;
  open: boolean;
  onClose: () => void;
}

export function ShareTransactionModal({
  transaction,
  open,
  onClose,
}: ShareTransactionModalProps) {
  const [friends, setFriends] = useState<UserSearchResult[]>([]);
  const [friendPercentages, setFriendPercentages] = useState<
    Map<string, number>
  >(new Map());
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const createSharedTransaction = useSharedStore(
    (s) => s.createSharedTransaction,
  );
  const user = useAuthStore((s) => s.user);
  const currency = user?.currency ?? 'ARS';

  const totalFriendPct = Array.from(friendPercentages.values()).reduce(
    (a, b) => a + b,
    0,
  );
  const ownerPct = Math.max(
    0,
    Math.round((100 - totalFriendPct) * 100) / 100,
  );

  const handleAddFriend = (friend: UserSearchResult) => {
    if (friends.find((f) => f.id === friend.id)) return;
    const newFriends = [...friends, friend];
    setFriends(newFriends);
    const pctEach = Math.round((100 / (newFriends.length + 1)) * 100) / 100;
    const newPcts = new Map<string, number>();
    for (const f of newFriends) newPcts.set(f.id, pctEach);
    setFriendPercentages(newPcts);
  };

  const handleRemoveFriend = (userId: string) => {
    const newFriends = friends.filter((f) => f.id !== userId);
    setFriends(newFriends);
    const newPcts = new Map(friendPercentages);
    newPcts.delete(userId);
    if (newFriends.length > 0) {
      const pctEach = Math.round((100 / (newFriends.length + 1)) * 100) / 100;
      newPcts.clear();
      for (const f of newFriends) newPcts.set(f.id, pctEach);
    }
    setFriendPercentages(newPcts);
  };

  const handlePctChange = (userId: string, value: number) => {
    const newPcts = new Map(friendPercentages);
    newPcts.set(userId, Math.max(0, Math.min(100, value)));
    setFriendPercentages(newPcts);
  };

  const handleSubmit = async () => {
    if (friends.length === 0 || !user) return;
    if (totalFriendPct > 100) {
      setError('La suma de porcentajes no puede superar el 100%');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const participants = [
        {
          user_id: user.id,
          amount:
            Math.round((ownerPct / 100) * transaction.amount * 100) / 100,
          percentage: ownerPct,
        },
        ...friends.map((f) => {
          const pct = friendPercentages.get(f.id) || 0;
          return {
            user_id: f.id,
            amount:
              Math.round((pct / 100) * transaction.amount * 100) / 100,
            percentage: pct,
          };
        }),
      ];

      await createSharedTransaction({
        transaction_id: transaction.id,
        split_method: 'percentage',
        participants,
        note: note || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al compartir');
      console.error('Share error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Compartir gasto">
      <div className="flex flex-col gap-4">
        {/* Transaction summary */}
        <div
          className="rounded-[14px] border p-3"
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderColor: 'var(--color-border)',
          }}
        >
          <p className="text-sm font-medium text-white">
            {transaction.description ??
              transaction.category?.name ??
              'Gasto'}
          </p>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-white/40">
              {formatDate(transaction.date)}
            </span>
            <span
              className="text-sm font-bold tabular-nums"
              style={{ color: 'var(--color-red)' }}
            >
              {formatCurrency(transaction.amount, currency)}
            </span>
          </div>
        </div>

        {/* Friend search */}
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/50">
            Compartir con
          </label>
          <FriendSearch
            onSelect={handleAddFriend}
            excludeIds={[
              ...(user ? [user.id] : []),
              ...friends.map((f) => f.id),
            ]}
          />
        </div>

        {/* Split breakdown */}
        {friends.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-medium uppercase tracking-widest text-white/40">
              División
            </p>

            {/* Owner */}
            <div
              className="flex items-center justify-between gap-3 rounded-[12px] px-3 py-2"
              style={{
                backgroundColor: 'rgba(255,107,74,0.10)',
                border: '1px solid rgba(255,107,74,0.22)',
              }}
            >
              <span className="truncate text-sm font-medium text-white">
                Yo ({user?.full_name || user?.email})
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {ownerPct}%
                </span>
                <span className="text-xs text-white/50">
                  (
                  {formatCurrency(
                    Math.round((ownerPct / 100) * transaction.amount * 100) /
                      100,
                    currency,
                  )}
                  )
                </span>
              </div>
            </div>

            {friends.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-2 rounded-[12px] border border-white/10 bg-white/[0.03] px-2 py-1.5"
              >
                <button
                  type="button"
                  onClick={() => handleRemoveFriend(f.id)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-[color:var(--color-red)]"
                  aria-label="Quitar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-0 flex-1 truncate text-xs text-white/80">
                  @{f.nickname}
                  {f.full_name ? (
                    <span className="text-white/40"> · {f.full_name}</span>
                  ) : null}
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={friendPercentages.get(f.id) ?? 0}
                    onChange={(e) =>
                      handlePctChange(f.id, parseFloat(e.target.value) || 0)
                    }
                    className="h-8 w-16 rounded-[10px] border border-white/10 bg-white/[0.04] px-2 text-right text-xs text-white focus:border-white/20 focus:outline-none"
                  />
                  <span className="text-xs text-white/40">%</span>
                </div>
              </div>
            ))}

            <p
              className="text-xs"
              style={{
                color:
                  totalFriendPct > 100
                    ? 'var(--color-red)'
                    : 'var(--color-green)',
              }}
            >
              Total: {(totalFriendPct + ownerPct).toFixed(1)}%
              {totalFriendPct > 100 && ' · excede el 100%'}
            </p>
          </div>
        )}

        {error && (
          <div
            className="rounded-[14px] border px-3 py-2.5 text-sm"
            style={{
              backgroundColor: 'rgba(255,71,87,0.08)',
              borderColor: 'rgba(255,71,87,0.2)',
              color: 'var(--color-red)',
            }}
          >
            {error}
          </div>
        )}

        <Input
          label="Nota (opcional)"
          placeholder="Ej: Cena del viernes..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <Button
          onClick={() => void handleSubmit()}
          loading={submitting}
          disabled={friends.length === 0 || totalFriendPct > 100}
          fullWidth
        >
          Compartir
        </Button>
      </div>
    </Modal>
  );
}
