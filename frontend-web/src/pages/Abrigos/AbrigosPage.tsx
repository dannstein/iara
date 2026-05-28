import { useState } from 'react';
import { Home, ShieldAlert, Plus } from 'lucide-react';
import {
  SectionHeader,
  DataTable,
  Pagination,
  Modal,
  Skeleton,
  EmptyState,
  ErrorState,
  Button,
  TenantChip,
  type Column,
} from '@/components/ui';
import { NovoAbrigoModal } from './NovoAbrigoModal';
import { TenantFilter } from '@/components/TenantFilter';
import { SearchInput } from '@/components/SearchInput';
import { useAbrigos, useAbrigoOcupantes } from '@/hooks/useAbrigos';
import { useTenantOptions, usePagination } from '@/hooks/useTenantTable';
import { useAuthStore, hasRole } from '@/store/authStore';
import { cn } from '@/lib/utils';
import type { AbrigoDTO } from '@/types/api';

function OccupancyBar({ atual, total }: { atual: number; total: number }) {
  const pct = total > 0 ? Math.round((atual / total) * 100) : 0;
  const color = pct >= 90 ? '#EF4444' : pct >= 70 ? '#EAB308' : '#22C55E';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
      <span className="text-[12px] tabular-nums text-ink-secondary">
        {atual}/{total}
      </span>
    </div>
  );
}

export function AbrigosPage() {
  const { data, isLoading, isError, refetch } = useAbrigos();
  const [selected, setSelected] = useState<AbrigoDTO | null>(null);
  const [novoOpen, setNovoOpen] = useState(false);
  const [tenantFilter, setTenantFilter] = useState('');
  const [search, setSearch] = useState('');
  const canCreate = hasRole(useAuthStore((s) => s.user?.role), 'GESTOR');
  const { tenants, nameById, multiTenant, inTenantScope } = useTenantOptions();

  const filtered = (data ?? []).filter(
    (a) =>
      inTenantScope(a.tenantId, tenantFilter) &&
      a.nome.toLowerCase().includes(search.toLowerCase()),
  );
  const { paged, page, setPage, total, pageSize } = usePagination(filtered, 10);

  const columns: Column<AbrigoDTO>[] = [
    { key: 'nome', label: 'Abrigo', render: (a) => <span className="font-medium text-ink-primary">{a.nome}</span> },
    {
      key: 'ocupacao',
      label: 'Ocupação',
      render: (a) => <OccupancyBar atual={a.ocupacaoAtual} total={a.capacidadeTotal} />,
    },
    {
      key: 'vagas',
      label: 'Vagas',
      render: (a) => (
        <span className="tabular-nums text-ink-secondary">
          {Math.max(0, a.capacidadeTotal - a.ocupacaoAtual)}
        </span>
      ),
    },
    { key: 'contato', label: 'Contato', render: (a) => <span className="text-ink-secondary">{a.contato ?? '—'}</span> },
    ...(multiTenant
      ? [{ key: 'tenant', label: 'Tenant', render: (a: AbrigoDTO) => <TenantChip nome={nameById[a.tenantId]} /> } as Column<AbrigoDTO>]
      : []),
  ];

  return (
    <div>
      <SectionHeader
        eyebrow="Infraestrutura"
        title="Abrigos"
        action={
          canCreate && (
            <Button onClick={() => setNovoOpen(true)}>
              <Plus size={15} /> Novo Abrigo
            </Button>
          )
        }
      />

      <NovoAbrigoModal open={novoOpen} onClose={() => setNovoOpen(false)} />

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : isError ? (
        <ErrorState action={<Button variant="secondary" onClick={() => refetch()}>Tentar novamente</Button>} />
      ) : (
        <DataTable
          title="Abrigos ativos"
          count={total}
          columns={columns}
          rows={paged}
          rowKey={(a) => a.id}
          onRowClick={setSelected}
          toolbar={
            <div className="flex flex-wrap gap-2">
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar abrigo…" />
              {multiTenant && (
                <TenantFilter tenants={tenants} value={tenantFilter} onChange={setTenantFilter} />
              )}
            </div>
          }
          footer={<Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />}
          emptyState={
            <EmptyState
              icon={<Home size={40} strokeWidth={1.5} />}
              title="Nenhum abrigo cadastrado"
              description="Abrigos abertos durante eventos aparecerão aqui."
            />
          }
        />
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.nome ?? ''}
        eyebrow="Abrigo"
        icon={<Home size={16} />}
        maxWidth="max-w-2xl"
      >
        {selected && <AbrigoDetail abrigo={selected} />}
      </Modal>
    </div>
  );
}

function AbrigoDetail({ abrigo }: { abrigo: AbrigoDTO }) {
  const ocupantes = useAbrigoOcupantes(abrigo.id);

  return (
    <div className="flex flex-col gap-5">
      {abrigo.descricao && <p className="text-[13px] text-ink-secondary">{abrigo.descricao}</p>}

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-white/[0.06] p-3">
          <p className="eyebrow">Capacidade</p>
          <p className="text-[18px] font-semibold tabular-nums text-ink-primary">{abrigo.capacidadeTotal}</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] p-3">
          <p className="eyebrow">Ocupação</p>
          <p className="text-[18px] font-semibold tabular-nums text-ink-primary">{abrigo.ocupacaoAtual}</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] p-3">
          <p className="eyebrow">Vagas</p>
          <p className="text-[18px] font-semibold tabular-nums text-green-400">
            {Math.max(0, abrigo.capacidadeTotal - abrigo.ocupacaoAtual)}
          </p>
        </div>
      </div>

      <div>
        <p className="eyebrow mb-2">Ocupantes</p>
        {ocupantes.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (ocupantes.data?.length ?? 0) === 0 ? (
          <p className="text-[12px] text-ink-muted">Nenhum ocupante registrado.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {ocupantes.data!.map((o) => (
              <div
                key={o.id}
                className={cn(
                  'flex items-center justify-between rounded-md px-3 py-2',
                  o.isPrioridade ? 'border border-orange-500/25 bg-orange-500/5' : 'bg-white/[0.03]',
                )}
              >
                <span className="flex items-center gap-2 text-[13px] text-ink-primary">
                  {o.isPrioridade && <ShieldAlert size={13} className="text-orange-400" />}
                  {o.nome}
                  {o.idade != null && <span className="text-ink-muted">· {o.idade} anos</span>}
                </span>
                {o.necessidadeEspecialTipo && (
                  <span className="text-[11px] text-orange-400">{o.necessidadeEspecialTipo}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
