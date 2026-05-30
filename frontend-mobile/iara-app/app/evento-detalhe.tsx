import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { apiCached, TTL } from '../lib/cache';
import { api } from '../services/api';
import { useAppModal } from '../components/AppModal';
import { ChipBar, type ChipOption } from '../components/ChipBar';

// ── Tipos ────────────────────────────────────────────────────

interface EventoDTO {
  id: string;
  titulo: string;
  descricao?: string;
  status: 'SOLICITADO' | 'ATIVO' | 'ALERTA_CRITICO' | 'ENCERRADO' | 'CANCELADO';
  severidade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  tipoNome: string;
  cobradeCod?: string;
  coordenadas: { lat: number; lng: number };
  raioMetros?: number;
  dataSolicitacao: string;
  isSimulado: boolean;
}

interface IncidentesDTO {
  mortos?: number;
  feridos?: number;
  desabrigados?: number;
  desaparecidos?: number;
  startVermelho?: number;
  startAmarelo?: number;
  startVerde?: number;
  startPreto?: number;
}

interface TriagemDTO {
  id: string;
  codigoCampo: string;
  nomeProvisorio?: string;
  idadeEstimada?: number;
  classificacao: 'VERMELHO' | 'AMARELO' | 'VERDE' | 'PRETO';
  createdAt: string;
}

interface DemandaDTO {
  id: string;
  tipoNome: string;
  prioridade: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA' | 'SUPRIDA';
  qtdSolicitada: number;
  qtdAtendida: number;
  descricao?: string;
}

interface HistoricoDTO {
  id: string;
  statusDe?: string;
  statusPara: string;
  responsavelId?: string;
  observacao?: string;
  createdAt: string;
}

// ── Constantes ───────────────────────────────────────────────

const SEVERITY: Record<string, { color: string; label: string }> = {
  CRITICA: { color: '#EF4444', label: 'Crítico' },
  ALTA:    { color: '#F97316', label: 'Alto'    },
  MEDIA:   { color: '#EAB308', label: 'Médio'   },
  BAIXA:   { color: '#22C55E', label: 'Baixo'   },
};

const STATUS_CFG: Record<string, { color: string; label: string }> = {
  SOLICITADO:     { color: '#64748B', label: 'Solicitado'     },
  ATIVO:          { color: '#3B82F6', label: 'Ativo'          },
  ALERTA_CRITICO: { color: '#EF4444', label: 'Alerta Crítico' },
  ENCERRADO:      { color: '#22C55E', label: 'Encerrado'      },
  CANCELADO:      { color: '#64748B', label: 'Cancelado'      },
};

const TRIAGEM_COLOR: Record<string, string> = {
  VERMELHO: '#EF4444',
  AMARELO:  '#EAB308',
  VERDE:    '#22C55E',
  PRETO:    '#1E293B',
};

const PRIORIDADE: Record<string, { color: string; bg: string; label: string }> = {
  CRITICA: { color: '#DC2626', bg: '#FEE2E2', label: 'Urgente'    },
  ALTA:    { color: '#C2410C', bg: '#FFEDD5', label: 'Necessário' },
  MEDIA:   { color: '#A16207', bg: '#FEF9C3', label: 'Médio'      },
  BAIXA:   { color: '#166534', bg: '#DCFCE7', label: 'Suficiente' },
  SUPRIDA: { color: '#6B7280', bg: '#F3F4F6', label: 'Suprido'    },
};

// roles que herdam acesso de MONITOR ou superior
const CAN_MONITOR = new Set(['MONITOR', 'GESTOR', 'ADMIN']);
// roles com poder de gestão
const CAN_GESTOR  = new Set(['GESTOR', 'ADMIN']);
// roles que podem fazer check-in (TECNICO e superiores)
const CAN_CHECKIN = new Set(['TECNICO', 'COORDENADOR', 'MONITOR', 'GESTOR', 'ADMIN']);

