import { useNavigate } from 'react-router-dom';
import { PiggyBank, Plus } from 'lucide-react';
import { cn } from '@/utils/cn.ts';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import type { SavingsGoalWithStats } from '@/types/database.ts';

interface SavingsWidgetProps {
  totalSavedArs: number;
  totalSavedUsd: number;
  goals: SavingsGoalWithStats[];
}

export function SavingsWidget({ totalSavedArs, totalSavedUsd, goals }: SavingsWidgetProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PiggyBank className="h-4 w-4 text-emerald-500" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ahorros</h2>
        </div>
        <button
          onClick={() => navigate('/savings')}
          className="flex items-center gap-1 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
          title="Agregar objetivo"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-400">ARS</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalSavedArs)}</p>
        </div>
        {totalSavedUsd > 0 && (
          <div className="flex-1 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-blue-400">USD</p>
            <p className="text-xl font-bold text-blue-400">{formatCurrency(totalSavedUsd, 'USD')}</p>
          </div>
        )}
      </div>

      {goals.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-purple-500/30 bg-purple-500/5 py-6 text-center">
          <span className="text-3xl">🎯</span>
          <p className="mt-2 text-sm font-semibold text-purple-400">Definí tu primer objetivo de ahorro</p>
          <p className="mt-1 text-xs text-slate-500">Ej: Vacaciones, Auto, Fondo de emergencia</p>
          <button
            onClick={() => navigate('/savings')}
            className="mt-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white"
          >
            + Crear objetivo
          </button>
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {goals.map((goal) => {
            const pct = goal.percentage !== null ? Math.min(goal.percentage, 100) : null;
            const isReached = goal.percentage !== null && goal.percentage >= 100;

            return (
              <li key={goal.id}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {goal.name}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {goal.target_amount !== null
                      ? `${formatCurrency(totalSavedArs)} / ${formatCurrency(goal.target_amount)}`
                      : formatCurrency(totalSavedArs)}
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  {pct !== null ? (
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  ) : (
                    <div className="h-full w-1/3 animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full bg-emerald-400 opacity-60" />
                  )}
                </div>

                {goal.target_date || goal.months_to_goal !== null || isReached ? (
                  <p className={cn('mt-1 text-xs', isReached ? 'text-emerald-500' : 'text-slate-400')}>
                    {isReached
                      ? '¡Meta alcanzada!'
                      : goal.months_to_goal !== null
                        ? `Proyección: ${goal.months_to_goal} mes${goal.months_to_goal === 1 ? '' : 'es'}`
                        : null}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
