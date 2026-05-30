import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Calendar, Clock, PlayCircle, PauseCircle, Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  SectionHeader,
  Select,
  Skeleton,
  StatCard,
  TenantChip,
} from '@/components/ui';
import {
  useAgendamentos,
  useAtivarAgendamento,
  useDesativarAgendamento,
  useRemoverAgendamento,
} from '@/hooks/useAgendamentos';
import { useUsuariosByIds } from '@/hooks/useUsuarios';
import { useTenantOptions } from '@/hooks/useTenantTable';
import { apiErrorMessage } from '@/lib/api';
import { formatRelative } from '@/lib/utils';
import type { AlertaAgendadoDTO, AlertaCategoria } from '@/types/api';
import { CATEGORIA } from './components/severity';
import { describeRecurrence } from './components/RecurrencePicker';

const CATEGORIAS: AlertaCategoria[] = [
  'DANGER_ZONE', 'EVENT_ZONE', 'TENANT_BROADCAST', 'TECHNICAL_REQUEST',
  'SUPPORT_POINTS', 'COLLECTION_POINTS', 'MONITORS', 'PERSONALIZED',
];

export function AgendamentosPage() {
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'pausados'>('todos');
  const [catFilter, setCatFilter] = useState<AlertaCategoria | ''>('');

  const { data: list = [], isLoading, isError, refetch } = useAgendamentos({
    ativo: statusFilter === 'ativos' ? true : statusFilter === 'pausados' ? false : undefined,
    categoria: catFilter || undefined,
  });
  const { nameById } = useTenantOptions();
  const criadorIds = Array.from(new Set(list.map((a) => a.criadorId)));
  const criadorNames = useUsuariosByIds(criadorIds);

  const ativos = list.filter((a) => a.isAtivo).length;
  const pausados = list.filter((a) => !a.isAtivo).length;
  const proximas24h = list.filter((a) => {
    if (!a.isAtivo) return false;
    const t = new Date(a.proximaExecucao).getTime();
    return t > Date.now() && t < Date.now() + 24 * 3600_000;
  }).length;
  const executadosHoje = list.filter((a) => {
    if (!a.ultimaExecucao) return false;
    const d = new Date(a.ultimaExecucao);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  return (
    <div>
      <SectionHeader
        eyebrow="Comunicação"
        title="Agendamentos de Alertas"
        action={
          <Link to="/alertas/agendamentos/novo">
            <Button><Plus size={15} /> Novo agendamento</Button>
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard eyebrow="Em execução" title="Ativos" value={ativos} icon={<PlayCircle size={20} />} variant="brand" />
        <StatCard eyebrow="Em pausa" title="Pausados" value={pausados} icon={<PauseCircle size={20} />} />
        <StatCard eyebrow="Próximas 24h" title="Disparos previstos" value={proximas24h} icon={<Clock size={20} />} />
        <StatCard eyebrow="Histórico" title="Executados hoje" value={executadosHoje} icon={<Calendar size={20} />} />
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'todos' | 'ativos' | 'pausados')}>
          <option value="todos">Todos</option>
          <option value="ativos">Apenas ativos</option>
          <option value="pausados">Apenas pausados</option>
        </Select>
        <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value as AlertaCategoria)}>
          <option value="">Toda categoria</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{CATEGORIA[c].label}</option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : isError ? (
        <ErrorState action={<Button variant="secondary" onClick={() => refetch()}>Tentar novamente</Button>} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Clock size={40} />}
          title="Nenhum agendamento ainda"
          description="Crie agendamentos para disparar alertas em datas futuras com recorrência."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-bg-primary">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Nome</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Categoria</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Recorrência</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Próxima</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Última</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Criador</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Status</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <Row key={a.id} a={a} tenantName={nameById[a.tenantId]} criadorName={criadorNames[a.criadorId]} />
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function Row({
  a,
  tenantName,
  criadorName,
}: {
  a: AlertaAgendadoDTO;
  tenantName: string | undefined;
  criadorName: string | undefined;
}) {
  const ativar = useAtivarAgendamento();
  const desativar = useDesativarAgendamento();
  const remover = useRemoverAgendamento();

  async function toggle() {
    try {
      if (a.isAtivo) await desativar.mutateAsync(a.id);
      else await ativar.mutateAsync(a.id);
      toast.success(a.isAtivo ? 'Agendamento pausado' : 'Agendamento reativado');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function deletar() {
    if (!confirm(`Remover o agendamento "${a.nome}"?`)) return;
    try {
      await remover.mutateAsync(a.id);
      toast.success('Agendamento removido');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <tr className="border-b border-white/[0.04] last:border-0">
      <td className="px-4 py-3 text-[13px] font-medium text-ink-primary">{a.nome}</td>
      <td className="px-4 py-3 text-[12px] text-ink-secondary">{CATEGORIA[a.categoria]?.label ?? a.categoria}</td>
      <td className="px-4 py-3 text-[12px] text-ink-secondary">
        {describeRecurrence(a)}
      </td>
      <td className="px-4 py-3 text-[11px] text-ink-secondary">
        {new Date(a.proximaExecucao).toLocaleString('pt-BR')}
      </td>
      <td className="px-4 py-3 text-[11px] text-ink-muted">
        {a.ultimaExecucao ? formatRelative(a.ultimaExecucao) : '—'}
      </td>
      <td className="px-4 py-3 text-[12px] text-ink-secondary">
        {criadorName ?? '—'}{tenantName ? <> · <TenantChip nome={tenantName} /></> : null}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${
            a.isAtivo
              ? 'border-green-500/30 bg-green-500/15 text-green-400'
              : 'border-white/15 bg-white/5 text-ink-muted'
          }`}
        >
          {a.isAtivo ? 'Ativo' : 'Pausado'}
        </span>
        {a.ultimoErro && (
          <p className="mt-1 text-[10px] text-severity-critica" title={a.ultimoErro}>
            Erro recente
          </p>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <button onClick={toggle} className="btn-ghost px-2 py-1 text-[12px]" disabled={ativar.isPending || desativar.isPending}>
          {a.isAtivo ? <><PauseCircle size={13} /> Pausar</> : <><PlayCircle size={13} /> Ativar</>}
        </button>
        <button onClick={deletar} className="btn-ghost px-2 py-1 text-[12px] text-severity-critica" disabled={remover.isPending}>
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  );
}
