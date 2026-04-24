import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { Card } from '@/components/ui/Card.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Select } from '@/components/ui/Select.tsx';
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
        member_ids: members.map((m) => m.id),
        currency,
      });
      navigate('/shared');
    } catch {
      setError('Error al crear la vaquita. Intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate('/shared')}
          className="mt-1 flex h-9 w-9 items-center justify-center rounded-[12px] text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-display text-3xl text-white">Nueva vaquita</h1>
          <p className="mt-1 text-sm text-white/50">
            Creá un grupo para dividir gastos compartidos
          </p>
        </div>
      </div>

      <Card>
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex flex-col gap-4"
        >
          <Input
            label="Nombre del grupo"
            placeholder="Ej: Viaje a Bariloche"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Descripción (opcional)"
            placeholder="Ej: Gastos del viaje de enero..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Select
            label="Moneda"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            options={[
              { value: 'ARS', label: 'ARS · Peso argentino' },
              { value: 'USD', label: 'USD · Dólar' },
              { value: 'EUR', label: 'EUR · Euro' },
              { value: 'BRL', label: 'BRL · Real brasileño' },
              { value: 'CLP', label: 'CLP · Peso chileno' },
              { value: 'UYU', label: 'UYU · Peso uruguayo' },
            ]}
          />

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-medium uppercase tracking-wider text-white/50">
              Miembros
            </label>
            <FriendSearch
              onSelect={handleAddMember}
              excludeIds={members.map((m) => m.id)}
            />
            {members.length > 0 && (
              <div className="mt-2 flex flex-col gap-2">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/[0.03] px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{
                          background: 'var(--grad-primary)',
                          boxShadow: 'var(--shadow-cta)',
                        }}
                      >
                        {(m.full_name || m.nickname)
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white">
                          @{m.nickname}
                          {m.full_name ? (
                            <span className="text-white/40">
                              {' '}
                              · {m.full_name}
                            </span>
                          ) : null}
                        </p>
                        <p className="truncate text-[11px] text-white/40">
                          {m.masked_email}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.id)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-[color:var(--color-red)]"
                      aria-label="Quitar"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div
              className="rounded-[14px] border px-3 py-2.5 text-sm"
              style={{
                backgroundColor: 'rgba(255,71,87,0.08)',
                borderColor: 'rgba(255,71,87,0.2)',
                color: 'var(--color-red)',
              }}
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            loading={submitting}
            disabled={!name.trim()}
            fullWidth
          >
            Crear vaquita
          </Button>
        </form>
      </Card>
    </div>
  );
}
