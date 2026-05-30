import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Siren, AlertOctagon, Clock, CheckCircle2 } from 'lucide-react';
import {
  SectionHeader,
  StatCard,
  Card,
  Select,
  Skeleton,
  EmptyState,
  ErrorState,
  Button,
  TenantChip,
} from '@/components/ui';
import { SearchInput } from '@/components/SearchInput';
import { useAlertas, useAlertasDashboard } from '@/hooks/useAlertas';
import { useUsuariosByIds } from '@/hooks/useUsuarios';
import { formatRelative } from '@/lib/utils';
import { useTenantOptions } from '@/hooks/useTenantTable';
import type { AlertaCategoria, AlertaDTO, AlertaSeveridade, AlertaStatus } from '@/types/api';
import { AlertSeverityBadge, AlertStatusBadge, CATEGORIA, SEVERITY } from './components/severity';
import { AckProgressBar } from './components/AckProgressBar';

type View = 'timeline' | 'ativos' | 'historico';

const SEVERIDADES: AlertaSeveridade[] = [
  'INFO', 'WARNING', 'DANGER', 'CRITICAL', 'EMERGENCY', 'SOLICITATION', 'OPERATIONAL',
];
const CATEGORIAS: AlertaCategoria[] = [
  'DANGER_ZONE', 'EVENT_ZONE', 'TENANT_BROADCAST', 'TECHNICAL_REQUEST',
  'SUPPORT_POINTS', 'COLLECTION_POINTS', 'MONITORS', 'PERSONALIZED', 'ESCALATION',
];
const STATUSES: AlertaStatus[] = ['ACTIVE', 'EXPIRED', 'RESOLVED', 'CANCELLED'];

