import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Select } from '@/components/ui/Select.tsx';
import { useCategoryStore } from '@/stores/categoryStore.ts';
import type { TransactionType } from '@/types/database.ts';
import type { CreateTransactionParams } from '@/types/api.ts';

interface TransactionFormProps {
  initialValues?: Partial<CreateTransactionParams> & { type?: TransactionType };
  onSubmit: (params: CreateTransactionParams) => Promise<void>;
  submitLabel: string;
}

export function TransactionForm({ initialValues, onSubmit, submitLabel }: TransactionFormProps) {
  const navigate = useNavigate();
  const { categories } = useCategoryStore();
  const [type, setType] = useState<TransactionType>(initialValues?.type ?? 'expense');
  const [categoryId, setCategoryId] = useState(initialValues?.category_id ?? '');
  const [amount, setAmount] = useState(initialValues?.amount?.toString() ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [date, setDate] = useState(initialValues?.date ?? new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit({
        category_id: categoryId,
        amount: parseFloat(amount),
        type,
        description: description || undefined,
        date,
      });
      navigate('/transactions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            type === 'expense'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
          }`}
        >
          Gasto
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            type === 'income'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
          }`}
        >
          Ingreso
        </button>
      </div>

      <Input
        label="Monto"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />

      <Select
        label="Categoria"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={[
          { value: '', label: 'Seleccionar categoria...' },
          ...filteredCategories.map((c) => ({ value: c.id, label: c.name })),
        ]}
        required
      />

      <Input
        label="Descripcion"
        type="text"
        placeholder="Descripcion opcional"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Input
        label="Fecha"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          {submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
