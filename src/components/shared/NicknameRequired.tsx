import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export function NicknameRequired() {
  const navigate = useNavigate();
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <div className="flex-1">
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Necesitás un @nickname para usar esta función.
        </p>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="mt-1 text-sm font-medium text-amber-700 underline dark:text-amber-400"
        >
          Ir a Configuración →
        </button>
      </div>
    </div>
  );
}
