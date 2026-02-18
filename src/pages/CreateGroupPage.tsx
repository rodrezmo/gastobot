import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { Card } from '@/components/ui/Card.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { FriendSearch } from '@/components/shared/FriendSearch.tsx';
import { useGroupStore } from '@/stores/groupStore.ts';
import type { UserSearchResult } from '@/types/shared.ts';

export function CreateGroupPage() {
  const navigate = useNavigate();
  const createGroup = useGroupStore((s) => s.createGroup);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [members, setMembers] = useState<UserSearchResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAddMember = (user: UserSearchResult) => {
    if (members.find((m) => m.id === user.id)) return;
    setMembers([...members, user]);
  };

  const handleRemoveMember = (userId: string) => {
    setMembers(members.filter((m) => m.id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        member_emails: members.map((m) => m.email),
        currency,
      });
      navigate('/shared');
    } catch {
      setError('Error al crear la vaquita. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/shared')}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nueva vaquita</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre del grupo"
            placeholder="Ej: Viaje a Bariloche"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Descripcion (opcional)"
            placeholder="Ej: Gastos del viaje de enero..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Moneda
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="ARS">ARS - Peso argentino</option>
              <option value="USD">USD - Dólar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="BRL">BRL - Real brasileño</option>
              <option value="CLP">CLP - Peso chileno</option>
              <option value="UYU">UYU - Peso uruguayo</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Miembros
            </label>
            <FriendSearch
              onSelect={handleAddMember}
              excludeIds={members.map((m) => m.id)}
            />
            {members.length > 0 && (
              <div className="mt-3 space-y-2">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700/50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                        {(m.full_name || m.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {m.full_name || m.email}
                        </p>
                        <p className="text-xs text-gray-500">{m.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.id)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" loading={submitting} disabled={!name.trim()} className="w-full">
            Crear vaquita
          </Button>
        </form>
      </Card>
    </div>
  );
}
