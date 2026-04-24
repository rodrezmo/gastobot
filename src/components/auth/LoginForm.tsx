import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';

export function LoginForm() {
  const { signIn } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      <div>
        <h2 className="font-display text-2xl text-white">Bienvenido de nuevo</h2>
        <p className="mt-1 text-sm text-white/50">Ingresá con tu cuenta</p>
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
        placeholder="Tu contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leftSlot={<Lock className="h-4 w-4" />}
        required
      />

      <Button type="submit" loading={loading} fullWidth size="lg">
        Iniciar sesión
      </Button>

      <p className="text-center text-sm text-white/50">
        ¿No tenés cuenta?{' '}
        <Link
          to="/register"
          className="text-grad-primary font-semibold hover:brightness-110"
        >
          Registrate
        </Link>
      </p>
    </form>
  );
}
