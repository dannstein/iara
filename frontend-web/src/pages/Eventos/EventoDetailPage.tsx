import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Check,
  Ban,
  MapPin,
  Clock,
  CircleAlert,
  Plus,
  Users,
  HeartPulse,
} from 'lucide-react';
import {
  SeverityBadge,
  StatusBadge,
  SectionHeader,
  Button,
  Input,
  Skeleton,
  PulseDot,
  LoadingBlock,
  ErrorState,
  Modal,
} from '@/components/ui';
import { StartTriageCard } from '@/components/StartTriageCard';
import {
  useEvento,
  useEventoIncidentesAtual,
  useEventoIncidentes,
  useEventoTriagem,
  useEventoHistorico,
  useEventoFide,
  useEventoMural,
  useEventoCheckins,
  useEventoPontosColeta,
  useRegistrarIncidentes,
  useAprovarEvento,
  useCancelarEvento,
  useValidarFide,
  useAtualizarFide,
  useSubmeterFide,
  type FideInput,
  type IncidentesInput,
} from '@/hooks/useEventos';
import { useUsuario, useUsuariosByIds } from '@/hooks/useUsuarios';
import { NovaDemandaModal } from './NovaDemandaModal';
import { useAuthStore, hasRole } from '@/store/authStore';
import { apiErrorMessage } from '@/lib/api';
import { formatAbsolute, formatRelative, prioridadeConfig, distanceMeters } from '@/lib/utils';
import type { Coordenadas, IncidentesDTO } from '@/types/api';

const TABS = [
  'Visão Geral',
  'Incidentes / START',
  'Demandas',
  'FIDE',
  'Histórico',
] as const;
type Tab = (typeof TABS)[number];

