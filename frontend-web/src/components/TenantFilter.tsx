import { Select } from '@/components/ui';
import type { TenantOption } from '@/hooks/useTenantTable';

interface Props {
  tenants: TenantOption[];
  value: string;
  onChange: (id: string) => void;
}

/** Filtro de tenant para tabelas multi-tenant (federal/estadual/admin). */
export function TenantFilter({ tenants, value, onChange }: Props) {
  return (
    <Select
      className="w-auto min-w-[170px]"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Filtrar por tenant"
    >
      <option value="">Todos os tenants</option>
      {tenants.map((t) => (
        <option key={t.id} value={t.id}>
          {' '.repeat(t.depth * 2)}
          {t.nome}
        </option>
      ))}
    </Select>
  );
}
