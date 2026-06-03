import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Siren,
  AlertOctagon,
  Calendar,
  User as UserIcon,
  MapPin,
} from 'lucide-react';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  SectionHeader,
  Select,
  Skeleton,
  TenantChip,
} from '@/components/ui';
import {
  useAlerta,
  useAlertaDestinatarios,
  useCancelarAlerta,
  useResolverAlerta,
  useVisualizarAlerta,
} from '@/hooks/useAlertas';
import { useMe, useUsuariosByIds } from '@/hooks/useUsuarios';
import { useTenantOptions } from '@/hooks/useTenantTable';
import { apiErrorMessage } from '@/lib/api';
import { formatRelative } from '@/lib/utils';
import type { AlertaDestinatarioDTO, DeliveryStatus } from '@/types/api';
import { AlertSeverityBadge, AlertStatusBadge, CATEGORIA, SEVERITY } from './components/severity';
import { AckProgressBar } from './components/AckProgressBar';
import { AlertCoverageMap } from './components/AlertCoverageMap';
import { EscalateAlertModal } from './EscalateAlertModal';

type Tab = 'overview' | 'destinatarios' | 'timeline';

const DELIVERY_STATUSES: DeliveryStatus[] = [
  'SENT', 'DELIVERED', 'VISUALIZED', 'ACKNOWLEDGED', 'RESPONDED', 'FAILED',
];

const RESPONSE_LABEL: Record<string, { label: string; color: string }> = {
  ACCEPT: { label: 'Aceitou', color: '#22C55E' },
  REFUSE: { label: 'Recusou', color: '#F97316' },
  UNAVAILABLE: { label: 'Indisponível', color: '#EAB308' },
};

