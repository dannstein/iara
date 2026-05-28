import { useState } from 'react';
import { ShieldCheck, Clock } from 'lucide-react';
import {
  SectionHeader,
  DataTable,
  Pagination,
  Select,
  Skeleton,
  EmptyState,
  ErrorState,
  Button,
  TenantChip,
  type Column,
} from '@/components/ui';
import { TenantFilter } from '@/components/TenantFilter';
import { SearchInput } from '@/components/SearchInput';
import { PrevencaoDetailModal } from './PrevencaoDetailModal';
import { usePrevencao } from '@/hooks/usePrevencao';
import { useTenantOptions, usePagination } from '@/hooks/useTenantTable';
import { formatRelative } from '@/lib/utils';
import type {
  SolicitacaoServicoDTO,
  SolicitacaoStatus,
  Severidade,
} from '@/types/api';

const STATUS_LABEL: Record<SolicitacaoStatus, string> = {
  ABERTA: 'Solicitado',
  EM_TRIAGEM: 'Em revisão',
  EM_ATENDIMENTO: 'Em atendimento',
  CONCLUIDA: 'Finalizado',
  INDEFERIDA: 'Cancelado',
};
const STATUS_COLOR: Record<SolicitacaoStatus, string> = {
  ABERTA: '#EAB308',
  EM_TRIAGEM: '#3B82F6',
  EM_ATENDIMENTO: '#8B5CF6',
  CONCLUIDA: '#22C55E',
  INDEFERIDA: '#64748B',
};
const TIPO_LABEL: Record<string, string> = {
  CORTE_ARVORE: 'Corte de árvore',
  VISTORIA_RACHADURA: 'Vistoria de rachadura',
  LIMPEZA_BUEIRO: 'Limpeza de bueiro',
  RISCO_DESLIZAMENTO: 'Risco de deslizamento',
  OUTRO: 'Outro',
};
const PRIORIDADE_COLOR: Record<string, string> = {
  CRITICA: '#EF4444',
  ALTA: '#F97316',
  MEDIA: '#EAB308',
  BAIXA: '#22C55E',
};

const STATUS_ORDER: SolicitacaoStatus[] = [
  'ABERTA',
  'EM_TRIAGEM',
  'EM_ATENDIMENTO',
  'CONCLUIDA',
  'INDEFERIDA',
];

export function PrevencaoPage() {
  const { data, isLoading, isError, refetch } = usePrevencao();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SolicitacaoStatus | ''>('');
  const [prioridadeFilter, setPrioridadeFilter] = useState<Severidade | ''>('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [selected, setSelected] = useState<SolicitacaoServicoDTO | null>(null);
  const { tenants, nameById, multiTenant, inTenantScope } = useTenantOptions();

  const filtered = (data ?? []).filter(
    (s) =>
      inTenantScope(s.tenantId, tenantFilter) &&
      (!statusFilter || s.status === statusFilter) &&
      (!prioridadeFilter || s.prioridade === prioridadeFilter) &&
      (s.enderecoTxt.toLowerCase().includes(search.toLowerCase()) ||
        s.descricaoMotivo.toLowerCase().includes(search.toLowerCase()) ||
        (TIPO_LABEL[s.tipo] ?? s.tipo).toLowerCase().includes(search.toLowerCase())),
  );
  const { paged, page, setPage, total, pageSize } = usePagination(filtered, 10);

  const pendentes = (data ?? []).filter((s) => s.status === 'ABERTA' || s.status === 'EM_TRIAGEM').length;

  const columns: Column<SolicitacaoServicoDTO>[] = [
    {
      key: 'tipo',
      label: 'Tipo',
      render: (s) => (
        <span className="text-[13px] font-medium text-ink-primary">
          {TIPO_LABEL[s.tipo] ?? s.tipo}
        </span>
      ),
    },
    {
      key: 'endereco',
      label: 'Endereço',
      render: (s) => <span className="truncate text-ink-secondary">{s.enderecoTxt}</span>,
    },
    {
      key: 'prioridade',
      label: 'Prioridade',
      render: (s) =>
        s.prioridade ? (
          <span
            className="rounded px-2 py-0.5 text-[11px] font-bold uppercase"
            style={{ background: `${PRIORIDADE_COLOR[s.prioridade]}22`, color: PRIORIDADE_COLOR[s.prioridade] }}
          >
            {s.prioridade}
          </span>
        ) : (
          <span className="text-ink-muted">—</span>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (s) => (
        <span
          className="rounded px-2 py-0.5 text-[11px] font-semibold"
          style={{ background: `${STATUS_COLOR[s.status]}22`, color: STATUS_COLOR[s.status] }}
        >
          {STATUS_LABEL[s.status]}
        </span>
      ),
    },
    {
      key: 'data',
      label: 'Aberto',
      render: (s) => <span className="text-[12px] text-ink-muted">{formatRelative(s.createdAt)}</span>,
    },
    ...(multiTenant
      ? [
          {
            key: 'tenant',
            label: 'Tenant',
            render: (s: SolicitacaoServicoDTO) => <TenantChip nome={nameById[s.tenantId]} />,
          } as Column<SolicitacaoServicoDTO>,
        ]
      : []),
  ];

  return (
    <div>
      <SectionHeader
        eyebrow="Prevenção"
        title="Solicitações da comunidade"
        action={
          pendentes > 0 ? (
            <span className="flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-[11px] font-medium text-yellow-400">
              <Clock size={12} /> {pendentes} pendente{pendentes > 1 ? 's' : ''}
            </span>
          ) : undefined
        }
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : isError ? (
        <ErrorState action={<Button variant="secondary" onClick={() => refetch()}>Tentar novamente</Button>} />
      ) : (
        <DataTable
          title="Tickets de prevenção"
          count={total}
          columns={columns}
          rows={paged}
          rowKey={(s) => s.id}
          onRowClick={setSelected}
          toolbar={
            <div className="flex flex-wrap gap-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Buscar por endereço, motivo, tipo…"
                className="min-w-[220px]"
              />
              <Select
                className="w-auto min-w-[150px]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SolicitacaoStatus | '')}
              >
                <option value="">Todos os status</option>
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
              <Select
                className="w-auto min-w-[140px]"
                value={prioridadeFilter}
                onChange={(e) => setPrioridadeFilter(e.target.value as Severidade | '')}
              >
                <option value="">Toda prioridade</option>
                {(['CRITICA', 'ALTA', 'MEDIA', 'BAIXA'] as Severidade[]).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
              {multiTenant && <TenantFilter tenants={tenants} value={tenantFilter} onChange={setTenantFilter} />}
            </div>
          }
          footer={<Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />}
          emptyState={
            <EmptyState
              icon={<ShieldCheck size={40} strokeWidth={1.5} />}
              title="Sem solicitações"
              description="Os relatos preventivos enviados pelos cidadãos aparecerão aqui."
            />
          }
        />
      )}

      <PrevencaoDetailModal id={selected?.id ?? null} onClose={() => setSelected(null)} />
    </div>
  );
}

export { STATUS_LABEL, STATUS_COLOR, TIPO_LABEL, PRIORIDADE_COLOR };
