import { useState } from 'react';
import { Card } from '@/components/ui/Card.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Select } from '@/components/ui/Select.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { useAuthStore } from '@/stores/authStore.ts';
import { updateProfile, getProfile } from '@/services/authService.ts';

const NICKNAME_REGEX = /^[a-z0-9_]{3,20}$/i;

export function SettingsPage() {
  const { user } = useAuthStore();
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [currency, setCurrency] = useState(user?.currency ?? 'ARS');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [nickname, setNickname] = useState('');
  const [nicknameLoading, setNicknameLoading] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState('');

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setMessage('');
    try {
      await updateProfile(user.id, { full_name: fullName, currency });
      const updated = await getProfile(user.id);
      if (updated) useAuthStore.setState({ user: updated });
      setMessage('Perfil actualizado');
    } catch {
      setMessage('Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNickname = async () => {
    if (!user) return;
    const trimmed = nickname.trim().toLowerCase();
    if (!NICKNAME_REGEX.test(trimmed)) {
      setNicknameMessage('Solo letras, números y guión bajo. Entre 3 y 20 caracteres.');
      return;
    }
    setNicknameLoading(true);
    setNicknameMessage('');
    try {
      await updateProfile(user.id, { nickname: trimmed });
      const updated = await getProfile(user.id);
      if (updated) useAuthStore.setState({ user: updated });
      setNicknameMessage('¡Nickname guardado!');
      setNickname('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('idx_profiles_nickname')) {
        setNicknameMessage('Ese nickname ya está en uso. Probá con otro.');
      } else if (msg.includes('no se puede cambiar')) {
        setNicknameMessage('El nickname no se puede cambiar una vez definido.');
      } else {
        setNicknameMessage('Error al guardar el nickname.');
      }
    } finally {
      setNicknameLoading(false);
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

      <Card title="@Nickname">
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tu nickname es público y te permite compartir gastos con otros usuarios. Una vez
            definido, no puede cambiarse.
          </p>

          {user?.nickname ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-700">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">@</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {user.nickname}
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                El nickname no se puede cambiar una vez definido.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="ej: juancho"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value.toLowerCase())}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Solo letras, números y guión bajo. Entre 3 y 20 caracteres.
              </p>

              {nicknameMessage && (
                <p
                  className={`text-sm ${nicknameMessage.includes('Error') || nicknameMessage.includes('ya está') || nicknameMessage.includes('Solo') ? 'text-red-500' : 'text-green-600'}`}
                >
                  {nicknameMessage}
                </p>
              )}

              <Button
                onClick={() => void handleSaveNickname()}
                loading={nicknameLoading}
                disabled={nickname.trim().length < 3}
              >
                Guardar nickname
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