export function EventoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Visão Geral');
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data: evento, isLoading, isError } = useEvento(id);
  const aprovar = useAprovarEvento();
  const cancelar = useCancelarEvento();
  const role = useAuthStore((s) => s.user?.role);
  const isGestor = hasRole(role, 'GESTOR');

  if (isLoading) return <LoadingBlock />;
  if (isError || !evento) return <ErrorState />;

  function handleAprovar() {
    aprovar.mutate(evento!.id, {
      onSuccess: () => toast.success('Evento aprovado e ativado.'),
      onError: (e) => toast.error(apiErrorMessage(e)),
    });
  }

  function handleCancelar() {
    cancelar.mutate(
      { id: evento!.id },
      {
        onSuccess: () => {
          toast.success('Evento cancelado.');
          setCancelOpen(false);
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
      },
    );
  }

  return (
    <div>
      {/* Cabeçalho */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-[12px] text-ink-muted hover:text-ink-secondary"
      >
        <ArrowLeft size={14} /> Voltar
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <SeverityBadge severity={evento.severidade} />
            <StatusBadge status={evento.status} />
            {evento.isSimulado && (
              <span className="rounded border border-purple-500/25 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-purple-400">
                Simulado
              </span>
            )}
          </div>
          <h1 className="text-[22px] font-bold text-ink-primary">{evento.titulo}</h1>
          <p className="mt-1 flex items-center gap-3 text-[12px] text-ink-muted">
            <span>{evento.tipoNome}</span>
            {evento.cobradeCod && <span className="data-mono">{evento.cobradeCod}</span>}
            <span className="flex items-center gap-1">
              <Clock size={11} /> {formatRelative(evento.dataSolicitacao)}
            </span>
          </p>
        </div>

        {isGestor && (
          <div className="flex gap-2">
            {evento.status === 'SOLICITADO' && (
              <>
                <Button onClick={handleAprovar} loading={aprovar.isPending}>
                  <Check size={15} /> Aprovar
                </Button>
                <Button variant="danger" onClick={() => setCancelOpen(true)}>
                  <Ban size={15} /> Cancelar
                </Button>
              </>
            )}
            <Link to={`/mapa?evento=${evento.id}`}>
              <Button variant="secondary">
                <MapPin size={15} /> Ver no mapa
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-white/5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
              tab === t
                ? 'border-brand-dark text-ink-primary'
                : 'border-transparent text-ink-muted hover:text-ink-secondary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Visão Geral' && (
        <VisaoGeral eventoId={evento.id} descricao={evento.descricao} canManage={isGestor} />
      )}
      {tab === 'Incidentes / START' && <IncidentesTab eventoId={evento.id} canManage={isGestor} />}
      {tab === 'Demandas' && (
        <DemandasTab eventoId={evento.id} coordenadas={evento.coordenadas} canManage={isGestor} />
      )}
      {tab === 'FIDE' && <FideTab eventoId={evento.id} canManage={isGestor} />}
      {tab === 'Histórico' && <HistoricoTab eventoId={evento.id} />}

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancelar evento"
        eyebrow="Ação irreversível"
        icon={<CircleAlert size={16} />}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>
              Voltar
            </Button>
            <Button variant="danger" onClick={handleCancelar} loading={cancelar.isPending}>
              Confirmar cancelamento
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-ink-secondary">
          Tem certeza que deseja cancelar <strong className="text-ink-primary">{evento.titulo}</strong>?
          Só é possível cancelar eventos em estado SOLICITADO.
        </p>
      </Modal>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-bg-secondary p-4">
      <p className="eyebrow mb-1">{label}</p>
      <p className="text-[14px] text-ink-primary">{value}</p>
    </div>
  );
}

function VisaoGeral({
  eventoId,
  descricao,
  canManage,
}: {
  eventoId: string;
  descricao: string | null;
  canManage: boolean;
}) {
  const { data: evento } = useEvento(eventoId);
  const checkins = useEventoCheckins(eventoId);
  const solicitante = useUsuario(evento?.solicitanteId);
  const aprovador = useUsuario(evento?.aprovadorId ?? undefined);
  const [checkinsOpen, setCheckinsOpen] = useState(false);

  if (!evento) return null;

  const emCampo = checkins.data?.filter((c) => !c.dataCheckout).length ?? 0;
  const totalCheckins = checkins.data?.length ?? 0;

  const emCampoTile = (
    <span className="flex items-center gap-1.5">
      <Users size={15} className="text-brand-light" />
      {emCampo}
      <span className="text-[12px] text-ink-muted">/ {totalCheckins} check-ins</span>
    </span>
  );

  return (
    <div className="flex flex-col gap-4">
      {descricao && (
        <div className="rounded-xl border border-white/[0.06] bg-bg-secondary p-5">
          <p className="eyebrow mb-2">Descrição</p>
          <p className="text-[14px] leading-relaxed text-ink-secondary">{descricao}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {canManage ? (
          <button
            type="button"
            onClick={() => setCheckinsOpen(true)}
            className="rounded-lg border border-white/[0.06] bg-bg-secondary p-4 text-left transition-colors hover:border-brand-dark/50 hover:bg-white/[0.02]"
          >
            <p className="eyebrow mb-1 flex items-center justify-between">
              Em campo agora <span className="text-brand-light">ver lista →</span>
            </p>
            <p className="text-[14px] text-ink-primary">{emCampoTile}</p>
          </button>
        ) : (
          <InfoTile label="Em campo agora" value={emCampoTile} />
        )}
        <InfoTile label="Upvotes" value={evento.upvotes} />
        <InfoTile
          label="Raio afetado"
          value={evento.raioMetros ? `${(evento.raioMetros / 1000).toFixed(1)} km` : '—'}
        />
        <InfoTile label="Status FIDE" value={evento.fideStatus.replace('_', ' ')} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <InfoTile label="Solicitado por" value={solicitante.data?.nome ?? '—'} />
        <InfoTile
          label="Aprovado por"
          value={evento.aprovadorId ? (aprovador.data?.nome ?? '—') : 'Aguardando aprovação'}
        />
        <InfoTile
          label="Coordenadas"
          value={
            <span className="data-mono text-[12px]">
              {evento.coordenadas.lat.toFixed(4)}, {evento.coordenadas.lng.toFixed(4)}
            </span>
          }
        />
      </div>

      <CheckinsModal eventoId={eventoId} open={checkinsOpen} onClose={() => setCheckinsOpen(false)} />
    </div>
  );
}

function CheckinsModal({
  eventoId,
  open,
  onClose,
}: {
  eventoId: string;
  open: boolean;
  onClose: () => void;
}) {
  const checkins = useEventoCheckins(open ? eventoId : undefined);
  const nameById = useUsuariosByIds((checkins.data ?? []).map((c) => c.usuarioId));
  const rows = checkins.data ?? [];
  const emCampo = rows.filter((c) => !c.dataCheckout);
  const sairam = rows.filter((c) => c.dataCheckout);
  const ordered = [...emCampo, ...sairam];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Check-ins no evento"
      eyebrow={`${emCampo.length} em campo · ${rows.length} no total`}
      icon={<Users size={16} />}
      maxWidth="max-w-lg"
    >
      {checkins.isLoading ? (
        <LoadingBlock />
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-ink-muted">Nenhum check-in registrado.</p>
      ) : (
        <div className="flex max-h-[60vh] flex-col gap-1.5 overflow-y-auto">
          {ordered.map((c) => {
            const ativo = !c.dataCheckout;
            return (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-bg-secondary px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <PulseDot color={ativo ? '#22C55E' : '#64748B'} />
                  <div>
                    <p className="text-[13px] font-medium text-ink-primary">
                      {nameById[c.usuarioId] ?? 'Usuário'}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      Check-in {formatRelative(c.dataCheckin)}
                      {c.coordenadas && (
                        <span className="data-mono ml-2">
                          {c.coordenadas.lat.toFixed(3)}, {c.coordenadas.lng.toFixed(3)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    ativo ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-ink-muted'
                  }`}
                >
                  {ativo ? 'Em campo' : 'Saiu'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

const TRIAGEM_COR: Record<string, { label: string; hex: string }> = {
  VERMELHO: { label: 'Imediato', hex: '#EF4444' },
  AMARELO: { label: 'Urgente', hex: '#EAB308' },
  VERDE: { label: 'Ambulante', hex: '#22C55E' },
  PRETO: { label: 'Expectante', hex: '#9CA3AF' },
};

function IncidentesTab({ eventoId, canManage }: { eventoId: string; canManage: boolean }) {
  const atual = useEventoIncidentesAtual(eventoId);
  const historico = useEventoIncidentes(eventoId);
  const triagem = useEventoTriagem(eventoId);
  const [registrarOpen, setRegistrarOpen] = useState(false);

  const inc = atual.data;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <SectionHeader eyebrow="Consolidado" title="Vítimas e desalojados" barColor="#F97316" />
        {canManage && (
          <Button onClick={() => setRegistrarOpen(true)}>
            <Plus size={15} /> Registrar atualização
          </Button>
        )}
      </div>

      {atual.isLoading ? (
        <LoadingBlock />
      ) : !inc ? (
        <div className="rounded-xl border border-white/[0.06] bg-bg-secondary py-10 text-center">
          <p className="text-[13px] text-ink-muted">Nenhum registro de incidentes ainda.</p>
          {canManage && (
            <Button className="mx-auto mt-3" onClick={() => setRegistrarOpen(true)}>
              <Plus size={15} /> Registrar primeiro balanço
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <InfoTile label="Óbitos" value={<span className="text-red-400">{inc.mortos}</span>} />
            <InfoTile label="Feridos" value={inc.feridos} />
            <InfoTile label="Desabrigados" value={inc.desabrigados} />
            <InfoTile label="Desaparecidos" value={inc.desaparecidos} />
          </div>
          <p className="-mt-2 text-[11px] text-ink-muted">
            Última atualização {formatRelative(inc.createdAt)}.
          </p>
          <StartTriageCard
            vermelho={inc.startVermelho}
            amarelo={inc.startAmarelo}
            verde={inc.startVerde}
            preto={inc.startPreto}
          />
        </>
      )}

      {/* Vítimas triadas individualmente */}
      <div>
        <SectionHeader eyebrow="Protocolo START" title="Vítimas triadas" barColor="#EF4444" />
        {triagem.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (triagem.data?.length ?? 0) === 0 ? (
          <p className="py-6 text-center text-[13px] text-ink-muted">Nenhuma vítima triada registrada.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {triagem.data!.map((t) => {
              const cor = TRIAGEM_COR[t.classificacao] ?? { label: t.classificacao, hex: '#64748B' };
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-bg-secondary px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="rounded px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{ background: `${cor.hex}22`, color: cor.hex }}
                    >
                      {cor.label}
                    </span>
                    <span className="data-mono text-[12px] text-ink-primary">{t.codigoCampo}</span>
                    {t.nomeProvisorio && <span className="text-[12px] text-ink-secondary">{t.nomeProvisorio}</span>}
                  </div>
                  <span className="text-[11px] text-ink-muted">
                    {t.idadeEstimada != null ? `~${t.idadeEstimada} anos · ` : ''}
                    {formatRelative(t.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Histórico de balanços */}
      {(historico.data?.length ?? 0) > 1 && (
        <div>
          <SectionHeader eyebrow="Evolução" title="Histórico de balanços" />
          <div className="overflow-hidden rounded-xl border border-white/[0.08]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-[11px] uppercase tracking-[0.06em] text-ink-muted">
                  <th className="px-4 py-2.5 text-left">Quando</th>
                  <th className="px-3 py-2.5 text-right">Óbitos</th>
                  <th className="px-3 py-2.5 text-right">Feridos</th>
                  <th className="px-3 py-2.5 text-right">Desabrig.</th>
                  <th className="px-3 py-2.5 text-right">Desapar.</th>
                </tr>
              </thead>
              <tbody>
                {historico.data!.map((h) => (
                  <tr key={h.id} className="border-b border-white/[0.04] text-[13px] last:border-0">
                    <td className="px-4 py-2.5 text-ink-secondary" title={formatAbsolute(h.createdAt)}>
                      {formatRelative(h.createdAt)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-ink-primary">{h.mortos}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-ink-primary">{h.feridos}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-ink-primary">{h.desabrigados}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-ink-primary">{h.desaparecidos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <RegistrarIncidentesModal
        eventoId={eventoId}
        atual={inc}
        open={registrarOpen}
        onClose={() => setRegistrarOpen(false)}
      />
    </div>
  );
}

function RegistrarIncidentesModal({
  eventoId,
  atual,
  open,
  onClose,
}: {
  eventoId: string;
  atual: IncidentesDTO | null | undefined;
  open: boolean;
  onClose: () => void;
}) {
  const registrar = useRegistrarIncidentes(eventoId);
  const [form, setForm] = useState<IncidentesInput>({});

  // Pré-preenche com o balanço atual ao abrir.
  useEffect(() => {
    if (open) {
      setForm({
        mortos: atual?.mortos ?? 0,
        feridos: atual?.feridos ?? 0,
        desabrigados: atual?.desabrigados ?? 0,
        desaparecidos: atual?.desaparecidos ?? 0,
        startVermelho: atual?.startVermelho ?? 0,
        startAmarelo: atual?.startAmarelo ?? 0,
        startVerde: atual?.startVerde ?? 0,
        startPreto: atual?.startPreto ?? 0,
      });
    }
  }, [open, atual]);

  function num(key: keyof IncidentesInput) {
    return {
      type: 'number' as const,
      min: 0,
      value: form[key] ?? 0,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value === '' ? 0 : Number(e.target.value) })),
    };
  }

  function salvar() {
    registrar.mutate(form, {
      onSuccess: () => {
        toast.success('Balanço de incidentes registrado.');
        onClose();
      },
      onError: (e) => toast.error(apiErrorMessage(e)),
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar balanço de incidentes"
      eyebrow="Atualização consolidada"
      icon={<HeartPulse size={16} />}
      maxWidth="max-w-lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={salvar} loading={registrar.isPending}>
            Registrar
          </Button>
        </>
      }
    >
      <p className="mb-3 text-[12px] text-ink-muted">
        Cada registro cria um novo balanço (mantém o histórico). Valores acumulados atuais já
        vêm preenchidos.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <FideField label="Óbitos">
          <Input {...num('mortos')} />
        </FideField>
        <FideField label="Feridos">
          <Input {...num('feridos')} />
        </FideField>
        <FideField label="Desabrigados">
          <Input {...num('desabrigados')} />
        </FideField>
        <FideField label="Desaparecidos">
          <Input {...num('desaparecidos')} />
        </FideField>
      </div>
      <p className="eyebrow mb-2 mt-4">Triagem START</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <FideField label="Vermelho">
          <Input {...num('startVermelho')} />
        </FideField>
        <FideField label="Amarelo">
          <Input {...num('startAmarelo')} />
        </FideField>
        <FideField label="Verde">
          <Input {...num('startVerde')} />
        </FideField>
        <FideField label="Preto">
          <Input {...num('startPreto')} />
        </FideField>
      </div>
    </Modal>
  );
}

function DemandasTab({
  eventoId,
  coordenadas,
  canManage,
}: {
  eventoId: string;
  coordenadas: Coordenadas;
  canManage: boolean;
}) {
  const { data, isLoading } = useEventoMural(eventoId);
  const pcsAceitos = useEventoPontosColeta(eventoId, 'ACEITO');
  const [novaOpen, setNovaOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* Pontos de Coleta disponíveis (aceitaram ajudar) */}
      <div className="rounded-xl border border-white/[0.06] bg-bg-secondary p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="eyebrow">Pontos de Coleta disponíveis</p>
          {canManage && (
            <Button onClick={() => setNovaOpen(true)}>
              <Plus size={15} /> Nova demanda
            </Button>
          )}
        </div>
        {pcsAceitos.isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : (pcsAceitos.data?.length ?? 0) === 0 ? (
          <p className="text-[12px] text-ink-muted">
            Nenhum ponto de coleta aceitou ajudar neste evento ainda. Demandas só podem ser criadas
            em PCs que aceitaram o vínculo (que ocorre quando o evento é aprovado e o coordenador aceita).
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {[...pcsAceitos.data!]
              .map((pc) => ({ pc, dist: distanceMeters(coordenadas, pc.coordenadas) }))
              .sort((a, b) => a.dist - b.dist)
              .map(({ pc, dist }) => (
                <span
                  key={pc.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-green-500/25 bg-green-500/5 px-3 py-1 text-[12px] text-ink-secondary"
                >
                  <PulseDot color="#22C55E" />
                  {pc.pcNome}
                  <span className="text-ink-muted">· {(dist / 1000).toFixed(1)} km</span>
                </span>
              ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : (data?.length ?? 0) === 0 ? (
        <p className="py-10 text-center text-[13px] text-ink-muted">Nenhuma demanda pendente.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {data!.map((d) => {
            const cfg = prioridadeConfig[d.prioridade];
            return (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-bg-secondary px-4 py-3"
              >
                <div>
                  <p className="text-[13px] font-medium text-ink-primary">{d.tipoNome}</p>
                  {d.descricao && <p className="text-[11px] text-ink-muted">{d.descricao}</p>}
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[11px] font-bold uppercase ${cfg.text}`}>{cfg.label}</span>
                  <span className="text-[13px] tabular-nums text-ink-secondary">
                    {d.qtdAtendida}/{d.qtdSolicitada}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NovaDemandaModal open={novaOpen} onClose={() => setNovaOpen(false)} eventoId={eventoId} />
    </div>
  );
}

function FideTab({ eventoId, canManage }: { eventoId: string; canManage: boolean }) {
  const { data: fide, isLoading } = useEventoFide(eventoId);
  const validar = useValidarFide(eventoId);
  const atualizar = useAtualizarFide(eventoId);
  const submeter = useSubmeterFide(eventoId);
  const [form, setForm] = useState<FideInput>({});
  const [dirty, setDirty] = useState(false);

  // Inicializa o formulário a partir do FIDE carregado.
  useEffect(() => {
    if (fide) {
      setForm({
        municipioAfetado: fide.municipioAfetado ?? undefined,
        decretoMunicipal: fide.decretoMunicipal ?? undefined,
        dataDecreto: fide.dataDecreto ?? undefined,
        popAfetada: fide.popAfetada ?? undefined,
        danosMateriais: fide.danosMateriais ?? undefined,
        acoesResposta: fide.acoesResposta ?? undefined,
        recursosSolicitados: fide.recursosSolicitados ?? undefined,
        prejuizoPublico: fide.prejuizoPublico ?? undefined,
        prejuizoPrivado: fide.prejuizoPrivado ?? undefined,
        danosHumanosDesc: fide.danosHumanosDesc ?? undefined,
      });
      setDirty(false);
    }
  }, [fide]);

  if (isLoading) return <LoadingBlock />;
  if (!fide) return <ErrorState />;

  const submetido = fide.fideStatus === 'SUBMETIDO' || fide.fideStatus === 'APROVADO';
  const editable = canManage && !submetido;

  function set<K extends keyof FideInput>(key: K, value: FideInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  function salvar() {
    atualizar.mutate(form, {
      onSuccess: () => {
        toast.success('FIDE salvo.');
        setDirty(false);
        validar.refetch();
      },
      onError: (e) => toast.error(apiErrorMessage(e)),
    });
  }

  function enviar() {
    submeter.mutate(undefined, {
      onSuccess: () => toast.success('FIDE submetido ao S2ID.'),
      onError: (e) => toast.error(apiErrorMessage(e)),
    });
  }

  const pronto = validar.data?.pronto ?? false;

  // Somente leitura (sem permissão): tabela simples.
  if (!canManage) {
    const rows: [string, React.ReactNode][] = [
      ['Município afetado', fide.municipioAfetado ?? '—'],
      ['Decreto municipal', fide.decretoMunicipal ?? '—'],
      ['Data do decreto', fide.dataDecreto ? formatAbsolute(fide.dataDecreto) : '—'],
      ['População afetada', fide.popAfetada ?? '—'],
      ['Prejuízo público', fide.prejuizoPublico ?? '—'],
      ['Prejuízo privado', fide.prejuizoPrivado ?? '—'],
      ['Status', fide.fideStatus.replace('_', ' ')],
    ];
    return (
      <div className="overflow-hidden rounded-xl border border-white/[0.08]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-white/[0.04] px-5 py-3 last:border-0">
            <span className="text-[12px] text-ink-muted">{k}</span>
            <span className="text-[13px] text-ink-primary">{v}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-bg-secondary px-4 py-3">
        <span className="text-[12px] text-ink-muted">
          Status FIDE/S2ID: <strong className="text-ink-primary">{fide.fideStatus.replace('_', ' ')}</strong>
        </span>
        {!submetido &&
          (pronto ? (
            <span className="flex items-center gap-1 text-[12px] text-green-400">
              <Check size={13} /> Pronto para submeter
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[12px] text-yellow-400">
              <CircleAlert size={13} /> {validar.data?.motivoBloqueio ?? 'Preencha os campos obrigatórios'}
            </span>
          ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FideField label="Município afetado">
          <Input value={form.municipioAfetado ?? ''} disabled={!editable} onChange={(e) => set('municipioAfetado', e.target.value)} />
        </FideField>
        <FideField label="Decreto municipal">
          <Input value={form.decretoMunicipal ?? ''} disabled={!editable} onChange={(e) => set('decretoMunicipal', e.target.value)} />
        </FideField>
        <FideField label="Data do decreto">
          <Input type="date" value={form.dataDecreto ?? ''} disabled={!editable} onChange={(e) => set('dataDecreto', e.target.value)} />
        </FideField>
        <FideField label="População afetada">
          <Input type="number" min={0} value={form.popAfetada ?? ''} disabled={!editable} onChange={(e) => set('popAfetada', e.target.value === '' ? undefined : Number(e.target.value))} />
        </FideField>
        <FideField label="Prejuízo público (R$)">
          <Input type="number" min={0} value={form.prejuizoPublico ?? ''} disabled={!editable} onChange={(e) => set('prejuizoPublico', e.target.value === '' ? undefined : Number(e.target.value))} />
        </FideField>
        <FideField label="Prejuízo privado (R$)">
          <Input type="number" min={0} value={form.prejuizoPrivado ?? ''} disabled={!editable} onChange={(e) => set('prejuizoPrivado', e.target.value === '' ? undefined : Number(e.target.value))} />
        </FideField>
      </div>

      <FideField label="Danos materiais">
        <textarea className="input min-h-[60px] resize-y" value={form.danosMateriais ?? ''} disabled={!editable} onChange={(e) => set('danosMateriais', e.target.value)} />
      </FideField>
      <FideField label="Danos humanos (descrição)">
        <textarea className="input min-h-[60px] resize-y" value={form.danosHumanosDesc ?? ''} disabled={!editable} onChange={(e) => set('danosHumanosDesc', e.target.value)} />
      </FideField>
      <FideField label="Ações de resposta">
        <textarea className="input min-h-[60px] resize-y" value={form.acoesResposta ?? ''} disabled={!editable} onChange={(e) => set('acoesResposta', e.target.value)} />
      </FideField>
      <FideField label="Recursos solicitados">
        <textarea className="input min-h-[60px] resize-y" value={form.recursosSolicitados ?? ''} disabled={!editable} onChange={(e) => set('recursosSolicitados', e.target.value)} />
      </FideField>

      {submetido ? (
        <p className="text-[12px] text-ink-muted">FIDE já submetido — edição bloqueada (RN17).</p>
      ) : (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={salvar} loading={atualizar.isPending} disabled={!dirty}>
            Salvar rascunho
          </Button>
          <Button onClick={enviar} loading={submeter.isPending} disabled={dirty || !pronto}>
            Submeter FIDE
          </Button>
        </div>
      )}
    </div>
  );
}

function FideField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="form-label">{label}</span>
      {children}
    </label>
  );
}

function HistoricoTab({ eventoId }: { eventoId: string }) {
  const { data, isLoading } = useEventoHistorico(eventoId);
  const nameById = useUsuariosByIds((data ?? []).map((h) => h.responsavelId));

  if (isLoading) return <LoadingBlock />;
  if ((data?.length ?? 0) === 0)
    return <p className="py-10 text-center text-[13px] text-ink-muted">Sem histórico de transições.</p>;
  return (
    <div className="flex flex-col gap-0 border-l border-white/10 pl-5">
      {data!.map((h) => (
        <div key={h.id} className="relative pb-5">
          <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 border-bg-app bg-brand-dark" />
          <p className="text-[13px] text-ink-primary">
            {h.statusDe ? `${h.statusDe.replace('_', ' ')} → ` : ''}
            <strong>{h.statusPara.replace('_', ' ')}</strong>
          </p>
          <p className="text-[12px] text-ink-secondary">
            por <span className="text-ink-primary">{nameById[h.responsavelId] ?? '—'}</span>
          </p>
          {h.observacao && <p className="text-[12px] text-ink-muted">{h.observacao}</p>}
          <p className="text-[11px] text-ink-muted" title={formatAbsolute(h.createdAt)}>
            {formatRelative(h.createdAt)}
          </p>
        </div>
      ))}
    </div>
  );
}
