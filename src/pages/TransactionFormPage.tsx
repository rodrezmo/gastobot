import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card.tsx';
import { Spinner } from '@/components/ui/Spinner.tsx';
import { TransactionForm } from '@/components/transactions/TransactionForm.tsx';
import { useTransactionStore } from '@/stores/transactionStore.ts';
import { useCategoryStore } from '@/stores/categoryStore.ts';
import { getTransaction } from '@/services/transactionService.ts';
import type { TransactionWithCategory } from '@/types/database.ts';

export function TransactionFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { addTransaction, updateTransaction } = useTransactionStore();
  const { fetchCategories } = useCategoryStore();
  const [existing, setExisting] = useState<TransactionWithCategory | null>(null);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    void fetchCategories();
    if (id) {
      void getTransaction(id)
        .then(setExisting)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id, fetchCategories]);

  if (loading) return <Spinner className="py-12" />;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {isEdit ? 'Editar transaccion' : 'Nueva transaccion'}
      </h1>
      <Card>
        <TransactionForm
          initialValues={
            existing
              ? {
                  category_id: existing.category_id,
                  amount: existing.amount,
                  type: existing.type,
                  description: existing.description ?? undefined,
                  date: existing.date,
                }
              : undefined
          }
          onSubmit={async (params) => {
            if (id) {
              await updateTransaction(id, params);
            } else {
              await addTransaction(params);
            }
          }}
          submitLabel={isEdit ? 'Guardar cambios' : 'Agregar transaccion'}
          isEdit={isEdit}
        />
      </Card>
    </div>
  );
}
