import { useState } from 'react';
import { Link } from 'react-router-dom';
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
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Cuenta creada</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Te enviamos un email a <strong>{email}</strong>. Revisa tu bandeja de entrada y hace click en el link para verificar tu cuenta.
        </p>
        <Link to="/login" className="mt-4 inline-block text-sm text-primary-600 hover:underline">
          Ir a iniciar sesion
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Crear cuenta</h2>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <Input
        label="Nombre completo"
        type="text"
        placeholder="Juan Perez"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />

      <Input
        label="Email"
        type="email"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Input
        label="Contrasena"
        type="password"
        placeholder="Minimo 6 caracteres"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
      />

      <Button type="submit" loading={loading} className="w-full">
        Registrarse
      </Button>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Ya tenes cuenta?{' '}
        <Link to="/login" className="text-primary-600 hover:underline">
          Iniciar sesion
        </Link>
      </p>
    </form>
  );
}
