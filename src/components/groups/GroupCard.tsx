import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge.tsx';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import type { GroupWithMembers } from '@/types/shared.ts';

interface GroupCardProps {
  group: GroupWithMembers;
}

const statusConfig = {
  active: { label: 'Activa', color: '#10b981' },
  settled: { label: 'Liquidada', color: '#6366f1' },
  archived: { label: 'Archivada', color: '#6b7280' },
};

export function GroupCard({ group }: GroupCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/shared/groups/${group.id}`)}
      className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{group.name}</h3>
        <Badge {...statusConfig[group.status]} />
      </div>

      {group.description && (
        <p className="mt-1 text-xs text-gray-500 line-clamp-1">{group.description}</p>
      )}

      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {group.members.length} miembros
        </span>
        <span>{formatCurrency(0, group.currency)}</span>
      </div>
    </button>
  );
}
