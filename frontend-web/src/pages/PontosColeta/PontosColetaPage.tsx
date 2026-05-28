import { useState } from 'react';
import { toast } from 'sonner';
import { Package, BadgeCheck, CircleSlash, Plus, UserCog, Check } from 'lucide-react';
import {
  SectionHeader,
  DataTable,
  Pagination,
  Modal,
  Skeleton,
  EmptyState,
  ErrorState,
  Button,
  Select,
  PulseDot,
  TenantChip,
  type Column,
} from '@/components/ui';
import { NovoPcModal } from './NovoPcModal';
import { TenantFilter } from '@/components/TenantFilter';
import { SearchInput } from '@/components/SearchInput';
import {
  usePontosColeta,
  usePcDemandas,
  usePcEstoque,
  useDefinirCoordenador,
} from '@/hooks/usePontosColeta';
import { useUsuario, useUsuariosList } from '@/hooks/useUsuarios';
import { useTenantOptions, usePagination } from '@/hooks/useTenantTable';
import { useAuthStore, hasRole } from '@/store/authStore';
import { apiErrorMessage } from '@/lib/api';
import { prioridadeConfig } from '@/lib/utils';
import type { PcDTO } from '@/types/api';

export function PontosColetaPage() {
  const { data, isLoading, isError, refetch } = usePontosColeta();
  const [selected, setSelected] = useState<PcDTO | null>(null);
  const [novoOpen, setNovoOpen] = useState(false);
  const [tenantFilter, setTenantFilter] = useState('');
  const [search, setSearch] = useState('');
  const canCreate = hasRole(useAuthStore((s) => s.user?.role), 'GESTOR');
  const { tenants, nameById, multiTenant, inTenantScope } = useTenantOptions();

  const filtered = (data ?? []).filter(
    (pc) =>
      inTenantScope(pc.tenantId, tenantFilter) &&
      pc.pcNome.toLowerCase().includes(search.toLowerCase()),
  );
  const { paged, page, setPage, total, pageSize } = usePagination(filtered, 10);

  const columns: Column<PcDTO>[] = [
    {
      key: 'nome',
      label: 'Ponto de Coleta',
      render: (pc) => (
        <div className="flex items-center gap-2">
          <PulseDot color={pc.isActive ? '#22C55E' : '#64748B'} />
          <span className="font-medium text-ink-primary">{pc.pcNome}</span>
        </div>
      ),
    },
    { key: 'tipo', label: 'Tipo', render: (pc) => <span className="text-ink-secondary">{pc.pcTipo}</span> },
    {
      key: 'verificado',
      label: 'Verificação',
      render: (pc) =>
        pc.pcIsVerified ? (
          <span className="flex items-center gap-1 text-[12px] text-green-400">
            <BadgeCheck size={13} /> Verificado
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[12px] text-ink-muted">
            <CircleSlash size={13} /> Pendente
          </span>
        ),
    },
    { key: 'contato', label: 'Contato', render: (pc) => <span className="text-ink-secondary">{pc.pcContato ?? '—'}</span> },
    ...(multiTenant
      ? [{ key: 'tenant', label: 'Tenant', render: (pc: PcDTO) => <TenantChip nome={nameById[pc.tenantId]} /> } as Column<PcDTO>]
      : []),
  ];

  return (
    <div>
      <SectionHeader
        eyebrow="Infraestrutura"
        title="Pontos de Coleta"
        action={
          canCreate && (
            <Button onClick={() => setNovoOpen(true)}>
              <Plus size={15} /> Novo PC
            </Button>
          )
        }
      />

      <NovoPcModal open={novoOpen} onClose={() => setNovoOpen(false)} />

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : isError ? (
        <ErrorState action={<Button variant="secondary" onClick={() => refetch()}>Tentar novamente</Button>} />
      ) : (
        <DataTable
          title="Todos os pontos"
          count={total}
          columns={columns}
          rows={paged}
          rowKey={(pc) => pc.id}
          onRowClick={setSelected}
          toolbar={
            <div className="flex flex-wrap gap-2">
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar PC…" />
              {multiTenant && (
                <TenantFilter tenants={tenants} value={tenantFilter} onChange={setTenantFilter} />
              )}
            </div>
          }
          footer={<Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />}
          emptyState={
            <EmptyState
              icon={<Package size={40} strokeWidth={1.5} />}
              title="Nenhum ponto de coleta"
              description="Os pontos de coleta cadastrados pelos coordenadores aparecerão aqui."
            />
          }
        />
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.pcNome ?? ''}
        eyebrow="Ponto de Coleta"
        icon={<Package size={16} />}
        maxWidth="max-w-2xl"
      >
        {selected && <PcDetail pc={selected} canManage={canCreate} />}
      </Modal>
    </div>
  );
}

