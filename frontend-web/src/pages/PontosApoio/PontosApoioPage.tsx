import { useState } from 'react';
import { LifeBuoy, Plus } from 'lucide-react';
import {
  SectionHeader,
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
import { NovoPontoApoioModal } from './NovoPontoApoioModal';
import { TenantFilter } from '@/components/TenantFilter';
import { SearchInput } from '@/components/SearchInput';
import { usePontosApoio } from '@/hooks/usePontosApoio';
import { useTenantOptions, usePagination } from '@/hooks/useTenantTable';
import { useAuthStore, hasRole } from '@/store/authStore';
import type { PontoApoioDTO } from '@/types/api';

export function PontosApoioPage() {
  const { data, isLoading, isError, refetch } = usePontosApoio();
  const [novoOpen, setNovoOpen] = useState(false);
  const [tenantFilter, setTenantFilter] = useState('');
  const [search, setSearch] = useState('');
  const canCreate = hasRole(useAuthStore((s) => s.user?.role), 'GESTOR');
  const { tenants, nameById, multiTenant, inTenantScope } = useTenantOptions();

  const filtered = (data ?? []).filter(
    (p) =>
      inTenantScope(p.tenantId, tenantFilter) &&
      p.nome.toLowerCase().includes(search.toLowerCase()),
  );
  const { paged, page, setPage, total, pageSize } = usePagination(filtered, 10);

  const columns: Column<PontoApoioDTO>[] = [
    { key: 'nome', label: 'Ponto de Apoio', render: (p) => <span className="font-medium text-ink-primary">{p.nome}</span> },
    {
      key: 'zona',
      label: 'Atende zona',
      render: (p) =>
        p.zonaRiscoId ? (
          <Badge className="border border-blue-500/30 bg-blue-500/12 text-blue-400">{p.zonaRiscoNome}</Badge>
        ) : (
          <Badge className="border border-white/10 bg-white/5 text-ink-muted">Livre</Badge>
        ),
    },
    { key: 'responsavel', label: 'Responsável', render: (p) => <span className="text-ink-secondary">{p.responsavel ?? '—'}</span> },
    { key: 'contato', label: 'Contato', render: (p) => <span className="text-ink-secondary">{p.contato ?? '—'}</span> },
    ...(multiTenant
      ? [{ key: 'tenant', label: 'Tenant', render: (p: PontoApoioDTO) => <TenantChip nome={nameById[p.tenantId]} /> } as Column<PontoApoioDTO>]
      : []),
  ];

  return (
    <div>
      <SectionHeader
        eyebrow="Infraestrutura"
        title="Pontos de Apoio"
        action={
          canCreate && (
            <Button onClick={() => setNovoOpen(true)}>
              <Plus size={15} /> Novo Ponto de Apoio
            </Button>
          )
        }
      />

      <NovoPontoApoioModal open={novoOpen} onClose={() => setNovoOpen(false)} />

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : isError ? (
        <ErrorState action={<Button variant="secondary" onClick={() => refetch()}>Tentar novamente</Button>} />
      ) : (
        <DataTable
          title="Todos os pontos de apoio"
          count={total}
          columns={columns}
          rows={paged}
          rowKey={(p) => p.id}
          toolbar={
            <div className="flex flex-wrap gap-2">
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar ponto de apoio…" />
              {multiTenant && (
                <TenantFilter tenants={tenants} value={tenantFilter} onChange={setTenantFilter} />
              )}
            </div>
          }
          footer={<Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />}
          emptyState={
            <EmptyState
              icon={<LifeBuoy size={40} strokeWidth={1.5} />}
              title="Nenhum ponto de apoio"
              description="Cadastre pontos de apoio para vinculá-los às zonas de risco."
            />
          }
        />
      )}
    </div>
  );
}
