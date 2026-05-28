import { useState, useRef, useEffect, useMemo } from 'react';
import { Building2, ChevronDown, Check, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTenantHierarquia, type TenantNodeDTO } from '@/hooks/useTenants';
import { useTenantStore } from '@/store/tenantStore';
import { queryClient } from '@/lib/queryClient';

interface FlatTenant {
  id: string;
  nome: string;
  tipo: TenantNodeDTO['tipo'];
  depth: number;
}

function flatten(node: TenantNodeDTO, depth = 0, acc: FlatTenant[] = []): FlatTenant[] {
  acc.push({ id: node.id, nome: node.nome, tipo: node.tipo, depth });
  node.filhos.forEach((f) => flatten(f, depth + 1, acc));
  return acc;
}

const TIPO_COLOR: Record<TenantNodeDTO['tipo'], string> = {
  FEDERAL: '#3B82F6',
  ESTADUAL: '#8B5CF6',
  MUNICIPAL: '#22C55E',
};

export function TenantSwitcher() {
  const { data: root } = useTenantHierarquia();
  const { activeTenantId, activeTenantName, setActiveTenant } = useTenantStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const tenants = useMemo(() => (root ? flatten(root) : []), [root]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Só faz sentido para usuários multi-tenant (mais de um tenant visível).
  if (tenants.length <= 1) return null;

  function choose(id: string | null, name: string | null) {
    setActiveTenant(id, name);
    setOpen(false);
    // Reescopa todos os dados já carregados sob o novo tenant ativo.
    queryClient.invalidateQueries();
  }

  const label = activeTenantId ? activeTenantName : 'Todos os tenants';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-[12px] font-medium text-ink-secondary transition-colors hover:text-white"
      >
        {activeTenantId ? <Building2 size={13} /> : <Globe size={13} />}
        <span className="max-w-[160px] truncate">{label}</span>
        <ChevronDown size={13} className="text-ink-muted" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-64 animate-fade-in overflow-hidden rounded-xl border border-white/10 bg-bg-elevated shadow-lg">
          <div className="border-b border-white/5 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
            Tenant ativo
          </div>
          <div className="max-h-80 overflow-y-auto py-1">
            <button
              onClick={() => choose(null, null)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-white/[0.04]"
            >
              <Globe size={14} className="text-ink-secondary" />
              <span className={cn('flex-1', !activeTenantId ? 'text-white' : 'text-ink-secondary')}>
                Todos os tenants
              </span>
              {!activeTenantId && <Check size={14} className="text-brand-light" />}
            </button>
            {tenants.map((t) => (
              <button
                key={t.id}
                onClick={() => choose(t.id, t.nome)}
                className="flex w-full items-center gap-2 py-2 pr-3 text-left text-[13px] transition-colors hover:bg-white/[0.04]"
                style={{ paddingLeft: 12 + t.depth * 14 }}
              >
                <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: TIPO_COLOR[t.tipo] }} />
                <span
                  className={cn(
                    'flex-1 truncate',
                    activeTenantId === t.id ? 'text-white' : 'text-ink-secondary',
                  )}
                >
                  {t.nome}
                </span>
                {activeTenantId === t.id && <Check size={14} className="text-brand-light" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
