import { useState } from 'react';
import { Modal } from '@/components/ui/Modal.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { FriendSearch } from './FriendSearch.tsx';
import { SplitMethodSelector } from './SplitMethodSelector.tsx';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import { formatDate } from '@/utils/formatDate.ts';
import { useSharedStore } from '@/stores/sharedStore.ts';
import type { TransactionWithCategory } from '@/types/database.ts';
import type { SplitMethod, UserSearchResult } from '@/types/shared.ts';

interface ShareTransactionModalProps {
  transaction: TransactionWithCategory;
  open: boolean;
  onClose: () => void;
}

export function ShareTransactionModal({ transaction, open, onClose }: ShareTransactionModalProps) {
  const [participants, setParticipants] = useState<UserSearchResult[]>([]);
  const [method, setMethod] = useState<SplitMethod>('equal');
  const [splits, setSplits] = useState<Map<string, number>>(new Map());
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const createSharedTransaction = useSharedStore((s) => s.createSharedTransaction);

  const handleAddParticipant = (user: UserSearchResult) => {
    if (participants.find((p) => p.id === user.id)) return;
    const newParticipants = [...participants, user];
    setParticipants(newParticipants);

    // Recalculate splits for equal
    if (method === 'equal') {
      const perPerson = Math.round((transaction.amount / newParticipants.length) * 100) / 100;
      const newSplits = new Map<string, number>();
      for (const p of newParticipants) newSplits.set(p.id, perPerson);
      setSplits(newSplits);
    }
  };

  const handleRemoveParticipant = (userId: string) => {
    const newParticipants = participants.filter((p) => p.id !== userId);
    setParticipants(newParticipants);
    const newSplits = new Map(splits);
    newSplits.delete(userId);
    if (method === 'equal' && newParticipants.length > 0) {
      const perPerson = Math.round((transaction.amount / newParticipants.length) * 100) / 100;
      newSplits.clear();
      for (const p of newParticipants) newSplits.set(p.id, perPerson);
    }
    setSplits(newSplits);
  };

  const getParticipantAmounts = () => {
    if (method === 'equal') {
      const perPerson = Math.round((transaction.amount / participants.length) * 100) / 100;
      return participants.map((p) => ({ user_id: p.id, amount: perPerson }));
    }
    if (method === 'percentage') {
      return participants.map((p) => ({
        user_id: p.id,
        amount: Math.round(((splits.get(p.id) || 0) / 100) * transaction.amount * 100) / 100,
        percentage: splits.get(p.id) || 0,
      }));
    }
    return participants.map((p) => ({
      user_id: p.id,
      amount: splits.get(p.id) || 0,
    }));
  };

  const handleSubmit = async () => {
    if (participants.length === 0) return;
    setSubmitting(true);
    try {
      await createSharedTransaction({
        transaction_id: transaction.id,
        split_method: method,
        participants: getParticipantAmounts(),
        note: note || undefined,
      });
      onClose();
    } catch {
      // error handled by store
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
            {transaction.description ?? transaction.category.name}
          </p>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-gray-500">{formatDate(transaction.date)}</span>
            <span className="text-sm font-bold text-red-600">
              {formatCurrency(transaction.amount)}
            </span>
          </div>
        </div>

        {/* Participant search */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Participantes
          </label>
          <FriendSearch
            onSelect={handleAddParticipant}
            excludeIds={participants.map((p) => p.id)}
          />
          {participants.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {participants.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                >
                  {p.full_name || p.email}
                  <button
                    type="button"
                    onClick={() => handleRemoveParticipant(p.id)}
                    className="ml-1 text-primary-500 hover:text-primary-700"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Split method */}
        {participants.length > 0 && (
          <SplitMethodSelector
            method={method}
            onChange={setMethod}
            totalAmount={transaction.amount}
            participants={participants}
            splits={splits}
            onSplitsChange={setSplits}
          />
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
          disabled={participants.length === 0}
          className="w-full"
        >
          Compartir
        </Button>
      </div>
    </Modal>
  );
}
