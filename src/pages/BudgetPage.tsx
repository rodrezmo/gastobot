import { useEffect, useState } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useBudgetStore } from '@/stores/budgetStore.ts';
import { useCategoryStore } from '@/stores/categoryStore.ts';
import { Spinner } from '@/components/ui/Spinner.tsx';
import { formatCurrency } from '@/utils/formatCurrency.ts';

export function BudgetPage() {
  const { budgets, loading, fetchBudgets, upsertBudget, deleteBudget } = useBudgetStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    void fetchBudgets();
    void fetchCategories();
  }, [fetchBudgets, fetchCategories]);

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const usedCategoryIds = new Set(budgets.map((b) => b.category_id));
  const availableCategories = editingId
    ? expenseCategories
    : expenseCategories.filter((c) => !usedCategoryIds.has(c.id));

  function handleEdit(budget: typeof budgets[number]) {
    setEditingId(budget.id);
    setCategoryId(budget.category_id ?? '');
    setAmount(budget.amount.toString());
  }

  function handleCancelEdit() {
    setEditingId(null);
    setCategoryId('');
    setAmount('');
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = parseFloat(amount);
    if (!categoryId) { setError('Seleccioná una categoría.'); return; }
    if (isNaN(parsed) || parsed <= 0) { setError('El monto debe ser mayor a 0.'); return; }

    setSaving(true);
    try {
      await upsertBudget({ category_id: categoryId, amount: parsed });
      setCategoryId('');
      setAmount('');
      setEditingId(null);
      toast.success('Presupuesto guardado');
    } catch {
      setError('No se pudo guardar el presupuesto.');
      toast.error('Ocurrió un error, intentá de nuevo');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, categoryName: string) {
    if (!window.confirm(`¿Seguro que querés eliminar el presupuesto "${categoryName}"?`)) return;
    try {
      await deleteBudget(id);
      toast.success('Presupuesto eliminado');
    } catch {
      toast.error('Ocurrió un error, intentá de nuevo');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Presupuestos</h1>

      {/* Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
          {editingId ? 'Editar presupuesto' : 'Agregar presupuesto mensual'}
        </h2>
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Categoría
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={!!editingId}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Seleccionar categoría...</option>
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Límite mensual
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">$</span>
              <input
                type="number"
                min="1"
                step="any"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        {!editingId && availableCategories.length === 0 && expenseCategories.length > 0 && (
          <p className="mt-2 text-xs text-slate-400">
            Todas las categorías de gasto ya tienen presupuesto asignado.
          </p>
        )}
      </div>

      {/* List */}
      {loading && budgets.length === 0 ? (
        <Spinner className="py-8" />
      ) : budgets.length === 0 ? (
        <p className="text-center text-sm text-slate-400">No hay presupuestos configurados.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {budgets.map((budget) => (
              <li
                key={budget.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: budget.category.color }}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      {budget.category.name}
                    </p>
                    <p className="text-xs text-slate-400">Mensual</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {formatCurrency(budget.amount)}
                  </span>
                  <button
                    onClick={() => handleEdit(budget)}
                    aria-label="Editar presupuesto"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-500 dark:hover:bg-slate-800"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => void handleDelete(budget.id, budget.category.name)}
                    aria-label="Eliminar presupuesto"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-purple-500/20 bg-purple-500/5 px-5 py-4">
            <span className="text-sm font-semibold text-purple-400">Total presupuestado</span>
            <span className="text-lg font-bold text-slate-200">{formatCurrency(budgets.reduce((s, b) => s + b.amount, 0))}</span>
          </div>
        </>
      )}
    </div>
  );
}
