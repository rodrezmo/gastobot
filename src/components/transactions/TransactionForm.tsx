import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Share2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Select } from '@/components/ui/Select.tsx';
import { FriendSearch } from '@/components/shared/FriendSearch.tsx';
import { NicknameRequired } from '@/components/shared/NicknameRequired.tsx';
import { useCategoryStore } from '@/stores/categoryStore.ts';
import { useSharedStore } from '@/stores/sharedStore.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import type { TransactionType } from '@/types/database.ts';
import type { CreateTransactionParams } from '@/types/api.ts';
import type { UserSearchResult } from '@/types/shared.ts';

interface TransactionFormProps {
  initialValues?: Partial<CreateTransactionParams> & { type?: TransactionType };
  onSubmit: (params: CreateTransactionParams) => Promise<void>;
  submitLabel: string;
  isEdit?: boolean;
}

export function TransactionForm({ initialValues, onSubmit, submitLabel, isEdit }: TransactionFormProps) {
  const navigate = useNavigate();
  const { categories } = useCategoryStore();
  const createSharedTransaction = useSharedStore((s) => s.createSharedTransaction);
  const user = useAuthStore((s) => s.user);

  const [type, setType] = useState<TransactionType>(initialValues?.type ?? 'expense');
  const [categoryId, setCategoryId] = useState(initialValues?.category_id ?? '');
  const [amount, setAmount] = useState(initialValues?.amount?.toString() ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [date, setDate] = useState(initialValues?.date ?? new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Installments state
  const [installmentsEnabled, setInstallmentsEnabled] = useState(false);
  const [installmentsTotal, setInstallmentsTotal] = useState(3);

  // Share state
  const [shareEnabled, setShareEnabled] = useState(false);
  const [friends, setFriends] = useState<UserSearchResult[]>([]);
  const [friendPcts, setFriendPcts] = useState<Map<string, number>>(new Map());

  const filteredCategories = categories.filter((c) => c.type === type);
  const parsedAmount = parseFloat(amount) || 0;

  const monthlyAmount = installmentsEnabled && installmentsTotal > 1
    ? Math.round((parsedAmount / installmentsTotal) * 100) / 100
    : parsedAmount;
  const totalFriendPct = Array.from(friendPcts.values()).reduce((a, b) => a + b, 0);
  const ownerPct = Math.max(0, Math.round((100 - totalFriendPct) * 100) / 100);

  const handleAddFriend = (friend: UserSearchResult) => {
    if (friends.find((f) => f.id === friend.id)) return;
    const newFriends = [...friends, friend];
    setFriends(newFriends);
    const pctEach = Math.round((100 / (newFriends.length + 1)) * 100) / 100;
    const newPcts = new Map<string, number>();
    for (const f of newFriends) newPcts.set(f.id, pctEach);
    setFriendPcts(newPcts);
  };

  const handleRemoveFriend = (userId: string) => {
    const newFriends = friends.filter((f) => f.id !== userId);
    setFriends(newFriends);
    if (newFriends.length > 0) {
      const pctEach = Math.round((100 / (newFriends.length + 1)) * 100) / 100;
      const newPcts = new Map<string, number>();
      for (const f of newFriends) newPcts.set(f.id, pctEach);
      setFriendPcts(newPcts);
    } else {
      setFriendPcts(new Map());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const isSharing = shareEnabled && friends.length > 0 && user;
      const ownerAmount = isSharing
        ? Math.round((ownerPct / 100) * parsedAmount * 100) / 100
        : parsedAmount;

      // Create the transaction with owner's portion (or full amount if not sharing)
      await onSubmit({
        category_id: categoryId,
        amount: ownerAmount,
        type,
        description: description || undefined,
        date,
        installments_total: installmentsEnabled && type === 'expense' && installmentsTotal > 1 ? installmentsTotal : 1,
      });

      // If sharing, create the shared transaction record
      if (isSharing) {
        const { useTransactionStore } = await import('@/stores/transactionStore.ts');
        const transactions = useTransactionStore.getState().transactions;
        const latest = transactions[0];

        if (latest) {
          const participants = [
            {
              user_id: user.id,
              amount: ownerAmount,
              percentage: ownerPct,
            },
            ...friends.map((f) => {
              const pct = friendPcts.get(f.id) || 0;
              return {
                user_id: f.id,
                amount: Math.round((pct / 100) * parsedAmount * 100) / 100,
                percentage: pct,
              };
            }),
          ];

          await createSharedTransaction({
            transaction_id: latest.id,
            split_method: 'percentage',
            participants,
          });
        }
      }

      toast.success('Transacción registrada');
      navigate('/transactions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      toast.error('Ocurrió un error, intentá de nuevo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${
            type === 'expense'
              ? 'bg-gradient-to-r from-red-600 to-red-500 font-bold text-white'
              : 'border border-slate-600 text-slate-400'
          }`}
        >
          Gasto
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${
            type === 'income'
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 font-bold text-white'
              : 'border border-slate-600 text-slate-400'
          }`}
        >
          Ingreso
        </button>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Monto</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">$</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      <Select
        label="Categoría"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={[
          { value: '', label: 'Seleccionar categoría...' },
          ...filteredCategories.map((c) => ({ value: c.id, label: c.name })),
        ]}
        required
      />

      <Input
        label="Descripción"
        type="text"
        placeholder="Descripción opcional"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Input
        label="Fecha"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      {/* Installments toggle - solo para gastos nuevos */}
      {!isEdit && type === 'expense' && (
        <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setInstallmentsEnabled(!installmentsEnabled)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              installmentsEnabled
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                : 'bg-gray-50 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400'
            }`}
          >
            <span className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pagar en cuotas
            </span>
            <span className="text-xs">{installmentsEnabled ? 'Activado' : 'Desactivado'}</span>
          </button>

          {installmentsEnabled && (
            <div className="space-y-2">
              <Input
                label="Cantidad de cuotas"
                type="number"
                min={2}
                max={48}
                value={installmentsTotal}
                onChange={(e) => setInstallmentsTotal(Math.max(2, Math.min(48, parseInt(e.target.value) || 2)))}
              />
              {parsedAmount > 0 && (
                <div className="rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-900/20">
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Cuota mensual:{' '}
                    <span className="font-bold">{formatCurrency(monthlyAmount)}</span>
                    {' '}× {installmentsTotal} meses
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Share toggle - only for new expenses */}
      {!isEdit && type === 'expense' && (
        <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setShareEnabled(!shareEnabled)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              shareEnabled
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                : 'bg-gray-50 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400'
            }`}
          >
            <span className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Compartir este gasto
            </span>
            <span className="text-xs">{shareEnabled ? 'Activado' : 'Desactivado'}</span>
          </button>

          {shareEnabled && (
            <div className="space-y-3">
              {!user?.nickname ? (
                <NicknameRequired />
              ) : (
                <FriendSearch
                  onSelect={handleAddFriend}
                  excludeIds={[...(user ? [user.id] : []), ...friends.map((f) => f.id)]}
                />
              )}

              {friends.length > 0 && (
                <div className="space-y-2">
                  {/* Owner */}
                  <div className="flex items-center justify-between rounded-lg bg-primary-50 px-3 py-2 dark:bg-primary-900/20">
                    <span className="text-xs font-medium text-primary-700 dark:text-primary-400">
                      Yo
                    </span>
                    <span className="text-xs font-bold text-primary-700 dark:text-primary-400">
                      {ownerPct}% ({formatCurrency(Math.round((ownerPct / 100) * parsedAmount * 100) / 100)})
                    </span>
                  </div>

                  {/* Friends */}
                  {friends.map((f) => (
                    <div key={f.id} className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleRemoveFriend(f.id)}
                          className="shrink-0 text-gray-400 hover:text-red-500"
                        >
                          &times;
                        </button>
                        <span className="truncate text-xs text-gray-700 dark:text-gray-300">
                          @{f.nickname}
                          {f.full_name ? ` · ${f.full_name}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={friendPcts.get(f.id) ?? 0}
                          onChange={(e) => {
                            const newPcts = new Map(friendPcts);
                            newPcts.set(f.id, Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)));
                            setFriendPcts(newPcts);
                          }}
                          className="w-20 text-right"
                        />
                        <span className="text-xs text-gray-500">%</span>
                      </div>
                    </div>
                  ))}

                  {totalFriendPct > 100 && (
                    <p className="text-xs text-red-500">
                      La suma de porcentajes excede el 100%
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          loading={loading}
          disabled={shareEnabled && totalFriendPct > 100}
          className="flex-1"
        >
          {submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