export function AlertaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: alerta, isLoading, isError, refetch } = useAlerta(id);
  const { nameById } = useTenantOptions();
  const emissorIds = useMemo(() => (alerta ? [alerta.emissorId] : []), [alerta]);
  const emissorNames = useUsuariosByIds(emissorIds);
  const me = useMe();
  const resolver = useResolverAlerta();
  const cancelar = useCancelarAlerta();
  const visualizar = useVisualizarAlerta();
  const visualizedFiredRef = useRef<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [escalateOpen, setEscalateOpen] = useState(false);

  // Fire visualizar uma única vez ao abrir o detalhe (404 silencioso se não for destinatário).
  useEffect(() => {
    if (!id || visualizedFiredRef.current === id) return;
    if (!me.data?.id) return;
    visualizedFiredRef.current = id;
    visualizar.mutate(id, {
      onError: () => {
        // 404 = usuário não é destinatário — silencia
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, me.data?.id]);

  async function handleResolver() {
    if (!id) return;
    try {
      await resolver.mutateAsync(id);
      toast.success('Alerta resolvido');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleCancelar() {
    if (!id) return;
    try {
      await cancelar.mutateAsync(id);
      toast.success('Alerta cancelado');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  if (isLoading || !id) {
    return (
      <div>
        <Skeleton className="mb-4 h-8 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (isError || !alerta) {
    return <ErrorState action={<Button variant="secondary" onClick={() => refetch()}>Tentar novamente</Button>} />;
  }

  const cat = CATEGORIA[alerta.categoria];
  const sev = SEVERITY[alerta.severidade];
  const Icon = cat.icon;
  const isActive = alerta.status === 'ACTIVE';

  return (
    <div>
      <SectionHeader
        eyebrow="Comunicação"
        title={alerta.titulo ?? alerta.tipoNome}
        barColor={sev.color}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/alertas')}>
              <ArrowLeft size={14} /> Voltar
            </Button>
            {isActive && (
              <>
                <Button variant="secondary" onClick={() => setEscalateOpen(true)}>
                  <Siren size={14} /> Escalar
                </Button>
                <Button variant="danger" onClick={handleCancelar} disabled={cancelar.isPending}>
                  <XCircle size={14} /> Cancelar
                </Button>
                <Button onClick={handleResolver} disabled={resolver.isPending}>
                  <CheckCircle2 size={14} /> Resolver
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-lg border border-white/10 p-0.5 w-fit">
        {([
          { id: 'overview', label: 'Visão geral' },
          { id: 'destinatarios', label: `Destinatários (${alerta.totalDestinatarios})` },
          { id: 'timeline', label: 'Timeline' },
        ] as { id: Tab; label: string }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
              tab === t.id ? 'bg-brand-blue-soft text-ink-primary' : 'text-ink-muted hover:text-ink-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Banner de severidade */}
      <div
        className="mb-6 flex items-start gap-3 rounded-xl border p-4"
        style={{
          background: sev.glow,
          borderColor: `${sev.color}55`,
        }}
      >
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${sev.color}28`, color: sev.color }}
        >
          <Icon size={18} />
        </div>
        <div className="flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <AlertSeverityBadge severidade={alerta.severidade} />
            <AlertStatusBadge status={alerta.status} />
            <span className="text-[11px] uppercase tracking-wide text-ink-muted">{cat.label}</span>
            {alerta.isEscalation && (
              <span className="rounded border border-purple-500/30 bg-purple-500/12 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-400">
                Escalação
              </span>
            )}
          </div>
          <p className="text-[14px] text-ink-primary">{alerta.mensagem}</p>
          {alerta.isEscalation && alerta.escalationMotivo && (
            <p className="mt-2 rounded-md border border-white/8 bg-bg-primary p-3 text-[12px] text-ink-secondary">
              <strong className="text-ink-primary">Motivo do escalonamento:</strong>{' '}
              {alerta.escalationMotivo}
            </p>
          )}
        </div>
      </div>

      {tab === 'overview' && (
        <OverviewTab
          alerta={alerta}
          tenantName={nameById[alerta.tenantId]}
          emissor={emissorNames[alerta.emissorId]}
        />
      )}
      {tab === 'destinatarios' && <DestinatariosTab alertaId={alerta.id} />}
      {tab === 'timeline' && <TimelineTab alerta={alerta} emissor={emissorNames[alerta.emissorId]} />}

      <EscalateAlertModal
        alerta={alerta}
        open={escalateOpen}
        onClose={() => setEscalateOpen(false)}
        onEscalated={(newId) => navigate(`/alertas/${newId}`)}
      />
    </div>
  );
}

/* ───────── Overview tab ───────── */

function OverviewTab({
  alerta,
  tenantName,
  emissor,
}: {
  alerta: ReturnType<typeof useAlerta>['data'] & object;
  tenantName: string | undefined;
  emissor: string | undefined;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
          Cobertura
        </h3>
        <AlertCoverageMap alerta={alerta} height={320} />
      </Card>

      <Card>
        <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
          Metadados
        </h3>
        <dl className="space-y-3 text-[12px]">
          <MetaRow icon={<UserIcon size={12} />} label="Emissor" value={emissor ?? '—'} />
          <MetaRow
            icon={<TenantChip nome={tenantName ?? '—'} />}
            label="Tenant"
            value=""
          />
          <MetaRow
            icon={<Calendar size={12} />}
            label="Criado"
            value={formatRelative(alerta.createdAt)}
          />
          {alerta.dataExpiracao && (
            <MetaRow
              icon={<Calendar size={12} />}
              label="Expira em"
              value={new Date(alerta.dataExpiracao).toLocaleString('pt-BR')}
            />
          )}
          {alerta.autoExpireMinutes != null && (
            <MetaRow
              icon={<Calendar size={12} />}
              label="Auto-expira"
              value={`${alerta.autoExpireMinutes} min após criação`}
            />
          )}
          {alerta.dataResolvido && (
            <MetaRow
              icon={<CheckCircle2 size={12} />}
              label="Resolvido em"
              value={new Date(alerta.dataResolvido).toLocaleString('pt-BR')}
            />
          )}
          {alerta.targetRole && (
            <MetaRow
              icon={<UserIcon size={12} />}
              label="Perfil alvo"
              value={alerta.targetRole}
            />
          )}
          {alerta.idEvento && (
            <MetaRow
              icon={<AlertOctagon size={12} />}
              label="Evento"
              value={
                <Link to={`/eventos/${alerta.idEvento}`} className="text-brand-light hover:underline">
                  Ver evento
                </Link>
              }
            />
          )}
          {alerta.idZonaRisco && (
            <MetaRow
              icon={<MapPin size={12} />}
              label="Zona de risco"
              value={
                <Link to={`/zonas-risco`} className="text-brand-light hover:underline">
                  Ver zona
                </Link>
              }
            />
          )}
          {alerta.raioMetros && (
            <MetaRow
              icon={<MapPin size={12} />}
              label="Raio"
              value={`${(alerta.raioMetros / 1000).toFixed(1)} km`}
            />
          )}
          {alerta.geofenceModes.length > 0 && (
            <MetaRow
              icon={<MapPin size={12} />}
              label="Geofencing"
              value={alerta.geofenceModes.join(', ')}
            />
          )}
        </dl>
      </Card>

      {alerta.requerAck && (
        <Card className="lg:col-span-3">
          <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
            Confirmações ({alerta.ackSummary?.acknowledged ?? 0} / {alerta.totalDestinatarios})
          </h3>
          <AckProgressBar
            summary={alerta.ackSummary}
            total={alerta.totalDestinatarios}
            ackMinimo={alerta.ackMinimo}
          />
        </Card>
      )}

      {alerta.expansionRadiiMetros.length > 0 && (
        <Card className="lg:col-span-3">
          <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
            Expansão automática de raio
          </h3>
          <RadiusExpansionTimeline alerta={alerta} />
        </Card>
      )}
    </div>
  );
}

function RadiusExpansionTimeline({
  alerta,
}: {
  alerta: ReturnType<typeof useAlerta>['data'] & object;
}) {
  const radii = alerta.expansionRadiiMetros;
  const currentStep = alerta.currentExpansionStep;
  const windowMin = alerta.expansionWindowMinutes ?? 5;
  const completed = currentStep >= radii.length - 1;
  return (
    <>
      <div className="mb-4 flex items-center gap-1">
        {radii.map((r, i) => {
          const isCurrent = i === currentStep;
          const reached = i <= currentStep;
          const color = isCurrent ? '#3B82F6' : reached ? '#22C55E' : '#64748B';
          return (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div
                className="flex h-8 w-full items-center justify-center rounded text-[11px] font-bold"
                style={{
                  background: `${color}22`,
                  color,
                  border: `1px solid ${color}55`,
                }}
              >
                {(r / 1000).toFixed(1)} km
              </div>
              {i < radii.length - 1 && (
                <span className="text-ink-muted">→</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 gap-2 text-[12px] text-ink-secondary md:grid-cols-3">
        <span>
          <strong className="text-ink-primary">Raio atual:</strong>{' '}
          {((alerta.raioMetros ?? 0) / 1000).toFixed(1)} km
        </span>
        <span>
          <strong className="text-ink-primary">Janela:</strong> {windowMin} min entre expansões
        </span>
        <span>
          <strong className="text-ink-primary">Última expansão:</strong>{' '}
          {alerta.lastExpansionAt ? new Date(alerta.lastExpansionAt).toLocaleString('pt-BR') : '—'}
        </span>
      </div>
      {completed && (
        <p className="mt-3 text-[12px] text-yellow-400">
          ⚠ Expansão máxima atingida. Considere chamar reforços manualmente.
        </p>
      )}
    </>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-ink-muted">{icon}</span>
      <span className="text-ink-muted">{label}:</span>
      <span className="ml-auto text-right text-ink-primary">{value}</span>
    </div>
  );
}

/* ───────── Destinatários tab ───────── */

function DestinatariosTab({ alertaId }: { alertaId: string }) {
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | ''>('');
  const { data: rows = [], isLoading, isError, refetch } = useAlertaDestinatarios(
    alertaId,
    statusFilter || undefined,
  );

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <h3 className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
          {rows.length} destinatário{rows.length !== 1 ? 's' : ''}
        </h3>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DeliveryStatus | '')}
          className="h-8 w-auto text-[12px]"
        >
          <option value="">Todos os status</option>
          {DELIVERY_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2 p-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : isError ? (
        <ErrorState action={<Button variant="secondary" onClick={() => refetch()}>Tentar novamente</Button>} />
      ) : rows.length === 0 ? (
        <EmptyState title="Sem destinatários" description="Nenhum usuário neste filtro." />
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-bg-primary">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Nome</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Perfil</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Status</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Resposta</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Enviado</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Confirmado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <DestRow key={d.id} d={d} />
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function DestRow({ d }: { d: AlertaDestinatarioDTO }) {
  const statusColor: Record<DeliveryStatus, string> = {
    SENT: '#64748B',
    DELIVERED: '#3B82F6',
    VISUALIZED: '#8B5CF6',
    ACKNOWLEDGED: '#22C55E',
    RESPONDED: '#22C55E',
    FAILED: '#EF4444',
  };
  const c = statusColor[d.deliveryStatus];
  const resp = d.response ? RESPONSE_LABEL[d.response] : null;
  return (
    <tr className="border-b border-white/[0.04] last:border-0">
      <td className="px-4 py-2 text-[13px] text-ink-primary">{d.usuarioNome}</td>
      <td className="px-4 py-2 text-[12px] text-ink-secondary">{d.usuarioRole}</td>
      <td className="px-4 py-2">
        <span
          className="inline-flex rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase"
          style={{ background: `${c}1a`, color: c, borderColor: `${c}55` }}
        >
          {d.deliveryStatus}
        </span>
      </td>
      <td className="px-4 py-2 text-[12px]">
        {resp ? (
          <span style={{ color: resp.color }} className="font-medium">{resp.label}</span>
        ) : (
          <span className="text-ink-muted">—</span>
        )}
      </td>
      <td className="px-4 py-2 text-right text-[11px] text-ink-muted">{formatRelative(d.sentAt)}</td>
      <td className="px-4 py-2 text-right text-[11px] text-ink-muted">
        {d.acknowledgedAt ? formatRelative(d.acknowledgedAt) : '—'}
      </td>
    </tr>
  );
}

/* ───────── Timeline tab ───────── */

function TimelineTab({
  alerta,
  emissor,
}: {
  alerta: ReturnType<typeof useAlerta>['data'] & object;
  emissor: string | undefined;
}) {
  const events: { ts: string; label: string; color: string; detail?: string }[] = [];
  events.push({
    ts: alerta.createdAt,
    label: `Alerta criado por ${emissor ?? '—'}`,
    color: '#3B82F6',
    detail: `${alerta.totalDestinatarios} destinatário${alerta.totalDestinatarios !== 1 ? 's' : ''} enfileirado${alerta.totalDestinatarios !== 1 ? 's' : ''}`,
  });
  if (alerta.ackSummary && alerta.ackSummary.delivered > 0) {
    events.push({
      ts: alerta.createdAt,
      label: `${alerta.ackSummary.delivered} entregas concluídas`,
      color: '#22C55E',
    });
  }
  if (alerta.ackSummary && (alerta.ackSummary.acknowledged + alerta.ackSummary.accepted) > 0) {
    events.push({
      ts: alerta.createdAt,
      label: `${alerta.ackSummary.acknowledged + alerta.ackSummary.accepted} confirmações recebidas`,
      color: '#22C55E',
    });
  }
  if (alerta.ackSummary && alerta.ackSummary.failed > 0) {
    events.push({
      ts: alerta.createdAt,
      label: `${alerta.ackSummary.failed} falhas de entrega`,
      color: '#EF4444',
    });
  }
  if (alerta.dataResolvido) {
    events.push({
      ts: alerta.dataResolvido,
      label: alerta.status === 'RESOLVED' ? 'Alerta resolvido' : 'Alerta cancelado',
      color: alerta.status === 'RESOLVED' ? '#22C55E' : '#64748B',
    });
  }

  return (
    <Card className="p-5">
      <div className="space-y-3">
        {events.map((e, i) => (
          <div key={i} className="flex items-start gap-3">
            <span
              className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ring-2 ring-bg-secondary"
              style={{ background: e.color }}
            />
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] font-medium text-ink-primary">{e.label}</span>
                <span className="text-[11px] text-ink-muted">{formatRelative(e.ts)}</span>
              </div>
              {e.detail && <p className="text-[12px] text-ink-secondary">{e.detail}</p>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
