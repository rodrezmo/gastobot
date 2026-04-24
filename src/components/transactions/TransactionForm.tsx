import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Select } from '@/components/ui/Select.tsx';
import { FriendSearch } from '@/components/shared/FriendSearch.tsx';
import { NicknameRequired } from '@/components/shared/NicknameRequired.tsx';
import { useCategoryStore } from '@/stores/categoryStore.ts';
import { useSharedStore } from '@/stores/sharedStore.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import { cn } from '@/utils/cn.ts';
import type { TransactionType } from '@/types/database.ts';
import type { CreateTransactionParams } from '@/types/api.ts';
import type { UserSearchResult } from '@/types/shared.ts';

interface TransactionFormProps {
  initialValues?: Partial<CreateTransactionParams> & { type?: TransactionType };
  onSubmit: (params: CreateTransactionParams) => Promise<void>;
  submitLabel: string;
  isEdit?: boolean;
}

export function TransactionForm({
  initialValues,
  onSubmit,
  submitLabel,
  isEdit,
}: TransactionFormProps) {
  const navigate = useNavigate();
  const { categories } = useCategoryStore();
  const createSharedTransaction = useSharedStore(
    (s) => s.createSharedTransaction,
  );
  const user = useAuthStore((s) => s.user);
  const currency = user?.currency ?? 'ARS';

  const [type, setType] = useState<TransactionType>(
    initialValues?.type ?? 'expense',
  );
  const [categoryId, setCategoryId] = useState(
    initialValues?.category_id ?? '',
  );
  const [amount, setAmount] = useState(
    initialValues?.amount?.toString() ?? '',
  );
  const [description, setDescription] = useState(
    initialValues?.description ?? '',
  );
  const [date, setDate] = useState(
    initialValues?.date ?? new Date().toISOString().split('T')[0],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [shareEnabled, setShareEnabled] = useState(false);
  const [friends, setFriends] = useState<UserSearchResult[]>([]);
  const [friendPcts, setFriendPcts] = useState<Map<string, number>>(new Map());

  const filteredCategories = categories.filter((c) => c.type === type);
  const parsedAmount = parseFloat(amount) || 0;
  const totalFriendPct = Array.from(friendPcts.values()).reduce(
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

      await onSubmit({
        category_id: categoryId,
        amount: ownerAmount,
        type,
        description: description || undefined,
        date,
      });

      if (isSharing) {
        const { useTransactionStore } = await import(
          '@/stores/transactionStore.ts'
        );
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
                amount:
                  Math.round((pct / 100) * parsedAmount * 100) / 100,
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

      navigate('/transactions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
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

      {/* Tipo */}
      <div className="grid grid-cols-2 gap-2 rounded-[14px] border border-white/10 bg-white/[0.02] p-1">
        <TypeToggle
          active={type === 'expense'}
          onClick={() => setType('expense')}
          icon={<ArrowUpRight className="h-4 w-4" />}
          label="Gasto"
          activeColor="var(--color-red)"
        />
        <TypeToggle
          active={type === 'income'}
          onClick={() => setType('income')}
          icon={<ArrowDownLeft className="h-4 w-4" />}
          label="Ingreso"
          activeColor="var(--color-green)"
        />
      </div>

      <Input
        label="Monto"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />

      <Select
        label="Categoría"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={[
          { value: '', label: 'Seleccionar categoría...' },
          ...filteredCategories.map((c) => ({
            value: c.id,
            label: c.name,
          })),
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

      {!isEdit && type === 'expense' && (
        <div className="flex flex-col gap-3 rounded-[14px] border border-white/10 bg-white/[0.02] p-3">
          <button
            type="button"
            onClick={() => setShareEnabled(!shareEnabled)}
            className={cn(
              'flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-sm font-medium transition-colors',
              shareEnabled
                ? 'text-white'
                : 'text-white/60 hover:text-white/80',
            )}
            style={
              shareEnabled
                ? {
                    background: 'var(--grad-primary)',
                    boxShadow: 'var(--shadow-cta)',
                  }
                : { backgroundColor: 'rgba(255,255,255,0.04)' }
            }
          >
            <span className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Compartir este gasto
            </span>
            <span className="text-xs opacity-80">
              {shareEnabled ? 'Activado' : 'Desactivado'}
            </span>
          </button>

          {shareEnabled && (
            <div className="flex flex-col gap-3">
              {!user?.nickname ? (
                <NicknameRequired />
              ) : (
                <FriendSearch
                  onSelect={handleAddFriend}
                  excludeIds={[
                    ...(user ? [user.id] : []),
                    ...friends.map((f) => f.id),
                  ]}
                />
              )}

              {friends.length > 0 && (
                <div className="flex flex-col gap-2">
                  {/* Owner */}
                  <div
                    className="flex items-center justify-between rounded-[12px] px-3 py-2 text-xs"
                    style={{
                      backgroundColor: 'rgba(255,107,74,0.10)',
                      border: '1px solid rgba(255,107,74,0.22)',
                    }}
                  >
                    <span className="font-medium text-white">Yo</span>
                    <span className="font-bold text-white tabular-nums">
                      {ownerPct}% ·{' '}
                      {formatCurrency(
                        Math.round(
                          (ownerPct / 100) * parsedAmount * 100,
                        ) / 100,
                        currency,
                      )}
                    </span>
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
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-white/80">
                          @{f.nickname}
                          {f.full_name ? (
                            <span className="text-white/40">
                              {' '}
                              · {f.full_name}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={friendPcts.get(f.id) ?? 0}
                          onChange={(e) => {
                            const newPcts = new Map(friendPcts);
                            newPcts.set(
                              f.id,
                              Math.max(
                                0,
                                Math.min(
                                  100,
                                  parseFloat(e.target.value) || 0,
                                ),
                              ),
                            );
                            setFriendPcts(newPcts);
                          }}
                          className="h-8 w-16 rounded-[10px] border border-white/10 bg-white/[0.04] px-2 text-right text-xs text-white focus:border-white/20 focus:outline-none"
                        />
                        <span className="text-xs text-white/40">%</span>
                      </div>
                    </div>
                  ))}

                  {totalFriendPct > 100 && (
                    <p
                      className="text-xs"
                      style={{ color: 'var(--color-red)' }}
                    >
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
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(-1)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function TypeToggle({
  active,
  onClick,
  icon,
  label,
  activeColor,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-2 rounded-[10px] py-2.5 text-sm font-medium transition-colors',
        active ? 'text-white' : 'text-white/50 hover:text-white/70',
      )}
      style={
        active
          ? {
              backgroundColor: 'rgba(255,255,255,0.06)',
              boxShadow: `inset 0 0 0 1px ${activeColor}`,
              color: activeColor,
            }
          : undefined
      }
    >
      {icon}
      {label}
    </button>
  );
}
