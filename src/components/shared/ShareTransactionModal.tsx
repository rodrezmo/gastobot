import { useState } from 'react';
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

export function ShareTransactionModal({ transaction, open, onClose }: ShareTransactionModalProps) {
  const [friends, setFriends] = useState<UserSearchResult[]>([]);
  const [friendPercentages, setFriendPercentages] = useState<Map<string, number>>(new Map());
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const createSharedTransaction = useSharedStore((s) => s.createSharedTransaction);
  const user = useAuthStore((s) => s.user);

  // Owner's percentage is always the remainder
  const totalFriendPct = Array.from(friendPercentages.values()).reduce((a, b) => a + b, 0);
  const ownerPct = Math.max(0, Math.round((100 - totalFriendPct) * 100) / 100);

  const handleAddFriend = (friend: UserSearchResult) => {
    if (friends.find((f) => f.id === friend.id)) return;
    const newFriends = [...friends, friend];
    setFriends(newFriends);

    // Default: split equally among all (owner + friends)
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
        // Owner (me) with my percentage - auto-accepted by the RPC
        {
          user_id: user.id,
          amount: Math.round((ownerPct / 100) * transaction.amount * 100) / 100,
          percentage: ownerPct,
        },
        // Friends with their percentages
        ...friends.map((f) => {
          const pct = friendPercentages.get(f.id) || 0;
          return {
            user_id: f.id,
            amount: Math.round((pct / 100) * transaction.amount * 100) / 100,
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
      <div className="space-y-4">
        {/* Transaction summary */}
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {transaction.description ?? transaction.category?.name ?? 'Gasto'}
          </p>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-gray-500">{formatDate(transaction.date)}</span>
            <span className="text-sm font-bold text-red-600">
              {formatCurrency(transaction.amount)}
            </span>
          </div>
        </div>

        {/* Friend search */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Compartir con
          </label>
          <FriendSearch
            onSelect={handleAddFriend}
            excludeIds={[...(user ? [user.id] : []), ...friends.map((f) => f.id)]}
          />
        </div>

        {/* Split breakdown */}
        {friends.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase text-gray-500">Division</p>

            {/* Owner (me) - auto calculated */}
            <div className="flex items-center justify-between gap-3 rounded-lg bg-primary-50 px-3 py-2 dark:bg-primary-900/20">
              <span className="text-sm font-medium text-primary-700 dark:text-primary-400">
                Yo ({user?.full_name || user?.email})
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary-700 dark:text-primary-400">
                  {ownerPct}%
                </span>
                <span className="text-xs text-gray-500">
                  ({formatCurrency(Math.round((ownerPct / 100) * transaction.amount * 100) / 100)})
                </span>
              </div>
            </div>

            {/* Friends - editable */}
            {friends.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRemoveFriend(f.id)}
                    className="shrink-0 text-gray-400 hover:text-red-500"
                  >
                    &times;
                  </button>
                  <span className="truncate text-sm text-gray-700 dark:text-gray-300">
                    {f.full_name || f.email}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={friendPercentages.get(f.id) ?? 0}
                    onChange={(e) => handlePctChange(f.id, parseFloat(e.target.value) || 0)}
                    className="w-20 text-right"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
            ))}

            {/* Total validation */}
            <p className={`text-xs ${totalFriendPct > 100 ? 'text-red-500' : 'text-green-600'}`}>
              Total: {(totalFriendPct + ownerPct).toFixed(1)}%
              {totalFriendPct > 100 && ' - Excede el 100%'}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Note */}
        <Input
          label="Nota (opcional)"
          placeholder="Ej: Cena del viernes..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          loading={submitting}
          disabled={friends.length === 0 || totalFriendPct > 100}
          className="w-full"
        >
          Compartir
        </Button>
      </div>
    </Modal>
  );
}
