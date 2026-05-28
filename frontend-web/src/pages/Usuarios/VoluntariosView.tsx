import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Stethoscope, Plus, Check, Ban, UserCheck, Clock } from 'lucide-react';
import {
  SectionHeader,
  Card,
  DataTable,
  Pagination,
  Select,
  Skeleton,
  EmptyState,
  ErrorState,
  Button,
  Modal,
  Input,
  type Column,
} from '@/components/ui';
import { SearchInput } from '@/components/SearchInput';
import { NovaEspecialidadeModal } from './NovaEspecialidadeModal';
import { VoluntarioDetailModal } from './VoluntarioDetailModal';
import { useCategorias, useEspecs } from '@/hooks/useEspecialidades';
import {
  useUsuariosList,
  useAprovarUsuario,
  useRejeitarUsuario,
} from '@/hooks/useUsuarios';
import { usePagination } from '@/hooks/useTenantTable';
import { useAuthStore, hasRole } from '@/store/authStore';
import { apiErrorMessage } from '@/lib/api';
import type { UsuarioDTO } from '@/types/api';

export function VoluntariosView() {
  const canManage = hasRole(useAuthStore((s) => s.user?.role), 'GESTOR');
  const categorias = useCategorias();
  const especs = useEspecs();
  const [especFilter, setEspecFilter] = useState('');
  const [search, setSearch] = useState('');
  const [novaEspecOpen, setNovaEspecOpen] = useState(false);
  const [detalhe, setDetalhe] = useState<UsuarioDTO | null>(null);

  const especNomeById = useMemo(() => {
    const m: Record<string, string> = {};
    especs.data?.forEach((e) => (m[e.id] = e.nome));
    return m;
  }, [especs.data]);

  const voluntarios = useUsuariosList({
    role: 'TECNICO',
    especialidade: especFilter || undefined,
  });
  const pendentes = useUsuariosList({ role: 'TECNICO', status: 'PENDENTE' });
  const aprovar = useAprovarUsuario();
  const [rejeitarTarget, setRejeitarTarget] = useState<UsuarioDTO | null>(null);

  const filtered = (voluntarios.data ?? []).filter((u) =>
    u.nome.toLowerCase().includes(search.toLowerCase()),
  );
  const { paged, page, setPage, total, pageSize } = usePagination(filtered, 10);

  const columns: Column<UsuarioDTO>[] = [
    { key: 'nome', label: 'Voluntário', render: (u) => <span className="font-medium text-ink-primary">{u.nome}</span> },
    {
      key: 'espec',
      label: 'Especialidade',
      render: (u) =>
        u.especId ? (
          <span className="rounded bg-brand-blue-soft px-2 py-0.5 text-[11px] font-medium text-brand-light">
            {especNomeById[u.especId] ?? '—'}
          </span>
        ) : (
          <span className="text-ink-muted">—</span>
        ),
    },
    { key: 'doc', label: 'Registro', render: (u) => <span className="text-ink-secondary">{u.docComprovacaoNumero ?? '—'}</span> },
    {
      key: 'status',
      label: 'Cadastro',
      render: (u) => <span className="text-[12px] text-ink-secondary">{u.cadastroSts}</span>,
    },
    {
      key: 'disp',
      label: 'Disponível',
      render: (u) => (
        <span className={u.estaDisponivel ? 'text-green-400' : 'text-ink-muted'}>
          {u.estaDisponivel ? 'Sim' : 'Não'}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Especialidades */}
      <Card>
        <SectionHeader
          eyebrow="Catálogo"
          title="Especialidades dos voluntários"
          action={
            canManage && (
              <Button onClick={() => setNovaEspecOpen(true)}>
                <Plus size={15} /> Nova especialidade
              </Button>
            )
          }
        />
        {categorias.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (categorias.data?.length ?? 0) === 0 ? (
          <p className="text-[13px] text-ink-muted">Nenhuma especialidade cadastrada.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {categorias.data!.map((c) => {
              const subs = especs.data?.filter((e) => e.idCategoria === c.id) ?? [];
              return (
                <div key={c.id} className="rounded-lg border border-white/[0.06] p-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-ink-primary">
                    <Stethoscope size={14} className="text-brand-light" />
                    {c.nome}
                  </p>
                  {subs.length === 0 ? (
                    <p className="text-[11px] text-ink-muted">Sem subespecialidades.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {subs.map((s) => (
                        <span key={s.id} className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-ink-secondary">
                          {s.nome}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Voluntários pendentes de aprovação */}
      {canManage && (pendentes.data?.length ?? 0) > 0 && (
        <Card className="border-yellow-500/30">
          <SectionHeader eyebrow="Aprovação" title="Voluntários pendentes" barColor="#EAB308" />
          <div className="flex flex-col gap-2">
            {pendentes.data!.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-bg-secondary px-4 py-2.5"
              >
                <button onClick={() => setDetalhe(u)} className="flex items-center gap-2 text-left">
                  <Clock size={14} className="text-yellow-400" />
                  <span className="text-[13px] text-ink-primary">{u.nome}</span>
                  {u.especId && (
                    <span className="text-[11px] text-ink-muted">· {especNomeById[u.especId] ?? 'espec.'}</span>
                  )}
                </button>
                <div className="flex gap-1.5">
                  <button
                    onClick={() =>
                      aprovar.mutate(u.id, {
                        onSuccess: () => toast.success('Voluntário aprovado.'),
                        onError: (e) => toast.error(apiErrorMessage(e)),
                      })
                    }
                    className="inline-flex items-center gap-1 rounded-md border border-green-500/30 bg-green-500/10 px-2 py-1 text-[12px] font-semibold text-green-400 hover:bg-green-500/20"
                  >
                    <Check size={13} /> Aprovar
                  </button>
                  <button
                    onClick={() => setRejeitarTarget(u)}
                    className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[12px] font-semibold text-red-400 hover:bg-red-500/20"
                  >
                    <Ban size={13} /> Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Lista de voluntários */}
      <div>
        <SectionHeader eyebrow="Equipe" title="Voluntários (técnicos)" />
        {voluntarios.isLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : voluntarios.isError ? (
          <ErrorState action={<Button variant="secondary" onClick={() => voluntarios.refetch()}>Tentar novamente</Button>} />
        ) : (
          <DataTable
            title="Voluntários"
            count={total}
            columns={columns}
            rows={paged}
            rowKey={(u) => u.id}
            onRowClick={setDetalhe}
            toolbar={
              <div className="flex flex-wrap gap-2">
                <SearchInput value={search} onChange={setSearch} placeholder="Buscar voluntário…" />
                <Select
                  className="w-auto min-w-[180px]"
                  value={especFilter}
                  onChange={(e) => setEspecFilter(e.target.value)}
                >
                  <option value="">Todas as especialidades</option>
                  {especs.data?.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nome}
                    </option>
                  ))}
                </Select>
              </div>
            }
            footer={<Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />}
            emptyState={<EmptyState icon={<UserCheck size={40} strokeWidth={1.5} />} title="Nenhum voluntário" />}
          />
        )}
      </div>

      <NovaEspecialidadeModal open={novaEspecOpen} onClose={() => setNovaEspecOpen(false)} />
      <VoluntarioDetailModal
        usuario={detalhe}
        especNome={detalhe?.especId ? especNomeById[detalhe.especId] : undefined}
        onClose={() => setDetalhe(null)}
      />
      <RejeitarVoluntarioModal usuario={rejeitarTarget} onClose={() => setRejeitarTarget(null)} />
    </div>
  );
}

function RejeitarVoluntarioModal({ usuario, onClose }: { usuario: UsuarioDTO | null; onClose: () => void }) {
  const [motivo, setMotivo] = useState('');
  const rejeitar = useRejeitarUsuario();

  function confirmar() {
    if (!usuario || !motivo.trim()) return;
    rejeitar.mutate(
      { id: usuario.id, motivo: motivo.trim() },
      {
        onSuccess: () => {
          toast.success('Cadastro rejeitado.');
          setMotivo('');
          onClose();
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
      },
    );
  }

  return (
    <Modal
      open={!!usuario}
      onClose={onClose}
      title="Rejeitar voluntário"
      eyebrow={usuario?.nome}
      icon={<Ban size={16} />}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmar} loading={rejeitar.isPending} disabled={!motivo.trim()}>
            Rejeitar
          </Button>
        </>
      }
    >
      <Input placeholder="Motivo da rejeição" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
    </Modal>
  );
}
