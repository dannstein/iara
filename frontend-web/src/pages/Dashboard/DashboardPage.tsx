import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Users, Home, Package, ShieldAlert } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  StatCard,
  SectionHeader,
  Card,
  SeverityBadge,
  StatusBadge,
  Skeleton,
} from '@/components/ui';
import { StartTriageCard } from '@/components/StartTriageCard';
import {
  useDashboardEventos,
  useDashboardIncidentes,
  useDashboardAbrigos,
  useDashboardPcs,
  useDashboardTecnicos,
} from '@/hooks/useDashboard';
import { useEventos } from '@/hooks/useEventos';
import { useDashboardZonasSemApoio } from '@/hooks/useZonasRisco';
import { formatRelative } from '@/lib/utils';

const tooltipStyle = {
  background: '#1A2332',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  fontSize: 12,
  color: '#F0F4F8',
};
// Recharts pinta o texto dos itens/label com a cor da série (escura) por padrão.
// Forçamos cores legíveis no tema escuro.
const tooltipItemStyle = { color: '#F0F4F8' };
const tooltipLabelStyle = { color: '#94A3B8' };

export function DashboardPage() {
  const navigate = useNavigate();
  const eventos = useDashboardEventos();
  const incidentes = useDashboardIncidentes();
  const abrigos = useDashboardAbrigos();
  const pcs = useDashboardPcs();
  const tecnicos = useDashboardTecnicos();
  const zonasApoio = useDashboardZonasSemApoio();
  const criticos = useEventos({ severidade: 'CRITICA' });

  const ativos = (eventos.data?.ATIVO ?? 0) + (eventos.data?.ALERTA_CRITICO ?? 0);
  const ocupacaoPct = abrigos.data?.capacidade_total
    ? Math.round((abrigos.data.ocupacao_total / abrigos.data.capacidade_total) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Visão geral — KPIs */}
      <section>
        <SectionHeader eyebrow="Operações" title="Visão Geral" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {eventos.isLoading ? (
            <KpiSkeletons />
          ) : (
            <>
              <StatCard
                eyebrow="Eventos"
                title="Ativos agora"
                value={ativos}
                icon={<AlertTriangle size={20} />}
                variant={ativos > 0 ? 'critica' : 'default'}
              />
              <StatCard
                eyebrow="Equipe"
                title="Técnicos disponíveis"
                value={tecnicos.data?.tecnicos_disponiveis ?? '—'}
                icon={<Users size={20} />}
                variant="brand"
              />
              <StatCard
                eyebrow="Abrigos"
                title="Ocupação"
                value={`${ocupacaoPct}%`}
                icon={<Home size={20} />}
                variant={ocupacaoPct >= 90 ? 'alta' : 'default'}
              />
              <StatCard
                eyebrow="Coleta"
                title="Demandas pendentes"
                value={pcs.data?.demandas_pendentes ?? '—'}
                icon={<Package size={20} />}
                variant={(pcs.data?.demandas_pendentes ?? 0) > 0 ? 'media' : 'default'}
              />
              <StatCard
                eyebrow="Risco"
                title="Zonas sem apoio"
                value={zonasApoio.data?.SEM_APOIO ?? '—'}
                icon={<ShieldAlert size={20} />}
                variant={(zonasApoio.data?.SEM_APOIO ?? 0) > 0 ? 'media' : 'baixa'}
              />
            </>
          )}
        </div>
      </section>

      {/* Eventos críticos + distribuição */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <SectionHeader
            eyebrow="Atenção imediata"
            title="Eventos Críticos"
            barColor="#EF4444"
            action={
              <button
                onClick={() => navigate('/eventos?severidade=CRITICA')}
                className="text-[12px] text-brand-light hover:underline"
              >
                Ver todos
              </button>
            }
          />
          {criticos.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (criticos.data?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-[13px] text-ink-muted">
              Nenhum evento crítico ativo. 🟢
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-white/[0.04]">
              {criticos.data!.slice(0, 6).map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => navigate(`/eventos/${ev.id}`)}
                  className="flex items-center gap-3 py-2.5 text-left transition-colors hover:bg-white/[0.02]"
                >
                  <SeverityBadge severity={ev.severidade} />
                  <span className="flex-1 truncate text-[13px] text-ink-primary">{ev.titulo}</span>
                  <StatusBadge status={ev.status} />
                  <span className="w-20 text-right text-[11px] text-ink-muted">
                    {formatRelative(ev.dataSolicitacao)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionHeader eyebrow="Distribuição" title="Eventos por Status" />
          <StatusPie data={eventos.data} />
        </Card>
      </section>

      {/* Triagem START + incidentes */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <StartTriageCard
            vermelho={incidentes.data?.start_vermelho ?? 0}
            amarelo={incidentes.data?.start_amarelo ?? 0}
            verde={incidentes.data?.start_verde ?? 0}
            preto={incidentes.data?.start_preto ?? 0}
          />
        </div>
        <Card>
          <SectionHeader eyebrow="Consolidado" title="Vítimas" barColor="#F97316" />
          <IncidentesBars incidentes={incidentes.data} />
        </Card>
      </section>
    </div>
  );
}

function KpiSkeletons() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
      ))}
    </>
  );
}

function StatusPie({ data }: { data?: Record<string, number> }) {
  if (!data) return <Skeleton className="h-48 w-full" />;
  const palette: Record<string, string> = {
    ATIVO: '#3B82F6',
    ALERTA_CRITICO: '#EF4444',
    SOLICITADO: '#64748B',
    ENCERRADO: '#22C55E',
    CANCELADO: '#374151',
  };
  const entries = Object.entries(data).filter(([k]) => k !== 'total' && data[k] > 0);
  if (entries.length === 0)
    return <p className="py-12 text-center text-[13px] text-ink-muted">Sem eventos no período.</p>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={entries.map(([name, value]) => ({ name, value }))}
          dataKey="value"
          nameKey="name"
          innerRadius={45}
          outerRadius={75}
          paddingAngle={2}
        >
          {entries.map(([name]) => (
            <Cell key={name} fill={palette[name] ?? '#64748B'} stroke="none" />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function IncidentesBars({ incidentes }: { incidentes?: { mortos: number; feridos: number; desabrigados: number; desaparecidos: number } }) {
  if (!incidentes) return <Skeleton className="h-48 w-full" />;
  const data = [
    { name: 'Feridos', value: incidentes.feridos, color: '#F97316' },
    { name: 'Desabrigados', value: incidentes.desabrigados, color: '#EAB308' },
    { name: 'Desaparecidos', value: incidentes.desaparecidos, color: '#3B82F6' },
    { name: 'Óbitos', value: incidentes.mortos, color: '#EF4444' },
  ];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#94A3B8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          itemStyle={tooltipItemStyle}
          labelStyle={tooltipLabelStyle}
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
