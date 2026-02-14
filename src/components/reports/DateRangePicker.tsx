import { Input } from '@/components/ui/Input.tsx';

interface DateRangePickerProps {
  dateFrom: string;
  dateTo: string;
  onChange: (from: string, to: string) => void;
}

export function DateRangePicker({ dateFrom, dateTo, onChange }: DateRangePickerProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <Input
        label="Desde"
        type="date"
        value={dateFrom}
        onChange={(e) => onChange(e.target.value, dateTo)}
      />
      <Input
        label="Hasta"
        type="date"
        value={dateTo}
        onChange={(e) => onChange(dateFrom, e.target.value)}
      />
    </div>
  );
}
