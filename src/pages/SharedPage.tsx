import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Users, ArrowLeftRight, Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { Card } from '@/components/ui/Card.tsx';
import { Spinner } from '@/components/ui/Spinner.tsx';
import { EmptyState } from '@/components/ui/EmptyState.tsx';
import { FilterPills } from '@/components/ui/FilterPills.tsx';
import { SharedTransactionCard } from '@/components/shared/SharedTransactionCard.tsx';
import { SharedNotificationList } from '@/components/shared/SharedNotificationList.tsx';
import { BalanceCard } from '@/components/shared/BalanceCard.tsx';
import { GroupCard } from '@/components/groups/GroupCard.tsx';
import { useSharedExpenses } from '@/hooks/useSharedExpenses.ts';
import { useGroups } from '@/hooks/useGroups.ts';
import { useAuthStore } from '@/stores/authStore.ts';

type Tab = 'expenses' | 'groups';

export function SharedPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const {
    pending,
    sent,
    balances,
    loading: sharedLoading,
    respond,
  } = useSharedExpenses();
  const { groups, loading: groupsLoading } = useGroups();
  const user = useAuthStore((s) => s.user);
  const currency = user?.currency ?? 'ARS';

  const loading = sharedLoading || groupsLoading;

  if (loading && sent.length === 0 && groups.length === 0) {
    return <Spinner className="py-12" />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-white">Compartidos</h1>
          <p className="mt-1 text-sm text-white/50">
            Gastos con amigos y vaquitas grupales
          </p>
        </div>
        {activeTab === 'groups' && (
          <Button onClick={() => navigate('/shared/groups/new')}>
            <PlusCircle className="h-4 w-4" />
            Nueva vaquita
          </Button>
        )}
      </div>

      <FilterPills<Tab>
        value={activeTab}
        onChange={setActiveTab}
        options={[
          {
            value: 'expenses',
            label: 'Gastos compartidos',
            count: pending.length + sent.length,
          },
          {
            value: 'groups',
            label: 'Vaquitas',
            count: groups.length,
          },
        ]}
      />

      {activeTab === 'expenses' ? (
        <div className="space-y-6">
          {pending.length > 0 && (
            <Card
              title="Pendientes"
              action={
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/40">
                  <ArrowLeftRight className="h-3 w-3" />
                  {pending.length}
                </span>
              }
            >
              <SharedNotificationList
                expenses={pending}
                onRespond={respond}
                currentUserId={user?.id ?? ''}
                currency={currency}
              />
            </Card>
          )}

          {balances.length > 0 && (
            <Card title="Balance">
              <div className="flex flex-col gap-2">
                {balances.map((b) => (
                  <BalanceCard
                    key={b.userId}
                    balance={b}
                    currency={currency}
                  />
                ))}
              </div>
            </Card>
          )}

          {sent.length > 0 ? (
            <Card title="Gastos compartidos enviados">
              <div className="flex flex-col gap-3">
                {sent.map((s) => (
                  <SharedTransactionCard
                    key={s.id}
                    shared={s}
                    currency={currency}
                  />
                ))}
              </div>
            </Card>
          ) : (
            pending.length === 0 &&
            balances.length === 0 && (
              <EmptyState
                icon={Bell}
                title="Sin gastos compartidos"
                description="Compartí un gasto desde la lista de transacciones para dividirlo con amigos."
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
              description="Creá una vaquita para dividir gastos grupales con amigos."
              actionLabel="Nueva vaquita"
              onAction={() => navigate('/shared/groups/new')}
            />
          )}
        </div>
      )}
    </div>
  );
}
