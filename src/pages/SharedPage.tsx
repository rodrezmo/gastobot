import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Users, ArrowLeftRight, Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { Card } from '@/components/ui/Card.tsx';
import { Spinner } from '@/components/ui/Spinner.tsx';
import { EmptyState } from '@/components/ui/EmptyState.tsx';
import { SharedTransactionCard } from '@/components/shared/SharedTransactionCard.tsx';
import { SharedNotificationList } from '@/components/shared/SharedNotificationList.tsx';
import { BalanceCard } from '@/components/shared/BalanceCard.tsx';
import { GroupCard } from '@/components/groups/GroupCard.tsx';
import { useSharedExpenses } from '@/hooks/useSharedExpenses.ts';
import { useGroups } from '@/hooks/useGroups.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import { cn } from '@/utils/cn.ts';

type Tab = 'expenses' | 'groups';

export function SharedPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const { pending, sent, balances, loading: sharedLoading, respond } = useSharedExpenses();
  const { groups, loading: groupsLoading } = useGroups();
  const user = useAuthStore((s) => s.user);

  const loading = sharedLoading || groupsLoading;

  if (loading && sent.length === 0 && groups.length === 0) {
    return <Spinner className="py-12" />;
  }

  const tabs: { id: Tab; label: string; icon: typeof ArrowLeftRight }[] = [
    { id: 'expenses', label: 'Gastos Compartidos', icon: ArrowLeftRight },
    { id: 'groups', label: 'Grupos (Vaquitas)', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Compartidos</h1>
        {activeTab === 'groups' && (
          <Button onClick={() => navigate('/shared/groups/new')}>
            <PlusCircle className="h-4 w-4" />
            Nueva vaquita
          </Button>
        )}
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

      {activeTab === 'expenses' ? (
        <div className="space-y-6">
          {/* Pending notifications */}
          {pending.length > 0 && (
            <Card title="Pendientes">
              <SharedNotificationList
                expenses={pending}
                onRespond={respond}
                currentUserId={user?.id ?? ''}
              />
            </Card>
          )}

          {/* Balances */}
          {balances.length > 0 && (
            <Card title="Balance">
              <div className="space-y-2">
                {balances.map((b) => (
                  <BalanceCard key={b.userId} balance={b} />
                ))}
              </div>
            </Card>
          )}

          {/* My shared expenses */}
          {sent.length > 0 ? (
            <Card title="Gastos compartidos enviados">
              <div className="space-y-3">
                {sent.map((s) => (
                  <SharedTransactionCard key={s.id} shared={s} />
                ))}
              </div>
            </Card>
          ) : (
            pending.length === 0 &&
            balances.length === 0 && (
              <EmptyState
                icon={Bell}
                title="Sin gastos compartidos"
                description="Comparti un gasto desde la lista de transacciones para dividirlo con amigos."
              />
            )
          )}
        </div>
      ) : (
        <div>
          {groups.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => (
                <GroupCard key={g.id} group={g} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="Sin vaquitas"
              description="Crea una vaquita para dividir gastos grupales con amigos."
              actionLabel="Nueva vaquita"
              onAction={() => navigate('/shared/groups/new')}
            />
          )}
        </div>
      )}
    </div>
  );
}
