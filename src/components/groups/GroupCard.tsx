import { useNavigate } from 'react-router-dom';
import { Users, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge.tsx';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import type { GroupWithMembers } from '@/types/shared.ts';

interface GroupCardProps {
  group: GroupWithMembers;
}

const statusConfig = {
  active: { label: 'Activa', color: '#2ED573' },
  settled: { label: 'Liquidada', color: '#5352ED' },
  archived: { label: 'Archivada', color: '#8A8A99' },
};

export function GroupCard({ group }: GroupCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/shared/groups/${group.id}`)}
      className="shadow-card group relative w-full overflow-hidden rounded-[18px] border p-4 text-left transition-colors hover:bg-white/[0.04]"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-20"
        style={{ background: 'var(--grad-primary)' }}
      />

      <div className="relative flex items-start justify-between gap-2">
        <h3 className="min-w-0 truncate text-sm font-semibold text-white">
          {group.name}
        </h3>
        <Badge {...statusConfig[group.status]} />
      </div>

      {group.description && (
        <p className="relative mt-1 line-clamp-1 text-xs text-white/50">
          {group.description}
        </p>
      )}

      <div className="relative mt-4 flex items-center justify-between text-xs text-white/50">
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {group.members.length} miembro{group.members.length !== 1 ? 's' : ''}
        </span>
        <span className="tabular-nums text-white/70">
          {formatCurrency(0, group.currency)}
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 text-white/30 transition-colors group-hover:text-white" />
      </div>
    </button>
  );
}
