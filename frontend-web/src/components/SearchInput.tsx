import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

/** Campo de busca por nome para listas. */
export function SearchInput({ value, onChange, placeholder = 'Buscar…', className }: Props) {
  return (
    <div className={cn('relative', className)}>
      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
      <input
        className="input h-9 w-full pl-8 pr-7"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary"
          aria-label="Limpar busca"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
