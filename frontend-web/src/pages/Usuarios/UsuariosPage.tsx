import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Users, UserCheck, Clock, ShieldCheck, Plus, UserCog, Check, Ban } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  ResponsiveContainer,
} from 'recharts';
import {
  SectionHeader,
  StatCard,
  Card,
  DataTable,
  Pagination,
  Select,
  Input,
  Skeleton,
  EmptyState,
  ErrorState,
  Button,
  Modal,
  TenantChip,
  type Column,
} from '@/components/ui';
import { NovoUsuarioModal } from './NovoUsuarioModal';
import { VoluntariosView } from './VoluntariosView';
import { EmRiscoTab } from './EmRiscoTab';
import { TenantFilter } from '@/components/TenantFilter';
import { SearchInput } from '@/components/SearchInput';
import { useTenantOptions, usePagination } from '@/hooks/useTenantTable';
import {
  useUsuariosList,
  useMudarRole,
  useAprovarUsuario,
  useRejeitarUsuario,
} from '@/hooks/useUsuarios';
import { useAuthStore, hasRole } from '@/store/authStore';
import { apiErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Role, UsuarioDTO } from '@/types/api';

import { tooltipStyle, tooltipItemStyle, tooltipLabelStyle } from '@/lib/chartTheme';

const ROLE_COLOR: Record<string, string> = {
  ADMIN: '#3B82F6',
  GESTOR: '#0F47BC',
  MONITOR: '#8B5CF6',
  COORDENADOR: '#EC4899',
  TECNICO: '#22C55E',
  DOADOR: '#EAB308',
  USUARIO_SIMPLES: '#64748B',
};
const STATUS_COLOR: Record<string, string> = {
  APROVADO: '#22C55E',
  ATIVO: '#22C55E',
  PENDENTE: '#EAB308',
  REJEITADO: '#EF4444',
  BLOQUEADO: '#64748B',
};
const ROLES: Role[] = ['ADMIN', 'GESTOR', 'MONITOR', 'COORDENADOR', 'TECNICO', 'DOADOR', 'USUARIO_SIMPLES'];

