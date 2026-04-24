import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { Spinner } from '@/components/ui/Spinner.tsx';
import { FilterPills } from '@/components/ui/FilterPills.tsx';
import { GroupExpenseList } from '@/components/groups/GroupExpenseList.tsx';
import { GroupExpenseForm } from '@/components/groups/GroupExpenseForm.tsx';
import { MemberList } from '@/components/groups/MemberList.tsx';
import { SettlementSummary } from '@/components/groups/SettlementSummary.tsx';
import { FriendSearch } from '@/components/shared/FriendSearch.tsx';
import { useGroupDetail } from '@/hooks/useGroupDetail.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import type { MemberBalance, UserSearchResult } from '@/types/shared.ts';

type Tab = 'expenses' | 'members' | 'balance';

const statusConfig = {
  active: { label: 'Activa', color: '#2ED573' },
  settled: { label: 'Liquidada', color: '#5352ED' },
  archived: { label: 'Archivada', color: '#8A8A99' },
};

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const [addingMember, setAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState('');
  const user = useAuthStore((s) => s.user);

  const {
    group,
    loading,
    addMember,
    addExpense,
    deleteExpense,
    settlements,
    createSettlement,
    settleGroup,
  } = useGroupDetail(id!);

  const memberBalances: MemberBalance[] = useMemo(() => {
    if (!group) return [];
    const { expenses, members } = group;
    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const fairShare = members.length > 0 ? total / members.length : 0;

    return members.map((m) => {
      const paid = expenses
        .filter((e) => e.paid_by === m.user_id)
        .reduce((sum, e) => sum + Number(e.amount), 0);
      return {
        userId: m.user_id,
        userName: m.user.full_name || m.user.email,
        paid,
        fairShare: Math.round(fairShare * 100) / 100,
        netBalance: Math.round((paid - fairShare) * 100) / 100,
      };
    });
  }, [group]);

  const adminIds = useMemo(
    () =>
      group?.members
        .filter((m) => m.role === 'admin')
        .map((m) => m.user_id) ?? [],
    [group],
  );

  const isCreator = user?.id === group?.creator_id;

  const handleAddMember = async (selectedUser: UserSearchResult) => {
    if (!group) return;
    setAddMemberError('');
    setAddingMember(true);
    try {
      await addMember(selectedUser.id);
    } catch (err) {
      setAddMemberError(
        err instanceof Error ? err.message : 'Error al agregar miembro',
      );
    } finally {
      setAddingMember(false);
    }
  };

  if (loading && !group) return <Spinner className="py-12" />;
  if (!group) {
    return (
      <p className="py-12 text-center text-sm text-white/40">
        Grupo no encontrado
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate('/shared')}
          className="mt-1 flex h-9 w-9 items-center justify-center rounded-[12px] text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display truncate text-3xl text-white">
              {group.name}
            </h1>
            <Badge {...statusConfig[group.status]} />
          </div>
          {group.description && (
            <p className="mt-1 text-sm text-white/50">{group.description}</p>
          )}
          <p className="mt-1 text-xs uppercase tracking-wider text-white/40">
            Total{' '}
            <span className="text-white/80">
              {formatCurrency(group.total, group.currency)}
            </span>{' '}
            · {group.members.length} miembro
            {group.members.length !== 1 ? 's' : ''} · {group.currency}
          </p>
        </div>
      </div>

      <FilterPills<Tab>
        value={activeTab}
        onChange={setActiveTab}
        options={[
          { value: 'expenses', label: 'Gastos', count: group.expenses.length },
          { value: 'members', label: 'Miembros', count: group.members.length },
          { value: 'balance', label: 'Balance' },
        ]}
      />

      {activeTab === 'expenses' && (
        <div className="space-y-6">
          {group.status === 'active' && (
            <Card title="Agregar gasto">
              <GroupExpenseForm groupId={group.id} onSubmit={addExpense} />
            </Card>
          )}
          <Card title="Gastos del grupo">
            <GroupExpenseList
              expenses={group.expenses}
              currentUserId={user?.id ?? ''}
              currency={group.currency}
              onDelete={
                group.status === 'active'
                  ? (id) => void deleteExpense(id)
                  : undefined
              }
            />
          </Card>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-6">
          <Card title="Miembros">
            <MemberList
              members={memberBalances}
              adminIds={adminIds}
              currency={group.currency}
            />
          </Card>
          {isCreator && group.status === 'active' && (
            <Card title="Agregar miembro">
              <div className="flex flex-col gap-2">
                <FriendSearch
                  onSelect={handleAddMember}
                  excludeIds={group.members.map((m) => m.user_id)}
                />
                {addingMember && (
                  <p className="text-xs text-white/40">
                    Agregando miembro...
                  </p>
                )}
                {addMemberError && (
                  <p
                    className="text-xs"
                    style={{ color: 'var(--color-red)' }}
                  >
                    {addMemberError}
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'balance' && (
        <Card title="Balance y liquidación">
          <SettlementSummary
            transfers={settlements}
            groupId={group.id}
            currentUserId={user?.id ?? ''}
            onCreateSettlement={createSettlement}
            onSettleGroup={settleGroup}
            groupStatus={group.status}
            memberBalances={memberBalances}
            currency={group.currency}
          />
        </Card>
      )}
    </div>
  );
}
