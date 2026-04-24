import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { hexToRgba } from '@/utils/color.ts';

export function NicknameRequired() {
  const navigate = useNavigate();
  const amber = '#FFA502';
  return (
    <div
      className="flex items-start gap-3 rounded-[14px] border p-3"
      style={{
        backgroundColor: hexToRgba(amber, 0.08),
        borderColor: hexToRgba(amber, 0.2),
      }}
    >
      <AlertTriangle
        className="mt-0.5 h-4 w-4 shrink-0"
        style={{ color: amber }}
      />
      <div className="flex-1">
        <p className="text-sm" style={{ color: amber }}>
          Necesitás un @nickname para usar esta función.
        </p>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="mt-1 inline-flex items-center gap-1 text-xs font-medium underline-offset-2 hover:underline"
          style={{ color: amber }}
        >
          Ir a Configuración
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
