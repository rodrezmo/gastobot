import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(dateStr: string, fmt = 'dd MMM yyyy'): string {
  return format(parseISO(dateStr), fmt, { locale: es });
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'dd/MM/yy', { locale: es });
}
