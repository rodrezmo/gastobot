import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { SearchBox } from '@/components/ui/SearchBox.tsx';
import { FilterPills } from '@/components/ui/FilterPills.tsx';
import { Select } from '@/components/ui/Select.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { useCategoryStore } from '@/stores/categoryStore.ts';
import { cn } from '@/utils/cn.ts';
import type { TransactionFilters } from '@/types/api.ts';

type TypeFilter = 'all' | 'expense' | 'income';

interface FilterBarProps {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
  counts?: { all: number; expense: number; income: number };
}

export function FilterBar({ filters, onChange, counts }: FilterBarProps) {
  const { categories } = useCategoryStore();
  const [expanded, setExpanded] = useState(false);

  const typeValue: TypeFilter = filters.type ?? 'all';

  const hasSecondaryFilters =
    Boolean(filters.category_id) ||
    Boolean(filters.date_from) ||
    Boolean(filters.date_to);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <SearchBox
          value={filters.search ?? ''}
          onChange={(v) => onChange({ ...filters, search: v || undefined })}
          placeholder="Buscar transacciones…"
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label="Más filtros"
          className={cn(
            'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border transition-colors',
            expanded || hasSecondaryFilters
              ? 'border-white/20 bg-white/[0.06] text-white'
              : 'border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.06] hover:text-white',
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {hasSecondaryFilters && (
            <span
              className="absolute right-2 top-2 h-2 w-2 rounded-full"
              style={{ backgroundColor: 'var(--color-coral)' }}
            />
          )}
        </button>
      </div>

      <FilterPills
        value={typeValue}
        onChange={(v) =>
          onChange({
            ...filters,
            type: v === 'all' ? undefined : (v as 'expense' | 'income'),
          })
        }
        options={[
          { value: 'all', label: 'Todos', count: counts?.all },
          { value: 'expense', label: 'Gastos', count: counts?.expense },
          { value: 'income', label: 'Ingresos', count: counts?.income },
        ]}
      />

      {expanded && (
        <div
          className="grid gap-3 rounded-[16px] border p-3 sm:grid-cols-3"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <Select
            value={filters.category_id ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                category_id: e.target.value || undefined,
              })
            }
            options={[
              { value: '', label: 'Todas las categorías' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <Input
            type="date"
            value={filters.date_from ?? ''}
            onChange={(e) =>
              onChange({ ...filters, date_from: e.target.value || undefined })
            }
          />
          <Input
            type="date"
            value={filters.date_to ?? ''}
            onChange={(e) =>
              onChange({ ...filters, date_to: e.target.value || undefined })
            }
          />
          {hasSecondaryFilters && (
            <button
              type="button"
              onClick={() =>
                onChange({
                  search: filters.search,
                  type: filters.type,
                })
              }
              className="col-span-full inline-flex items-center gap-1.5 self-start text-xs font-medium text-white/60 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