export function AlertasCommandCenter() {
  const [view, setView] = useState<View>('timeline');
  const [search, setSearch] = useState('');
  const [sevFilter, setSevFilter] = useState<AlertaSeveridade | ''>('');
  const [catFilter, setCatFilter] = useState<AlertaCategoria | ''>('');
  const [statusFilter, setStatusFilter] = useState<AlertaStatus | ''>('');

  const { nameById } = useTenantOptions();

  // Default status filter by view
  const effectiveStatus =
    view === 'historico' ? statusFilter || undefined
      : view === 'ativos' ? 'ACTIVE' as const
      : undefined;

  const { data, isLoading, isError, refetch } = useAlertas({
    status: effectiveStatus,
    severidade: sevFilter || undefined,
    categoria: catFilter || undefined,
  });
  const { data: dashboard } = useAlertasDashboard();

  const list = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (data ?? []).filter((a) => {
      if (!q) return true;
      return (
        (a.titulo ?? '').toLowerCase().includes(q) ||
        a.mensagem.toLowerCase().includes(q) ||
        a.categoria.toLowerCase().includes(q) ||
        a.severidade.toLowerCase().includes(q)
      );
    });
  }, [data, search]);

  const emissorIds = useMemo(
    () => Array.from(new Set(list.map((a) => a.emissorId))),
    [list],
  );
  const emissorNames = useUsuariosByIds(emissorIds);

  return (
    <div>
      <SectionHeader
        eyebrow="Comunicação"
        title="Central de Alertas"
        action={
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-lg border border-white/10 p-0.5">
              {(['timeline', 'ativos', 'historico'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    view === v
                      ? 'bg-brand-blue-soft text-ink-primary'
                      : 'text-ink-muted hover:text-ink-secondary'
                  }`}
                >
                  {v === 'timeline' ? 'Timeline' : v === 'ativos' ? 'Ativos' : 'Histórico'}
                </button>
              ))}
            </div>
            <Link to="/alertas/novo">
              <Button>
                <Plus size={15} /> Novo alerta
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          eyebrow="Em curso"
          title="Alertas ativos"
          value={dashboard?.ativos ?? 0}
          icon={<Siren size={20} />}
          variant="brand"
        />
        <StatCard
          eyebrow="Atenção máxima"
          title="Críticos / Emergência"
          value={dashboard?.criticosAtivos ?? 0}
          icon={<AlertOctagon size={20} />}
          variant={(dashboard?.criticosAtivos ?? 0) > 0 ? 'critica' : 'default'}
        />
        <StatCard
          eyebrow="Aguardando resposta"
          title="Acks pendentes"
          value={dashboard?.acksPendentes ?? 0}
          icon={<Clock size={20} />}
          variant={(dashboard?.acksPendentes ?? 0) > 0 ? 'media' : 'default'}
        />
        <StatCard
          eyebrow="Hoje"
          title="Resolvidos"
          value={dashboard?.resolvidosHoje ?? 0}
          icon={<CheckCircle2 size={20} />}
        />
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por título, mensagem ou categoria…" />
        <Select value={sevFilter} onChange={(e) => setSevFilter(e.target.value as AlertaSeveridade)}>
          <option value="">Toda severidade</option>
          {SEVERIDADES.map((s) => (
            <option key={s} value={s}>{SEVERITY[s].label}</option>
          ))}
        </Select>
        <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value as AlertaCategoria)}>
          <option value="">Toda categoria</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{CATEGORIA[c].label}</option>
          ))}
        </Select>
        {view === 'historico' && (
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AlertaStatus)}>
            <option value="">Todos os status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        )}
      </div>

      {/* Lista / Timeline */}
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState action={<Button variant="secondary" onClick={() => refetch()}>Tentar novamente</Button>} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Siren size={40} />}
          title="Nenhum alerta encontrado"
          description={
            view === 'ativos'
              ? 'Não há alertas ativos no escopo. Bom sinal.'
              : 'Ajuste os filtros ou crie um novo alerta.'
          }
        />
      ) : view === 'timeline' ? (
        <TimelineView alertas={list} nameById={nameById} emissorNames={emissorNames} />
      ) : (
        <ListView alertas={list} nameById={nameById} emissorNames={emissorNames} />
      )}
    </div>
  );
}

/* ── Timeline (agrupada por dia) ───────────────────────────────────────── */

function TimelineView({
  alertas,
  nameById,
  emissorNames,
}: {
  alertas: AlertaDTO[];
  nameById: Record<string, string>;
  emissorNames: Record<string, string>;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, AlertaDTO[]>();
    for (const a of alertas) {
      const day = new Date(a.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
      });
      const arr = map.get(day) ?? [];
      arr.push(a);
      map.set(day, arr);
    }
    return Array.from(map.entries());
  }, [alertas]);

  return (
    <div className="space-y-6">
      {groups.map(([day, items]) => (
        <div key={day}>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/8 to-transparent" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
              {day}
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/8 to-transparent" />
          </div>
          <div className="space-y-2">
            {items.map((a) => (
              <TimelineRow
                key={a.id}
                alerta={a}
                tenantName={nameById[a.tenantId]}
                emissor={emissorNames[a.emissorId]}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineRow({
  alerta,
  tenantName,
  emissor,
}: {
  alerta: AlertaDTO;
  tenantName: string | undefined;
  emissor: string | undefined;
}) {
  const sev = SEVERITY[alerta.severidade];
  const cat = CATEGORIA[alerta.categoria];
  const Icon = cat.icon;
  return (
    <Link
      to={`/alertas/${alerta.id}`}
      className="block rounded-xl border border-white/[0.08] bg-bg-secondary p-4 transition-all hover:-translate-y-px hover:border-white/14"
      style={{ borderLeftColor: sev.color, borderLeftWidth: 3 }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ background: sev.glow, color: sev.color }}
        >
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <AlertSeverityBadge severidade={alerta.severidade} size="sm" />
            <AlertStatusBadge status={alerta.status} />
            <span className="text-[10px] uppercase tracking-wide text-ink-muted">{cat.label}</span>
            {alerta.isEscalation && (
              <span className="rounded border border-purple-500/30 bg-purple-500/12 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-400">
                Escalação
              </span>
            )}
            {tenantName && <TenantChip nome={tenantName} />}
            <span className="ml-auto text-[11px] text-ink-muted">{formatRelative(alerta.createdAt)}</span>
          </div>
          <h3 className="truncate text-[14px] font-semibold text-ink-primary">
            {alerta.titulo ?? alerta.tipoNome}
          </h3>
          <p className="line-clamp-2 text-[12px] text-ink-secondary">{alerta.mensagem}</p>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-muted">
            <span>Emissor: {emissor ?? '—'}</span>
            <span>Destinatários: {alerta.totalDestinatarios}</span>
            {alerta.requerAck && alerta.ackSummary && (
              <span>
                Acks: {alerta.ackSummary.acknowledged + alerta.ackSummary.accepted}/{alerta.totalDestinatarios}
              </span>
            )}
          </div>
        </div>
      </div>
      {alerta.requerAck && alerta.ackSummary && (
        <div className="mt-3">
          <AckProgressBar
            summary={alerta.ackSummary}
            total={alerta.totalDestinatarios}
            ackMinimo={alerta.ackMinimo}
          />
        </div>
      )}
    </Link>
  );
}

/* ── Lista densa ───────────────────────────────────────────────────────── */

function ListView({
  alertas,
  nameById,
  emissorNames,
}: {
  alertas: AlertaDTO[];
  nameById: Record<string, string>;
  emissorNames: Record<string, string>;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5 bg-bg-primary">
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Severidade</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Título</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Categoria</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Tenant</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Emissor</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Status</th>
            <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Destinatários</th>
            <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Quando</th>
          </tr>
        </thead>
        <tbody>
          {alertas.map((a) => (
            <tr
              key={a.id}
              className="cursor-pointer border-b border-white/[0.04] transition-colors hover:bg-white/[0.025] last:border-0"
              onClick={() => (window.location.href = `/alertas/${a.id}`)}
            >
              <td className="px-4 py-3"><AlertSeverityBadge severidade={a.severidade} size="sm" /></td>
              <td className="px-4 py-3 text-[13px] font-medium text-ink-primary">
                {a.titulo ?? a.tipoNome}
              </td>
              <td className="px-4 py-3 text-[12px] text-ink-secondary">{CATEGORIA[a.categoria].label}</td>
              <td className="px-4 py-3 text-[12px] text-ink-secondary">{nameById[a.tenantId] ?? '—'}</td>
              <td className="px-4 py-3 text-[12px] text-ink-secondary">{emissorNames[a.emissorId] ?? '—'}</td>
              <td className="px-4 py-3"><AlertStatusBadge status={a.status} /></td>
              <td className="px-4 py-3 text-right text-[12px] font-mono text-ink-secondary">{a.totalDestinatarios}</td>
              <td className="px-4 py-3 text-right text-[11px] text-ink-muted">{formatRelative(a.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
