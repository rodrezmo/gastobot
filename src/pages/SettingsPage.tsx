import { useState } from 'react';
import {
  AtSign,
  Coins,
  LogOut,
  Mail,
  Palette,
  User as UserIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/Card.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Select } from '@/components/ui/Select.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { ProfileHeroCard } from '@/components/ui/ProfileHeroCard.tsx';
import { SettingsRow } from '@/components/ui/SettingsRow.tsx';
import { useAuthStore } from '@/stores/authStore.ts';
import { useUIStore } from '@/stores/uiStore.ts';
import { updateProfile, getProfile } from '@/services/authService.ts';

const NICKNAME_REGEX = /^[a-z0-9_]{3,20}$/i;

export function SettingsPage() {
  const { user, signOut } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();

  const [editingProfile, setEditingProfile] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [currency, setCurrency] = useState(user?.currency ?? 'ARS');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [nickname, setNickname] = useState('');
  const [nicknameLoading, setNicknameLoading] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState('');
  const [showNicknameForm, setShowNicknameForm] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setMessage('');
    try {
      await updateProfile(user.id, { full_name: fullName, currency });
      const updated = await getProfile(user.id);
      if (updated) useAuthStore.setState({ user: updated });
      setMessage('Perfil actualizado');
      setTimeout(() => setMessage(''), 2000);
      setEditingProfile(false);
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
      setShowNicknameForm(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (
        msg.includes('duplicate') ||
        msg.includes('unique') ||
        msg.includes('idx_profiles_nickname')
      ) {
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

  const currencyLabel =
    ({ ARS: 'Peso Argentino', USD: 'Dólar', EUR: 'Euro' }[currency] ?? currency) +
    ` (${currency})`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-white">Configuración</h1>
        <p className="mt-1 text-sm text-white/50">Tu cuenta y preferencias</p>
      </div>

      <ProfileHeroCard
        fullName={user?.full_name}
        email={user?.email}
        nickname={user?.nickname}
        avatarUrl={user?.avatar_url}
      />

      {/* Cuenta */}
      <Card title="Cuenta" padding="sm">
        <ul className="flex flex-col">
          <SettingsRow
            icon={Mail}
            label="Email"
            sublabel={user?.email ?? ''}
            color="#5352ED"
          />
          <SettingsRow
            icon={UserIcon}
            label="Nombre"
            sublabel={user?.full_name ?? 'Sin definir'}
            color="#FFA502"
            onClick={() => setEditingProfile((v) => !v)}
          />
          <SettingsRow
            icon={AtSign}
            label="Nickname"
            sublabel={
              user?.nickname
                ? `@${user.nickname} (inmutable)`
                : 'Sin definir'
            }
            color="#2ED573"
            onClick={
              user?.nickname ? undefined : () => setShowNicknameForm((v) => !v)
            }
          />
          <SettingsRow
            icon={Coins}
            label="Moneda"
            sublabel={currencyLabel}
            color="#FF4757"
            onClick={() => setEditingProfile((v) => !v)}
          />
        </ul>

        {editingProfile && (
          <div className="mt-4 flex flex-col gap-3 rounded-[14px] border border-white/10 bg-white/[0.03] p-4">
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
                { value: 'USD', label: 'Dólar (USD)' },
                { value: 'EUR', label: 'Euro (EUR)' },
              ]}
            />
            {message && (
              <p
                className="text-xs"
                style={{
                  color: message.includes('Error')
                    ? 'var(--color-red)'
                    : 'var(--color-green)',
                }}
              >
                {message}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingProfile(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                loading={loading}
                onClick={() => void handleSave()}
              >
                Guardar
              </Button>
            </div>
          </div>
        )}

        {showNicknameForm && !user?.nickname && (
          <div className="mt-4 flex flex-col gap-3 rounded-[14px] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-white/60">
              Tu nickname es público y te permite compartir gastos con otros. Una
              vez definido, no puede cambiarse.
            </p>
            <Input
              label="Nickname"
              placeholder="ej: juancho"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.toLowerCase())}
              leftSlot={<AtSign className="h-4 w-4" />}
              hint="Solo letras, números y guión bajo. Entre 3 y 20 caracteres."
            />
            {nicknameMessage && (
              <p
                className="text-xs"
                style={{
                  color:
                    nicknameMessage.includes('guardado') ||
                    nicknameMessage.includes('¡')
                      ? 'var(--color-green)'
                      : 'var(--color-red)',
                }}
              >
                {nicknameMessage}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNicknameForm(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                loading={nicknameLoading}
                disabled={nickname.trim().length < 3}
                onClick={() => void handleSaveNickname()}
              >
                Guardar nickname
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Apariencia */}
      <Card title="Apariencia" padding="sm">
        <SettingsRow
          icon={Palette}
          label="Tema"
          sublabel={theme === 'dark' ? 'Oscuro' : 'Claro'}
          color="#5352ED"
          onClick={toggleTheme}
          right={
            <span className="text-xs text-white/40">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          }
          showArrow
        />
      </Card>

      {/* Sesión */}
      <Card padding="sm">
        <SettingsRow
          icon={LogOut}
          label="Cerrar sesión"
          onClick={() => void signOut()}
          danger
        />
      </Card>
    </div>
  );
}
