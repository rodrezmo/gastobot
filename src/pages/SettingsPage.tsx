import { useState } from 'react';
import { Card } from '@/components/ui/Card.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Select } from '@/components/ui/Select.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { useAuthStore } from '@/stores/authStore.ts';
import { updateProfile } from '@/services/authService.ts';

export function SettingsPage() {
  const { user } = useAuthStore();
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [currency, setCurrency] = useState(user?.currency ?? 'ARS');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setMessage('');
    try {
      await updateProfile(user.id, { full_name: fullName, currency });
      setMessage('Perfil actualizado');
    } catch {
      setMessage('Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configuracion</h1>

      <Card title="Perfil">
        <div className="space-y-4">
          <Input label="Email" type="email" value={user?.email ?? ''} disabled />

          <Input
            label="Nombre completo"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <Select
            label="Moneda"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            options={[
              { value: 'ARS', label: 'Peso Argentino (ARS)' },
              { value: 'USD', label: 'Dolar (USD)' },
              { value: 'EUR', label: 'Euro (EUR)' },
            ]}
          />

          {message && (
            <p
              className={`text-sm ${message.includes('Error') ? 'text-red-500' : 'text-green-600'}`}
            >
              {message}
            </p>
          )}

          <Button onClick={() => void handleSave()} loading={loading}>
            Guardar cambios
          </Button>
        </div>
      </Card>
    </div>
  );
}
