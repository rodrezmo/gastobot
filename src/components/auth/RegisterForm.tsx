import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Check } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';

export function RegisterForm() {
  const { signUp } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            backgroundColor: 'rgba(46, 213, 115, 0.12)',
            color: 'var(--color-green)',
          }}
        >
          <Check className="h-6 w-6" strokeWidth={2.5} />
        </div>
        <h2 className="font-display text-2xl text-white">Cuenta creada</h2>
        <p className="text-sm text-white/50">
          Te enviamos un email a <strong className="text-white">{email}</strong>. Revisá
          tu bandeja de entrada y hacé click en el link para verificar tu cuenta.
        </p>
        <Link
          to="/login"
          className="text-grad-primary mt-4 inline-block text-sm font-semibold hover:brightness-110"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      <div>
        <h2 className="font-display text-2xl text-white">Crear cuenta</h2>
        <p className="mt-1 text-sm text-white/50">Registrate en segundos</p>
      </div>

      {error && (
        <div
          className="rounded-[12px] border px-3 py-2.5 text-sm"
          style={{
            backgroundColor: 'rgba(255, 71, 87, 0.08)',
            borderColor: 'rgba(255, 71, 87, 0.25)',
            color: 'var(--color-red)',
          }}
        >
          {error}
        </div>
      )}

      <Input
        label="Nombre completo"
        type="text"
        placeholder="Juan Pérez"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        leftSlot={<User className="h-4 w-4" />}
        required
      />

      <Input
        label="Email"
        type="email"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        leftSlot={<Mail className="h-4 w-4" />}
        required
      />

      <Input
        label="Contraseña"
        type="password"
        placeholder="Mínimo 6 caracteres"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leftSlot={<Lock className="h-4 w-4" />}
        required
        minLength={6}
      />

      <Button type="submit" loading={loading} fullWidth size="lg">
        Registrarse
      </Button>

      <p className="text-center text-sm text-white/50">
        ¿Ya tenés cuenta?{' '}
        <Link
          to="/login"
          className="text-grad-primary font-semibold hover:brightness-110"
        >
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
