import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PiggyBank, Pencil, Trash2, Info, Plus } from 'lucide-react';
import { useSavingsStore } from '@/stores/savingsStore.ts';
import { Spinner } from '@/components/ui/Spinner.tsx';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import type { UpsertSavingsGoalParams, RecordSavingsParams } from '@/types/api.ts';
import type { SavingsGoalWithStats } from '@/types/database.ts';

const EMPTY_FORM: UpsertSavingsGoalParams = { name: '', target_amount: null, target_date: null };

const EMPTY_SAVINGS: RecordSavingsParams = {
  currency: 'USD',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  description: '',
  ars_cost: undefined,
};

export function SavingsPage() {
  const { totalSavedArs, totalSavedUsd, goals, loading, error, fetchSummary, upsertGoal, deleteGoal, recordSavings } = useSavingsStore();

  // Form: registrar ahorro
  const [savingsForm, setSavingsForm] = useState<RecordSavingsParams>(EMPTY_SAVINGS);
  const [showArsCost, setShowArsCost] = useState(false);
  const [recordingEntry, setRecordingEntry] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);

  // Form: objetivos
  const [form, setForm] = useState<UpsertSavingsGoalParams>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  async function handleRecordEntry(e: React.FormEvent) {
    e.preventDefault();
    setEntryError(null);
    if (!savingsForm.amount || savingsForm.amount <= 0) {
      setEntryError('El monto debe ser mayor a 0.');
      return;
    }
    setRecordingEntry(true);
    try {
      await recordSavings({
        ...savingsForm,
        ars_cost: showArsCost ? savingsForm.ars_cost : undefined,
      });
      setSavingsForm(EMPTY_SAVINGS);
      setShowArsCost(false);
      toast.success('Ahorro registrado');
    } catch {
      setEntryError('No se pudo registrar el ahorro.');
      toast.error('Ocurrió un error, intentá de nuevo');
    } finally {
      setRecordingEntry(false);
    }
  }

  function startEdit(goal: SavingsGoalWithStats) {
    setEditingId(goal.id);
    setForm({
      id: goal.id,
      name: goal.name,
      target_amount: goal.target_amount,
      target_date: goal.target_date,
    });
    setFormError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError('El nombre es requerido.');
      return;
    }

    setSaving(true);
    try {
      await upsertGoal(form);
      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch {
      setFormError('No se pudo guardar el objetivo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteGoal(id);
    } catch {
      // silently fail
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl bg-emerald-50 p-6 dark:bg-emerald-900/20">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
            <PiggyBank className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">ARS</p>
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(totalSavedArs)}
              </p>
            </div>
            {totalSavedUsd > 0 && (
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400">USD</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency(totalSavedUsd, 'USD')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form: Registrar ahorro */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <Plus className="h-4 w-4 text-emerald-500" />
          Registrar ahorro
        </h2>
        <form onSubmit={(e) => void handleRecordEntry(e)} className="space-y-3">
          {/* Selector de moneda */}
          <div className="flex gap-2">
            {(['USD', 'ARS'] as const).map((cur) => (
              <button
                key={cur}
                type="button"
                onClick={() => {
                  setSavingsForm((f) => ({ ...f, currency: cur }));
                  if (cur === 'ARS') setShowArsCost(false);
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                  savingsForm.currency === cur
                    ? cur === 'USD'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {cur}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Monto en {savingsForm.currency} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                placeholder="0"
                value={savingsForm.amount || ''}
                onChange={(e) => setSavingsForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Fecha</label>
              <input
                type="date"
                value={savingsForm.date}
                onChange={(e) => setSavingsForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Descripción <span className="text-slate-400">(opcional)</span></label>
            <input
              type="text"
              placeholder="Ej: Compra dólar MEP, ahorro mensual…"
              value={savingsForm.description ?? ''}
              onChange={(e) => setSavingsForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Costo en ARS — solo para USD */}
          {savingsForm.currency === 'USD' && (
            <div className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowArsCost((v) => !v)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  showArsCost
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                    : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                <span>Usé ARS para comprarlo</span>
                <span className="text-xs">{showArsCost ? 'Sí' : 'No / recibí USD'}</span>
              </button>
              {showArsCost && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Monto ARS gastado <span className="text-slate-400">(se descuenta del balance)</span>
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    placeholder="0"
                    value={savingsForm.ars_cost ?? ''}
                    onChange={(e) => setSavingsForm((f) => ({ ...f, ars_cost: parseFloat(e.target.value) || undefined }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              )}
            </div>
          )}

          {entryError && <p className="text-xs text-red-500">{entryError}</p>}

          <button
            type="submit"
            disabled={recordingEntry}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {recordingEntry ? 'Guardando...' : 'Registrar'}
          </button>
        </form>
      </div>

      {/* Nota informativa */}
      <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Los ahorros se calculan desde tus transacciones con categoría <strong>Ahorro</strong>. Las compras de USD en ARS se descuentan del balance en pesos.
        </p>
      </div>

      {/* Formulario */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
          {editingId ? 'Editar objetivo' : 'Nuevo objetivo de ahorro'}
        </h2>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Vacaciones, Fondo de emergencia…"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Monto objetivo <span className="text-slate-400">(opcional)</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                placeholder="0"
                value={form.target_amount ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    target_amount: e.target.value ? parseFloat(e.target.value) : null,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Fecha objetivo <span className="text-slate-400">(opcional)</span>
              </label>
              <input
                type="date"
                value={form.target_date ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, target_date: e.target.value || null }))
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {formError && <p className="text-xs text-red-500">{formError}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lista de goals */}
      {loading && goals.length === 0 ? (
        <Spinner className="py-8" />
      ) : error ? (
        <p className="text-center text-sm text-red-500">{error}</p>
      ) : goals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center dark:border-slate-700">
          <PiggyBank className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Todavía no tenés objetivos. ¡Creá uno!
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {goals.map((goal) => {
            const pct = goal.percentage !== null ? Math.min(goal.percentage, 100) : null;
            const isReached = goal.percentage !== null && goal.percentage >= 100;

            return (
              <li
                key={goal.id}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">{goal.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {goal.target_amount !== null
                        ? `${formatCurrency(totalSavedArs)} / ${formatCurrency(goal.target_amount)}`
                        : `Total: ${formatCurrency(totalSavedArs)}`}
                      {goal.target_date && (
                        <span className="ml-2">
                          · Fecha: {new Date(goal.target_date).toLocaleDateString('es-AR')}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => startEdit(goal)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => void handleDelete(goal.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                {goal.target_amount !== null && (
                  <>
                    <div className="mb-1 flex justify-between text-xs">
                      <span
                        className={
                          isReached
                            ? 'font-semibold text-emerald-500'
                            : 'text-slate-500 dark:text-slate-400'
                        }
                      >
                        {isReached ? '¡Meta alcanzada!' : `${(goal.percentage ?? 0).toFixed(0)}%`}
                      </span>
                      {!isReached && goal.months_to_goal !== null && (
                        <span className="text-slate-400">
                          Proyección: {goal.months_to_goal} mes{goal.months_to_goal === 1 ? '' : 'es'}
                        </span>
                      )}
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${pct ?? 0}%` }}
                      />
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
