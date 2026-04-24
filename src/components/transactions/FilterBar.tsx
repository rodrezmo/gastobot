import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input.tsx';
import { Select } from '@/components/ui/Select.tsx';
import { useCategoryStore } from '@/stores/categoryStore.ts';
import type { TransactionFilters } from '@/types/api.ts';

interface FilterBarProps {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const { categories } = useCategoryStore();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar transacciones..."
          value={filters.search ?? ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
          className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      <Select
        value={filters.type ?? ''}
        onChange={(e) =>
          onChange({
            ...filters,
            type: (e.target.value as TransactionFilters['type']) || undefined,
          })
        }
        options={[
          { value: '', label: 'Todos los tipos' },
          { value: 'expense', label: 'Gastos' },
          { value: 'income', label: 'Ingresos' },
        ]}
      />

      <Select
        value={filters.category_id ?? ''}
        onChange={(e) =>
          onChange({ ...filters, category_id: e.target.value || undefined })
        }
        options={[
          { value: '', label: 'Todas las categorías' },
          ...categories.map((c) => ({ value: c.id, label: c.name })),
        ]}
      />

      <Input
        type="date"
        value={filters.date_from ?? ''}
        onChange={(e) => onChange({ ...filters, date_from: e.target.value || undefined })}
      />
      <Input
        type="date"
        value={filters.date_to ?? ''}
        onChange={(e) => onChange({ ...filters, date_to: e.target.value || undefined })}
      />
    </div>
  );
}