function PcDetail({ pc, canManage }: { pc: PcDTO; canManage: boolean }) {
  const demandas = usePcDemandas(pc.id);
  const estoque = usePcEstoque(pc.id);

  return (
    <div className="flex flex-col gap-5">
      {pc.pcDesc && <p className="text-[13px] text-ink-secondary">{pc.pcDesc}</p>}

      <CoordenadorSection pc={pc} canManage={canManage} />

      <div>
        <p className="eyebrow mb-2">Demandas</p>
        {demandas.isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : (demandas.data?.length ?? 0) === 0 ? (
          <p className="text-[12px] text-ink-muted">Sem demandas registradas.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {demandas.data!.map((d) => {
              const cfg = prioridadeConfig[d.prioridade];
              return (
                <div key={d.id} className="flex items-center justify-between rounded-md bg-white/[0.03] px-3 py-2">
                  <span className="text-[13px] text-ink-primary">{d.tipoNome}</span>
                  <span className="flex items-center gap-3">
                    <span className={`text-[11px] font-bold uppercase ${cfg.text}`}>{cfg.label}</span>
                    <span className="text-[12px] tabular-nums text-ink-secondary">
                      {d.qtdAtendida}/{d.qtdSolicitada}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <p className="eyebrow mb-2">Estoque</p>
        {estoque.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (estoque.data?.length ?? 0) === 0 ? (
          <p className="text-[12px] text-ink-muted">Estoque vazio.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {estoque.data!.map((e) => (
              <div key={e.id} className="rounded-md border border-white/[0.06] px-3 py-2">
                <p className="text-[11px] text-ink-muted">{e.tipoNome}</p>
                <p className="text-[16px] font-semibold tabular-nums text-ink-primary">{e.quantidade}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CoordenadorSection({ pc, canManage }: { pc: PcDTO; canManage: boolean }) {
  const atual = useUsuario(pc.coordenadorId);
  const [editing, setEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const usuarios = useUsuariosList(undefined, editing);
  const definir = useDefinirCoordenador(pc.id);

  function salvar() {
    if (!selectedUser) return;
    definir.mutate(selectedUser, {
      onSuccess: () => {
        toast.success('Coordenador atualizado. O usuário agora é COORDENADOR deste PC.');
        setEditing(false);
        setSelectedUser('');
      },
      onError: (e) => toast.error(apiErrorMessage(e)),
    });
  }

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCog size={15} className="text-brand-light" />
          <div className="flex flex-col leading-tight">
            <span className="eyebrow">Coordenador</span>
            <span className="text-[13px] text-ink-primary">{atual.data?.nome ?? '—'}</span>
          </div>
        </div>
        {canManage && !editing && (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Alterar
          </Button>
        )}
      </div>

      {canManage && editing && (
        <div className="mt-3 flex items-end gap-2">
          <div className="flex-1">
            <Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
              <option value="" disabled>
                {usuarios.isLoading ? 'Carregando usuários…' : 'Selecione um usuário…'}
              </option>
              {usuarios.data?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} · {u.role}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={salvar} loading={definir.isPending} disabled={!selectedUser}>
            <Check size={15} /> Definir
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setEditing(false);
              setSelectedUser('');
            }}
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}