export function UsuariosPage() {
  const [view, setView] = useState<'contas' | 'voluntarios' | 'em-risco'>('contas');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [novoOpen, setNovoOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<UsuarioDTO | null>(null);
  const [rejeitarTarget, setRejeitarTarget] = useState<UsuarioDTO | null>(null);
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = hasRole(role, 'ADMIN');
  const canManage = hasRole(role, 'GESTOR');
  const aprovar = useAprovarUsuario();

  const [tenantFilter, setTenantFilter] = useState('');
  const { tenants, nameById, multiTenant, inTenantScope } = useTenantOptions();

  const { data, isLoading, isError, refetch } = useUsuariosList({
    role: roleFilter || undefined,
    status: statusFilter || undefined,
  });
  const usuarios = (data ?? []).filter(
    (u) =>
      inTenantScope(u.tenantId, tenantFilter) &&
      (u.nome.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())),
  );
  const { paged, page, setPage, total, pageSize } = usePagination(usuarios, 10);

  // Agregações para KPIs e gráficos (todos os usuários do escopo).
  const all = useUsuariosList().data ?? [];
  const roleData = useMemo(() => {
    const counts: Record<string, number> = {};
    all.forEach((u) => (counts[u.role] = (counts[u.role] ?? 0) + 1));
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [all]);
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    all.forEach((u) => (counts[u.cadastroSts] = (counts[u.cadastroSts] ?? 0) + 1));
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [all]);

  const pendentes = all.filter((u) => u.cadastroSts === 'PENDENTE').length;
  const tecnicosDisp = all.filter((u) => u.role === 'TECNICO' && u.estaDisponivel).length;
  const gestores = all.filter((u) => u.role === 'GESTOR' || u.role === 'ADMIN').length;

  const columns: Column<UsuarioDTO>[] = [
    { key: 'nome', label: 'Nome', render: (u) => <span className="font-medium text-ink-primary">{u.nome}</span> },
    { key: 'email', label: 'E-mail', render: (u) => <span className="text-ink-secondary">{u.email}</span> },
    {
      key: 'role',
      label: 'Perfil',
      render: (u) => (
        <span
          className="rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
          style={{ background: `${ROLE_COLOR[u.role]}22`, color: ROLE_COLOR[u.role] }}
        >
          {u.role}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Cadastro',
      render: (u) => (
        <span style={{ color: STATUS_COLOR[u.cadastroSts] ?? '#94A3B8' }} className="text-[12px] font-medium">
          {u.cadastroSts}
        </span>
      ),
    },
    ...(multiTenant
      ? [{ key: 'tenant', label: 'Tenant', render: (u: UsuarioDTO) => <TenantChip nome={nameById[u.tenantId]} /> } as Column<UsuarioDTO>]
      : []),
    ...(isAdmin || canManage
      ? [
          {
            key: 'acoes',
            label: '',
            className: 'text-right',
            render: (u: UsuarioDTO) => (
              <div className="flex items-center justify-end gap-1.5">
                {canManage && u.cadastroSts === 'PENDENTE' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        aprovar.mutate(u.id, {
                          onSuccess: () => toast.success('Cadastro aprovado.'),
                          onError: (err) => toast.error(apiErrorMessage(err)),
                        });
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-green-500/30 bg-green-500/10 px-2 py-1 text-[12px] font-semibold text-green-400 hover:bg-green-500/20"
                    >
                      <Check size={13} /> Aprovar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRejeitarTarget(u);
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[12px] font-semibold text-red-400 hover:bg-red-500/20"
                    >
                      <Ban size={13} /> Rejeitar
                    </button>
                  </>
                )}
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRoleTarget(u);
                    }}
                    className="btn-ghost px-2 py-1 text-[12px]"
                  >
                    <UserCog size={13} /> Perfil
                  </button>
                )}
              </div>
            ),
          } as Column<UsuarioDTO>,
        ]
      : []),
  ];

  return (
    <div>
      <SectionHeader
        eyebrow="Gestão"
        title="Usuários"
        action={
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-lg border border-white/10 p-0.5">
              {(['contas', 'voluntarios', 'em-risco'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    view === v ? 'bg-brand-blue-soft text-white' : 'text-ink-muted hover:text-ink-secondary'
                  }`}
                >
                  {v === 'contas' ? 'Contas' : v === 'voluntarios' ? 'Voluntários' : 'Em Risco'}
                </button>
              ))}
            </div>
            {view === 'contas' && (
              <Button onClick={() => setNovoOpen(true)}>
                <Plus size={15} /> Nova conta
              </Button>
            )}
          </div>
        }
      />

      {view === 'voluntarios' && <VoluntariosView />}

      {view === 'em-risco' && <EmRiscoTab />}

      {view === 'contas' && (
        <>
      <NovoUsuarioModal open={novoOpen} onClose={() => setNovoOpen(false)} />
      <MudarRoleModal usuario={roleTarget} onClose={() => setRoleTarget(null)} />
      <RejeitarModal usuario={rejeitarTarget} onClose={() => setRejeitarTarget(null)} />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard eyebrow="Base" title="Usuários" value={all.length} icon={<Users size={20} />} variant="brand" />
        <StatCard
          eyebrow="Aprovação"
          title="Pendentes"
          value={pendentes}
          icon={<Clock size={20} />}
          variant={pendentes > 0 ? 'media' : 'default'}
        />
        <StatCard eyebrow="Campo" title="Técnicos disponíveis" value={tecnicosDisp} icon={<UserCheck size={20} />} />
        <StatCard eyebrow="Comando" title="Gestores + Admins" value={gestores} icon={<ShieldCheck size={20} />} />
      </div>

      {/* Gráficos */}
      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <SectionHeader eyebrow="Distribuição" title="Usuários por perfil" />
          {all.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-ink-muted">Sem dados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={roleData} margin={{ left: 4, right: 12 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {roleData.map((d) => (
                    <Cell key={d.name} fill={ROLE_COLOR[d.name] ?? '#64748B'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
        <Card>
          <SectionHeader eyebrow="Cadastro" title="Por situação" />
          {all.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-ink-muted">Sem dados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {statusData.map((d) => (
                    <Cell key={d.name} fill={STATUS_COLOR[d.name] ?? '#64748B'} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Filtros + tabela */}
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome/e-mail…" className="min-w-[200px]" />
        <Select className="w-auto min-w-[150px]" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">Todos os perfis</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        <Select className="w-auto min-w-[150px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os status</option>
          {['APROVADO', 'PENDENTE', 'REJEITADO', 'BLOQUEADO'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        {multiTenant && <TenantFilter tenants={tenants} value={tenantFilter} onChange={setTenantFilter} />}
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : isError ? (
        <ErrorState action={<Button variant="secondary" onClick={() => refetch()}>Tentar novamente</Button>} />
      ) : (
        <DataTable
          title="Usuários"
          count={total}
          columns={columns}
          rows={paged}
          rowKey={(u) => u.id}
          footer={<Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />}
          emptyState={<EmptyState icon={<Users size={40} strokeWidth={1.5} />} title="Nenhum usuário" />}
        />
      )}
        </>
      )}
    </div>
  );
}

function MudarRoleModal({ usuario, onClose }: { usuario: UsuarioDTO | null; onClose: () => void }) {
  const [role, setRole] = useState<Role | ''>('');
  const mudar = useMudarRole();

  function salvar() {
    if (!usuario || !role) return;
    mudar.mutate(
      { id: usuario.id, roleNome: role },
      {
        onSuccess: () => {
          toast.success('Perfil alterado.');
          setRole('');
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
      title="Alterar perfil"
      eyebrow={usuario?.nome}
      icon={<UserCog size={16} />}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={salvar} loading={mudar.isPending} disabled={!role}>
            Salvar
          </Button>
        </>
      }
    >
      <p className="mb-3 text-[13px] text-ink-secondary">
        Perfil atual: <strong className="text-ink-primary">{usuario?.role}</strong>
      </p>
      <Select value={role} onChange={(e) => setRole(e.target.value as Role)} className={cn('w-full')}>
        <option value="" disabled>
          Selecione o novo perfil…
        </option>
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </Select>
    </Modal>
  );
}

function RejeitarModal({ usuario, onClose }: { usuario: UsuarioDTO | null; onClose: () => void }) {
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
      title="Rejeitar cadastro"
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
      <p className="mb-3 text-[13px] text-ink-secondary">
        Informe o motivo da rejeição do cadastro de{' '}
        <strong className="text-ink-primary">{usuario?.nome}</strong>.
      </p>
      <Input placeholder="Motivo da rejeição" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
    </Modal>
  );
}