const TABS: ChipOption[] = [
  { key: 'geral',      label: 'Visão Geral' },
  { key: 'incidentes', label: 'Incidentes'  },
  { key: 'demandas',   label: 'Demandas'    },
  { key: 'historico',  label: 'Histórico'   },
];

// ── Helpers ──────────────────────────────────────────────────

function relativeDate(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `há ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `há ${hrs}h`;
    return `há ${Math.floor(hrs / 24)}d`;
  } catch { return '—'; }
}

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return '—'; }
}

// ── Tela principal ───────────────────────────────────────────

export default function EventoDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accessToken, role } = useAuth();
  const { show, modal } = useAppModal();

  const [evento,     setEvento    ] = useState<EventoDTO | null>(null);
  const [incidentes, setIncidentes] = useState<IncidentesDTO | null>(null);
  const [triagem,    setTriagem   ] = useState<TriagemDTO[]>([]);
  const [demandas,   setDemandas  ] = useState<DemandaDTO[]>([]);
  const [historico,  setHistorico ] = useState<HistoricoDTO[]>([]);
  const [loading,    setLoading   ] = useState(true);
  const [checkedIn,  setCheckedIn ] = useState(false);
  const [activeTab,  setActiveTab ] = useState('geral');

  const headers    = useMemo(() => ({ Authorization: `Bearer ${accessToken}` }), [accessToken]);
  const isMonitor  = CAN_MONITOR.has(role ?? '');
  const isGestor   = CAN_GESTOR.has(role ?? '');
  const canCheckin = CAN_CHECKIN.has(role ?? '');

  useEffect(() => {
    if (!accessToken || !id) return;

    Promise.all([
      apiCached<EventoDTO>(`/eventos/${id}`, headers, TTL.eventos),
      isMonitor
        ? apiCached<IncidentesDTO>(`/eventos/${id}/incidentes/atual`, headers, TTL.eventos).catch(() => null)
        : Promise.resolve(null),
      isMonitor
        ? apiCached<TriagemDTO[]>(`/eventos/${id}/triagem`, headers, TTL.eventos).catch(() => [])
        : Promise.resolve([]),
      apiCached<DemandaDTO[]>(`/eventos/${id}/mural`, headers, TTL.pontos).catch(() => []),
      isMonitor
        ? apiCached<HistoricoDTO[]>(`/eventos/${id}/historico`, headers, TTL.eventos).catch(() => [])
        : Promise.resolve([]),
    ])
      .then(([ev, inc, tri, dem, hist]) => {
        setEvento(ev);
        setIncidentes(inc);
        setTriagem((tri as TriagemDTO[]) ?? []);
        setDemandas((dem as DemandaDTO[]) ?? []);
        setHistorico((hist as HistoricoDTO[]) ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken, id, headers, isMonitor]);

  const handleCheckin = useCallback(async () => {
    if (!evento) return;
    try {
      await api.post(
        `/eventos/${id}/checkin`,
        { coordenadas: { lat: evento.coordenadas.lat, lng: evento.coordenadas.lng } },
        { headers },
      );
      setCheckedIn(true);
      show({ type: 'success', title: 'Check-in realizado', message: 'Você está em campo para este evento.' });
    } catch (err: any) {
      show({ type: 'error', title: 'Erro', message: err?.response?.data?.mensagem ?? 'Não foi possível fazer check-in.' });
    }
  }, [evento, id, headers, show]);

  const handleCheckout = useCallback(async () => {
    try {
      await api.patch(`/eventos/${id}/checkout`, {}, { headers });
      setCheckedIn(false);
      show({ type: 'success', title: 'Check-out realizado', message: 'Você saiu do campo.' });
    } catch (err: any) {
      show({ type: 'error', title: 'Erro', message: err?.response?.data?.mensagem ?? 'Não foi possível fazer check-out.' });
    }
  }, [id, headers, show]);

  const handleAprovar = useCallback(async () => {
    try {
      await api.patch(`/eventos/${id}/aprovar`, {}, { headers });
      setEvento((prev) => prev ? { ...prev, status: 'ATIVO' } : prev);
      show({ type: 'success', title: 'Evento aprovado', message: 'O evento foi ativado com sucesso.' });
    } catch (err: any) {
      show({ type: 'error', title: 'Erro', message: err?.response?.data?.mensagem ?? 'Não foi possível aprovar.' });
    }
  }, [id, headers, show]);

  const handleCancelar = useCallback(() => {
    show({
      type: 'confirm',
      title: 'Cancelar evento?',
      message: 'Esta ação não pode ser desfeita.',
      confirmLabel: 'Cancelar evento',
      cancelLabel: 'Voltar',
      onConfirm: async () => {
        try {
          await api.patch(`/eventos/${id}/cancelar`, {}, { headers });
          setEvento((prev) => prev ? { ...prev, status: 'CANCELADO' } : prev);
          show({ type: 'success', title: 'Evento cancelado', message: 'O evento foi cancelado.' });
        } catch (err: any) {
          show({ type: 'error', title: 'Erro', message: err?.response?.data?.mensagem ?? 'Não foi possível cancelar.' });
        }
      },
    });
  }, [id, headers, show]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}><ActivityIndicator color={Colors.blue.dark} size="large" /></View>
      </SafeAreaView>
    );
  }

  if (!evento) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.blue.dark} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}><Text style={styles.emptyText}>Evento não encontrado.</Text></View>
      </SafeAreaView>
    );
  }

  const sev = SEVERITY[evento.severidade] ?? SEVERITY.BAIXA;
  const sts = STATUS_CFG[evento.status]   ?? STATUS_CFG.SOLICITADO;

  return (
    <SafeAreaView style={styles.safeArea}>
      {modal}
      <StatusBar style="dark" backgroundColor={Colors.neutral.gray} />

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.blue.dark} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>{evento.titulo}</Text>
        {evento.isSimulado && (
          <View style={styles.simuladoBadge}><Text style={styles.simuladoText}>Simulado</Text></View>
        )}
      </View>

      {/* Chips de abas */}
      <ChipBar
        options={TABS}
        selected={activeTab}
        onChange={setActiveTab}
        style={styles.tabsWrap}
      />

      {/* Conteúdo da aba ativa */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {activeTab === 'geral' && (
          <TabVisaoGeral
            evento={evento}
            sev={sev}
            sts={sts}
            canCheckin={canCheckin && evento.status === 'ATIVO'}
            checkedIn={checkedIn}
            isGestor={isGestor}
            onCheckin={handleCheckin}
            onCheckout={handleCheckout}
            onAprovar={handleAprovar}
            onCancelar={handleCancelar}
          />
        )}
        {activeTab === 'incidentes' && (
          <TabIncidentes isMonitor={isMonitor} incidentes={incidentes} triagem={triagem} />
        )}
        {activeTab === 'demandas' && <TabDemandas demandas={demandas} />}
        {activeTab === 'historico' && <TabHistorico isMonitor={isMonitor} historico={historico} />}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Aba: Visão Geral ─────────────────────────────────────────

interface TabVisaoGeralProps {
  evento: EventoDTO;
  sev: { color: string; label: string };
  sts: { color: string; label: string };
  canCheckin: boolean;
  checkedIn: boolean;
  isGestor: boolean;
  onCheckin: () => void;
  onCheckout: () => void;
  onAprovar: () => void;
  onCancelar: () => void;
}

function TabVisaoGeral({
  evento, sev, sts, canCheckin, checkedIn, isGestor, onCheckin, onCheckout, onAprovar, onCancelar,
}: TabVisaoGeralProps) {
  return (
    <>
      {/* Card de status */}
      <View style={styles.card}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: `${sev.color}18`, borderColor: `${sev.color}44` }]}>
            <View style={[styles.badgeDot, { backgroundColor: sev.color }]} />
            <Text style={[styles.badgeText, { color: sev.color }]}>{sev.label}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${sts.color}18`, borderColor: `${sts.color}44` }]}>
            <View style={[styles.badgeDot, { backgroundColor: sts.color }]} />
            <Text style={[styles.badgeText, { color: sts.color }]}>{sts.label}</Text>
          </View>
        </View>

        <Text style={styles.cardSubtitle}>{evento.tipoNome}{evento.cobradeCod ? ` · ${evento.cobradeCod}` : ''}</Text>
      </View>

      {/* Card de informações */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Informações</Text>

        {evento.descricao ? (
          <View style={styles.descBox}>
            <Text style={styles.descText}>{evento.descricao}</Text>
          </View>
        ) : null}

        <InfoRow icon="navigate-outline" label="Coordenadas"
          value={`${evento.coordenadas.lat.toFixed(5)}, ${evento.coordenadas.lng.toFixed(5)}`} />

        {evento.raioMetros ? (
          <InfoRow icon="radio-outline" label="Raio afetado"
            value={`${(evento.raioMetros / 1000).toFixed(1)} km`} />
        ) : null}

        <InfoRow icon="calendar-outline" label="Solicitado em" value={formatDate(evento.dataSolicitacao)} />
      </View>

      {/* Ações de campo */}
      {(canCheckin || isGestor) && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Ações</Text>

          {canCheckin && (
            checkedIn ? (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#64748B' }]} onPress={onCheckout} activeOpacity={0.8}>
                <Ionicons name="log-out-outline" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Fazer Check-out</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.blue.dark }]} onPress={onCheckin} activeOpacity={0.8}>
                <Ionicons name="log-in-outline" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Fazer Check-in</Text>
              </TouchableOpacity>
            )
          )}

          {isGestor && evento.status === 'SOLICITADO' && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22C55E' }]} onPress={onAprovar} activeOpacity={0.8}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Aprovar Evento</Text>
            </TouchableOpacity>
          )}

          {isGestor && (evento.status === 'SOLICITADO' || evento.status === 'ATIVO') && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EF4444' }]} onPress={onCancelar} activeOpacity={0.8}>
              <Ionicons name="close-circle-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Cancelar Evento</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );
}

