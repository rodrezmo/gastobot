import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Receipt, Users, Scale } from 'lucide-react';
import { Card } from '@/components/ui/Card.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { Spinner } from '@/components/ui/Spinner.tsx';
import { GroupExpenseList } from '@/components/groups/GroupExpenseList.tsx';
import { GroupExpenseForm } from '@/components/groups/GroupExpenseForm.tsx';
import { MemberList } from '@/components/groups/MemberList.tsx';
import { SettlementSummary } from '@/components/groups/SettlementSummary.tsx';
import { FriendSearch } from '@/components/shared/FriendSearch.tsx';
import { useGroupDetail } from '@/hooks/useGroupDetail.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import { cn } from '@/utils/cn.ts';
import type { MemberBalance, UserSearchResult } from '@/types/shared.ts';

type Tab = 'expenses' | 'members' | 'balance';

const statusConfig = {
  active: { label: 'Activa', color: '#10b981' },
  settled: { label: 'Liquidada', color: '#6366f1' },
  archived: { label: 'Archivada', color: '#6b7280' },
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
    () => (group?.members.filter((m) => m.role === 'admin').map((m) => m.user_id) ?? []),
    [group],
  );

  const isCreator = user?.id === group?.creator_id;

  const handleAddMember = async (selectedUser: UserSearchResult) => {
    if (!group) return;
    setAddMemberError('');
    setAddingMember(true);
    try {
      await addMember(selectedUser.email);
    } catch (err) {
      setAddMemberError(err instanceof Error ? err.message : 'Error al agregar miembro');
    } finally {
      setAddingMember(false);
    }
  };

  if (loading && !group) return <Spinner className="py-12" />;
  if (!group) return <p className="py-12 text-center text-gray-500">Grupo no encontrado</p>;

  const tabs: { id: Tab; label: string; icon: typeof Receipt }[] = [
    { id: 'expenses', label: 'Gastos', icon: Receipt },
    { id: 'members', label: 'Miembros', icon: Users },
    { id: 'balance', label: 'Balance', icon: Scale },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate('/shared')}
          className="mt-1 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{group.name}</h1>
            <Badge {...statusConfig[group.status]} />
          </div>
          {group.description && (
            <p className="mt-1 text-sm text-gray-500">{group.description}</p>
          )}
          <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Total: {formatCurrency(group.total, group.currency)} · {group.members.length} miembro
            {group.members.length !== 1 ? 's' : ''} · {group.currency}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-gray-100'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
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
              onDelete={group.status === 'active' ? (id) => void deleteExpense(id) : undefined}
            />
          </Card>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-4">
          <Card title="Miembros">
            <MemberList members={memberBalances} adminIds={adminIds} currency={group.currency} />
          </Card>
          {isCreator && group.status === 'active' && (
            <Card title="Agregar miembro">
              <div className="space-y-2">
                <FriendSearch
                  onSelect={handleAddMember}
                  excludeIds={group.members.map((m) => m.user_id)}
                />
                {addingMember && (
                  <p className="text-xs text-gray-500">Agregando miembro...</p>
                )}
                {addMemberError && (
                  <p className="text-xs text-red-500">{addMemberError}</p>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'balance' && (
        <Card title="Balance y liquidacion">
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
