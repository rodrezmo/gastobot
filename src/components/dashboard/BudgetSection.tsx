import { ChevronRight, Target } from 'lucide-react';
import { Card } from '@/components/ui/Card.tsx';
import { BudgetBar } from '@/components/ui/BudgetBar.tsx';
import { EmptyState } from '@/components/ui/EmptyState.tsx';

export interface BudgetItem {
  id: string;
  label: string;
  spent: number;
  limit: number;
  color?: string;
  currency?: string;
}

interface BudgetSectionProps {
  budgets: BudgetItem[];
  /** Cantidad máxima a listar. Default 4. */
  limit?: number;
  onSeeAll?: () => void;
}

export function BudgetSection({
  budgets,
  limit = 4,
  onSeeAll,
}: BudgetSectionProps) {
  return (
    <Card
      title="Presupuestos"
      action={
        onSeeAll && budgets.length > 0 ? (
          <button
            type="button"
            onClick={onSeeAll}
            className="flex items-center gap-0.5 text-xs font-medium text-white/60 transition-colors hover:text-white"
          >
            Ver todos
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ) : undefined
      }
    >
      {budgets.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Sin presupuestos"
          description="Definí límites por categoría para controlar tus gastos"
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {budgets.slice(0, limit).map((b) => (
            <li key={b.id}>
              <BudgetBar
                label={b.label}
                spent={b.spent}
                limit={b.limit}
                color={b.color}
                currency={b.currency}
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
