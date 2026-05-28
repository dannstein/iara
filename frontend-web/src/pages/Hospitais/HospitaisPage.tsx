import { useState } from 'react';
import { Cross, BedDouble, HeartPulse, Plus, Tent } from 'lucide-react';
import {
  SectionHeader,
  StatCard,
  DataTable,
  Pagination,
  Skeleton,
  EmptyState,
  ErrorState,
  Button,
  Badge,
  TenantChip,
  type Column,
} from '@/components/ui';
import { NovoHospitalModal } from './NovoHospitalModal';
import { TenantFilter } from '@/components/TenantFilter';
import { SearchInput } from '@/components/SearchInput';
import { useHospitais } from '@/hooks/useHospitais';
import { useTenantOptions, usePagination } from '@/hooks/useTenantTable';
import { useAuthStore, hasRole } from '@/store/authStore';
import { cn } from '@/lib/utils';
import type { HospitalDTO } from '@/types/api';

const sum = (arr: HospitalDTO[], pick: (h: HospitalDTO) => number | null) =>
  arr.reduce((acc, h) => acc + (pick(h) ?? 0), 0);

export function HospitaisPage() {
  const { data, isLoading, isError, refetch } = useHospitais();
  const [novoOpen, setNovoOpen] = useState(false);
  const [tenantFilter, setTenantFilter] = useState('');
  const [search, setSearch] = useState('');
  const canCreate = hasRole(useAuthStore((s) => s.user?.role), 'GESTOR');
  const { tenants, nameById, multiTenant, inTenantScope } = useTenantOptions();

  const hospitais = data ?? [];
  const filtered = hospitais.filter(
    (h) =>
      inTenantScope(h.tenantId, tenantFilter) &&
      h.nome.toLowerCase().includes(search.toLowerCase()),
  );
  const { paged, page, setPage, total, pageSize } = usePagination(filtered, 10);

  const columns: Column<HospitalDTO>[] = [
    { key: 'nome', label: 'Hospital', render: (h) => <span className="font-medium text-ink-primary">{h.nome}</span> },
    { key: 'tipo', label: 'Tipo', render: (h) => <span className="text-ink-secondary">{h.tipo}</span> },
    {
      key: 'leitos',
      label: 'Leitos (disp/total)',
      render: (h) => (
        <span className="tabular-nums text-ink-secondary">
          {h.leitosDisponiveis ?? 0}/{h.leitosTotal ?? 0}
        </span>
      ),
    },
    {
      key: 'uti',
      label: 'UTI (disp/total)',
      render: (h) => (
        <span className="tabular-nums text-ink-secondary">
          {h.leitosUtiDisp ?? 0}/{h.leitosUti ?? 0}
        </span>
      ),
    },
    {
      key: 'campanha',
      label: 'Campanha',
      render: (h) =>
        h.aceitaCampanha ? (
          <Badge className="border border-green-500/30 bg-green-500/12 text-green-400">Sim</Badge>
        ) : (
          <span className="text-ink-muted">—</span>
        ),
    },
    { key: 'contato', label: 'Contato', render: (h) => <span className="text-ink-secondary">{h.contato ?? '—'}</span> },
    ...(multiTenant
      ? [{ key: 'tenant', label: 'Tenant', render: (h: HospitalDTO) => <TenantChip nome={nameById[h.tenantId]} /> } as Column<HospitalDTO>]
      : []),
  ];

  return (
    <div>
      <SectionHeader
        eyebrow="Infraestrutura"
        title="Hospitais"
        action={
          canCreate && (
            <Button onClick={() => setNovoOpen(true)}>
              <Plus size={15} /> Novo Hospital
            </Button>
          )
        }
      />

      <NovoHospitalModal open={novoOpen} onClose={() => setNovoOpen(false)} />

      <div className={cn('mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4')}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)
        ) : (
          <>
            <StatCard eyebrow="Rede" title="Hospitais" value={hospitais.length} icon={<Cross size={20} />} variant="brand" />
            <StatCard
              eyebrow="Capacidade"
              title="Leitos disponíveis"
              value={sum(hospitais, (h) => h.leitosDisponiveis)}
              icon={<BedDouble size={20} />}
              variant={sum(hospitais, (h) => h.leitosDisponiveis) === 0 ? 'alta' : 'default'}
            />
            <StatCard
              eyebrow="Crítico"
              title="UTI disponíveis"
              value={sum(hospitais, (h) => h.leitosUtiDisp)}
              icon={<HeartPulse size={20} />}
              variant={sum(hospitais, (h) => h.leitosUtiDisp) === 0 ? 'critica' : 'default'}
            />
            <StatCard
              eyebrow="Apoio"
              title="Aceitam campanha"
              value={hospitais.filter((h) => h.aceitaCampanha).length}
              icon={<Tent size={20} />}
            />
          </>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : isError ? (
        <ErrorState action={<Button variant="secondary" onClick={() => refetch()}>Tentar novamente</Button>} />
      ) : (
        <DataTable
          title="Todos os hospitais"
          count={total}
          columns={columns}
          rows={paged}
          rowKey={(h) => h.id}
          toolbar={
            <div className="flex flex-wrap gap-2">
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar hospital…" />
              {multiTenant && (
                <TenantFilter tenants={tenants} value={tenantFilter} onChange={setTenantFilter} />
              )}
            </div>
          }
          footer={<Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />}
          emptyState={
            <EmptyState
              icon={<Cross size={40} strokeWidth={1.5} />}
              title="Nenhum hospital cadastrado"
              description="Cadastre os hospitais da rede para acompanhar leitos e UTI."
            />
          }
        />
      )}
    </div>
  );
}
