import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Select } from '@/components/ui/Select.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { useAuthStore } from '@/stores/authStore.ts';
import { updateProfile, getProfile } from '@/services/authService.ts';
import { supabase } from '@/lib/supabase.ts';

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

  // WhatsApp linking
  const [linkedPhone, setLinkedPhone] = useState<string | null>(null);
  const [linkingCode, setLinkingCode] = useState<string | null>(null);
  const [linkingCodeExpiry, setLinkingCodeExpiry] = useState<Date | null>(null);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');

  // Cargar número vinculado al montar
  useEffect(() => {
    if (!user) return;
    supabase
      .from('phone_links')
      .select('phone')
      .eq('user_id', user.id)
      .not('verified_at', 'is', null)
      .maybeSingle()
      .then(({ data }) => setLinkedPhone(data?.phone ?? null));
  }, [user]);

  const handleGenerateLinkingCode = async () => {
    if (!user) return;
    setWhatsappLoading(true);
    setWhatsappMessage('');
    try {
      // Generar código de 6 dígitos
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

      // Invalidar códigos anteriores no usados
      await supabase
        .from('linking_codes')
        .delete()
        .eq('user_id', user.id)
        .is('used_at', null);

      const { error } = await supabase.from('linking_codes').insert({
        user_id: user.id,
        code,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;
      setLinkingCode(code);
      setLinkingCodeExpiry(expiresAt);
    } catch {
      setWhatsappMessage('Error al generar el código. Intentá de nuevo.');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleUnlinkPhone = async () => {
    if (!user) return;
    setWhatsappLoading(true);
    try {
      await supabase.from('phone_links').delete().eq('user_id', user.id);
      setLinkedPhone(null);
      setLinkingCode(null);
      setWhatsappMessage('Número desvinculado.');
    } catch {
      setWhatsappMessage('Error al desvincular. Intentá de nuevo.');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setMessage('');
    try {
      await updateProfile(user.id, { full_name: fullName, currency });
      const updated = await getProfile(user.id);
      if (updated) useAuthStore.setState({ user: updated });
      setMessage('Perfil actualizado');
      toast.success('Perfil actualizado');
    } catch {
      setMessage('Error al actualizar');
      toast.error('Ocurrió un error, intentá de nuevo');
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ajustes</h1>

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
      <Card title="WhatsApp Bot">
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vinculá tu número de WhatsApp para cargar gastos directamente desde el chat.
          </p>

          {linkedPhone ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg bg-green-50 px-4 py-3 dark:bg-green-900/20">
                <span className="text-xl">✅</span>
                <div>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">Número vinculado</p>
                  <p className="text-sm text-green-600 dark:text-green-500">{linkedPhone}</p>
                </div>
              </div>
              <Button
                onClick={() => void handleUnlinkPhone()}
                loading={whatsappLoading}
                variant="secondary"
              >
                Desvincular número
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {linkingCode ? (
                <div className="space-y-3">
                  <div className="rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50 p-4 text-center dark:border-indigo-600 dark:bg-indigo-900/20">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tu código de vinculación</p>
                    <p className="text-4xl font-bold tracking-widest text-indigo-600 dark:text-indigo-400">
                      {linkingCode}
                    </p>
                    {linkingCodeExpiry && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Expira a las {linkingCodeExpiry.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Mandá este mensaje a{' '}
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        +1 415 523 8886
                      </span>{' '}
                      por WhatsApp:
                    </p>
                    <p className="mt-1 font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      vincular {linkingCode}
                    </p>
                  </div>
                  <Button
                    onClick={() => void handleGenerateLinkingCode()}
                    loading={whatsappLoading}
                    variant="secondary"
                  >
                    Generar nuevo código
                  </Button>
                </div>
              ) : (
                <Button onClick={() => void handleGenerateLinkingCode()} loading={whatsappLoading}>
                  Generar código de vinculación
                </Button>
              )}
            </div>
          )}

          {whatsappMessage && (
            <p className={`text-sm ${whatsappMessage.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
              {whatsappMessage}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