// ── Aba: Incidentes ──────────────────────────────────────────

interface TabIncidentesProps {
  isMonitor: boolean;
  incidentes: IncidentesDTO | null;
  triagem: TriagemDTO[];
}

function TabIncidentes({ isMonitor, incidentes, triagem }: TabIncidentesProps) {
  if (!isMonitor) return <AccessRestricted />;

  return (
    <>
      {/* Vítimas / Deslocados */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Vítimas & Deslocados</Text>
        <View style={styles.tilesGrid}>
          <StatTile label="Óbitos"       value={incidentes?.mortos       ?? 0} color="#EF4444" />
          <StatTile label="Feridos"      value={incidentes?.feridos      ?? 0} color="#F97316" />
          <StatTile label="Desabrigados" value={incidentes?.desabrigados ?? 0} color="#EAB308" />
          <StatTile label="Desaparecidos" value={incidentes?.desaparecidos ?? 0} color="#64748B" />
        </View>
      </View>

      {/* Triagem START */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Triagem START</Text>
        <View style={styles.tilesGrid}>
          <StatTile label="Vermelho" value={incidentes?.startVermelho ?? 0} color="#EF4444" />
          <StatTile label="Amarelo"  value={incidentes?.startAmarelo  ?? 0} color="#EAB308" />
          <StatTile label="Verde"    value={incidentes?.startVerde    ?? 0} color="#22C55E" />
          <StatTile label="Preto"    value={incidentes?.startPreto    ?? 0} color="#1E293B" />
        </View>
      </View>

      {/* Lista de triagens individuais */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Pacientes Triados ({triagem.length})</Text>
        {triagem.length === 0 ? (
          <EmptyState message="Nenhuma triagem registrada." />
        ) : (
          triagem.map((t) => (
            <View key={t.id} style={styles.triagemRow}>
              <View style={[styles.triagemDot, { backgroundColor: TRIAGEM_COLOR[t.classificacao] ?? '#64748B' }]} />
              <View style={styles.triagemInfo}>
                <Text style={styles.triagemCodigo}>{t.codigoCampo}</Text>
                {t.nomeProvisorio ? <Text style={styles.triagemNome}>{t.nomeProvisorio}</Text> : null}
                {t.idadeEstimada  ? <Text style={styles.triagemSub}>~{t.idadeEstimada} anos</Text> : null}
              </View>
              <View style={styles.triagemRight}>
                <View style={[styles.classificacaoBadge, { backgroundColor: `${TRIAGEM_COLOR[t.classificacao] ?? '#64748B'}18` }]}>
                  <Text style={[styles.classificacaoText, { color: TRIAGEM_COLOR[t.classificacao] ?? '#64748B' }]}>
                    {t.classificacao}
                  </Text>
                </View>
                <Text style={styles.triagemSub}>{relativeDate(t.createdAt)}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </>
  );
}

// ── Aba: Demandas ────────────────────────────────────────────

function TabDemandas({ demandas }: { demandas: DemandaDTO[] }) {
  if (demandas.length === 0) {
    return (
      <View style={styles.card}>
        <EmptyState message="Nenhuma demanda pendente para este evento." />
      </View>
    );
  }

  return (
    <>
      {demandas.map((d) => {
        const cfg = PRIORIDADE[d.prioridade] ?? PRIORIDADE.BAIXA;
        const pct = d.qtdSolicitada > 0
          ? Math.min((d.qtdAtendida / d.qtdSolicitada) * 100, 100)
          : 0;
        return (
          <View key={d.id} style={styles.card}>
            <View style={styles.demandaTop}>
              <Text style={styles.demandaNome}>{d.tipoNome}</Text>
              <View style={[styles.prioridadeBadge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.prioridadeText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </View>

            <View style={styles.progressRow}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: cfg.color }]} />
              </View>
              <Text style={styles.progressLabel}>{d.qtdAtendida}/{d.qtdSolicitada}</Text>
            </View>

            {d.descricao ? <Text style={styles.demandaDesc}>{d.descricao}</Text> : null}
          </View>
        );
      })}
    </>
  );
}

// ── Aba: Histórico ───────────────────────────────────────────

function TabHistorico({ isMonitor, historico }: { isMonitor: boolean; historico: HistoricoDTO[] }) {
  if (!isMonitor) return <AccessRestricted />;

  if (historico.length === 0) {
    return (
      <View style={styles.card}>
        <EmptyState message="Nenhuma transição de status registrada." />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Linha do Tempo</Text>
      {historico.map((h, idx) => {
        const cfg = STATUS_CFG[h.statusPara] ?? STATUS_CFG.SOLICITADO;
        return (
          <View key={h.id} style={styles.timelineItem}>
            {/* Linha vertical (exceto no último) */}
            {idx < historico.length - 1 && <View style={styles.timelineLine} />}

            <View style={[styles.timelineDot, { backgroundColor: cfg.color }]} />

            <View style={styles.timelineContent}>
              <Text style={styles.timelineStatus}>
                {h.statusDe ? `${h.statusDe} → ${h.statusPara}` : h.statusPara}
              </Text>
              {h.observacao ? (
                <Text style={styles.timelineObs}>{h.observacao}</Text>
              ) : null}
              <Text style={styles.timelineDate}>{relativeDate(h.createdAt)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Componentes auxiliares ────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as never} size={16} color="#94A3B8" style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.tile, { borderLeftColor: color }]}>
      <Text style={[styles.tileValue, { color }]}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="checkmark-circle-outline" size={24} color="#94A3B8" />
      <Text style={styles.emptyStateText}>{message}</Text>
    </View>
  );
}

function AccessRestricted() {
  return (
    <View style={styles.card}>
      <View style={styles.restrictedBox}>
        <Ionicons name="lock-closed-outline" size={28} color="#94A3B8" />
        <Text style={styles.restrictedTitle}>Acesso restrito</Text>
        <Text style={styles.restrictedSub}>Perfil MONITOR ou superior necessário.</Text>
      </View>
    </View>
  );
}

// ── Estilos ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: Colors.neutral.gray },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: '#94A3B8' },
  scroll:    { paddingHorizontal: 16, paddingBottom: 100, gap: 12 },

  // Header
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10,
  },
  backBtn:       { padding: 4 },
  topBarTitle:   { flex: 1, fontSize: 17, fontWeight: '800', color: Colors.blue.dark },
  simuladoBadge: { backgroundColor: '#EAB30820', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#EAB30855' },
  simuladoText:  { fontSize: 11, fontWeight: '700', color: '#A16207' },

  // Chips de abas
  tabsWrap: { paddingBottom: 8 },

  // Cards
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 10,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },

  // Visão Geral — status badges
  badgeRow:   { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge:      { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  badgeDot:   { width: 7, height: 7, borderRadius: 4 },
  badgeText:  { fontSize: 12, fontWeight: '700' },
  cardSubtitle: { fontSize: 13, color: '#64748B', fontWeight: '500' },

  // Seção
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8 },

  // Descrição
  descBox:  { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10 },
  descText: { fontSize: 13, color: '#4B5563', lineHeight: 19 },

  // InfoRow
  infoRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoIcon:    { marginTop: 2 },
  infoContent: { flex: 1, gap: 2 },
  infoLabel:   { fontSize: 11, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue:   { fontSize: 14, color: '#1E293B', fontWeight: '500', lineHeight: 20 },

  // Botões de ação
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 10, paddingVertical: 12,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3,
  },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Grid de tiles (Incidentes)
  tilesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    width: '47.5%', backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12,
    borderLeftWidth: 3, alignItems: 'flex-start', gap: 3,
  },
  tileValue: { fontSize: 22, fontWeight: '800' },
  tileLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },

  // Triagem
  triagemRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  triagemDot:   { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  triagemInfo:  { flex: 1, gap: 2 },
  triagemCodigo:{ fontSize: 13, fontWeight: '700', color: '#1E293B' },
  triagemNome:  { fontSize: 12, color: '#4B5563' },
  triagemSub:   { fontSize: 11, color: '#94A3B8' },
  triagemRight: { alignItems: 'flex-end', gap: 4 },
  classificacaoBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  classificacaoText:  { fontSize: 11, fontWeight: '700' },

  // Demandas
  demandaTop:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  demandaNome:    { flex: 1, fontSize: 14, fontWeight: '700', color: '#1E293B' },
  prioridadeBadge:{ borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3 },
  prioridadeText: { fontSize: 11, fontWeight: '700' },
  progressRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar:    { flex: 1, height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill:   { height: '100%', borderRadius: 3 },
  progressLabel:  { fontSize: 11, color: '#94A3B8', width: 44, textAlign: 'right' },
  demandaDesc:    { fontSize: 12, color: '#64748B', lineHeight: 17 },

  // Histórico — timeline
  timelineItem:    { flexDirection: 'row', gap: 12, paddingBottom: 16, position: 'relative' },
  timelineLine:    { position: 'absolute', left: 6, top: 16, bottom: 0, width: 1.5, backgroundColor: '#E2E8F0' },
  timelineDot:     { width: 14, height: 14, borderRadius: 7, marginTop: 2, flexShrink: 0, borderWidth: 2, borderColor: '#fff', elevation: 1 },
  timelineContent: { flex: 1, gap: 3 },
  timelineStatus:  { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  timelineObs:     { fontSize: 12, color: '#64748B', lineHeight: 17 },
  timelineDate:    { fontSize: 11, color: '#94A3B8' },

  // Empty state
  emptyState:     { alignItems: 'center', gap: 8, paddingVertical: 16 },
  emptyStateText: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },

  // Access restricted
  restrictedBox:   { alignItems: 'center', gap: 8, paddingVertical: 20 },
  restrictedTitle: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  restrictedSub:   { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
});
