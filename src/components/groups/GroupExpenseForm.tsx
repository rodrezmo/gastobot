import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/Input.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { format } from 'date-fns';
import type { AddGroupExpenseParams } from '@/types/shared.ts';

interface GroupExpenseFormProps {
  groupId: string;
  onSubmit: (params: AddGroupExpenseParams) => Promise<void>;
}

export function GroupExpenseForm({ groupId, onSubmit }: GroupExpenseFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    setSubmitting(true);
    try {
      await onSubmit({
        group_id: groupId,
        description,
        amount: parseFloat(amount),
        date,
      });
      setDescription('');
      setAmount('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_160px_auto] sm:items-end"
    >
      <Input
        label="Descripción"
        placeholder="Ej: Supermercado..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <Input
        label="Monto"
        type="number"
        min={0.01}
        step={0.01}
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <Input
        label="Fecha"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <Button
        type="submit"
        loading={submitting}
        disabled={!description || !amount}
      >
        <Plus className="h-4 w-4" />
        Agregar
      </Button>
    </form>
  );
}
