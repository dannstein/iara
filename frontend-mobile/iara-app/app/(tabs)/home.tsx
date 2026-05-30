import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { LeafletMap, type MapMarker, type MapCircle, type MapPolygon } from '../../components/LeafletMap';
import { apiCached, TTL } from '../../lib/cache';

// ── Tipos ────────────────────────────────────────────────────

interface EventoDTO {
  id: string;
  tenantId: string;
  titulo: string;
  status: 'SOLICITADO' | 'ATIVO' | 'ALERTA_CRITICO' | 'ENCERRADO' | 'CANCELADO';
  severidade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  coordenadas: { lat: number; lng: number };
  raioMetros?: number;
  tipoNome: string;
  dataSolicitacao: string;
}

interface PcDTO {
  id: string;
  pcNome: string;
  coordenadas: { lat: number; lng: number };
  pcDesc?: string;
  isActive: boolean;
}

interface ZonaRiscoDTO {
  id: string;
  nome: string;
  tipo: string;
  nivelRisco: number;
  coordenadas?: { lat: number; lng: number };
  raioMetros?: number;
  geometria?: object;
  isActive: boolean;
}

interface DoacaoDTO {
  id: string;
  idTipo: string;
  quantidade: number;
  status: 'PENDENTE' | 'CONFIRMADA' | 'CANCELADA' | 'EXPIRADA';
  dataPrevista?: string;
}

interface DemandaDTO {
  id: string;
  tipoNome: string;
  prioridade: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA' | 'SUPRIDA';
  qtdSolicitada: number;
  qtdAtendida: number;
}

// ── Constantes ───────────────────────────────────────────────

const SEVERITY: Record<string, { color: string; label: string }> = {
  CRITICA: { color: '#EF4444', label: 'Crítico' },
  ALTA:    { color: '#F97316', label: 'Alto'    },
  MEDIA:   { color: '#EAB308', label: 'Médio'   },
  BAIXA:   { color: '#22C55E', label: 'Baixo'   },
};

const ZONA_COLOR = (nivel: number) =>
  nivel >= 4 ? '#EF4444' : nivel === 3 ? '#F97316' : nivel === 2 ? '#EAB308' : '#22C55E';

const PRIORIDADE_COLOR: Record<string, string> = {
  CRITICA: '#EF4444', ALTA: '#F97316', MEDIA: '#EAB308', BAIXA: '#22C55E', SUPRIDA: '#94A3B8',
};

const DOACAO_STATUS: Record<string, { label: string; color: string }> = {
  PENDENTE:   { label: 'Pendente',   color: '#F97316' },
  CONFIRMADA: { label: 'Confirmada', color: '#22C55E' },
  CANCELADA:  { label: 'Cancelada',  color: '#EF4444' },
  EXPIRADA:   { label: 'Expirada',   color: '#94A3B8' },
};

const DOADOR_ROLES = new Set(['DOADOR', 'USUARIO_SIMPLES']);

// ── Tela principal ───────────────────────────────────────────

export default function Home() {
  const { role, email, accessToken, tenantId } = useAuth();
  const [pinnedCards, setPinnedCards] = useState<unknown[]>([]);
  const isDoador = DOADOR_ROLES.has(role ?? '');

  useEffect(() => {
    SecureStore.getItemAsync('pinnedCards').then((raw) => {
      if (raw) { try { setPinnedCards(JSON.parse(raw)); } catch {} }
    });
  }, []);

  const displayName = email ? email.split('@')[0] : 'usuário';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={Colors.neutral.gray} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
      >

        <View style={styles.greeting}>
          <Text style={styles.greetingLabel}>Bem-vindo,</Text>
          <Text style={styles.greetingName} numberOfLines={1}>{displayName}</Text>
        </View>

        {pinnedCards.length > 0 && <PinnedCardsSection cards={pinnedCards} />}

        {isDoador
          ? <DoadorHome accessToken={accessToken} tenantId={tenantId} />
          : <StaffHome accessToken={accessToken} />
        }
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Cards Fixados ─────────────────────────────────────────────

function PinnedCardsSection({ cards }: { cards: unknown[] }) {
  return (
    <View style={styles.section}>
      <SectionHeader eyebrow="INÍCIO" title="Cards Rápidos" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pinnedRow}>
        {cards.map((_, i) => (
          <View key={i} style={styles.pinnedCard}>
            <Ionicons name="pin" size={18} color={Colors.blue.medium} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Home DOADOR ───────────────────────────────────────────────

function DoadorHome({ accessToken, tenantId }: { accessToken: string; tenantId: string }) {
  const [pcs, setPcs]         = useState<PcDTO[]>([]);
  const [eventos, setEventos] = useState<EventoDTO[]>([]);
  const [zonas, setZonas]     = useState<ZonaRiscoDTO[]>([]);
  const [doacoes, setDoacoes] = useState<DoacaoDTO[]>([]);
  const [demandas, setDemandas] = useState<DemandaDTO[]>([]);
  const [loadingDoacoes, setLoadingDoacoes]   = useState(true);
  const [loadingDemandas, setLoadingDemandas] = useState(true);

  const headers = useMemo(() => ({ Authorization: `Bearer ${accessToken}` }), [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    apiCached<PcDTO[]>('/pontos-coleta?is_active=true', headers, TTL.pontos)
      .then(setPcs).catch(() => {});

    apiCached<EventoDTO[]>('/eventos', headers, TTL.eventos)
      .then((data) => setEventos(
        data.filter((e) =>
          e.status !== 'ENCERRADO' &&
          e.status !== 'CANCELADO' &&
          (!tenantId || e.tenantId === tenantId),
        ),
      ))
      .catch(() => {});

    apiCached<ZonaRiscoDTO[]>('/zonas-risco', headers, TTL.zonas)
      .then((data) => setZonas(data.filter((z) => z.isActive)))
      .catch(() => {});

    apiCached<DoacaoDTO[]>('/doacoes/minhas', headers, TTL.eventos)
      .then((data) => setDoacoes(data.slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoadingDoacoes(false));

    // Demandas urgentes do primeiro PC ativo
    apiCached<PcDTO[]>('/pontos-coleta?is_active=true', headers, TTL.pontos)
      .then(async (data) => {
        const firstPc = data[0];
        if (!firstPc) return;
        const dem = await apiCached<DemandaDTO[]>(
          `/pontos-coleta/${firstPc.id}/demandas?is_active=true`, headers, TTL.pontos
        );
        setDemandas(dem.filter((d) => d.prioridade === 'CRITICA' || d.prioridade === 'ALTA').slice(0, 4));
      })
      .catch(() => {})
      .finally(() => setLoadingDemandas(false));
  }, [accessToken, headers]);

  // Mapa: PCs + eventos (por severidade) + zonas de risco
  const markers: MapMarker[] = useMemo(() => [
    ...pcs.map((pc) => ({ lat: pc.coordenadas.lat, lng: pc.coordenadas.lng, color: Colors.blue.dark, title: pc.pcNome, description: pc.pcDesc })),
    ...eventos.map((ev) => ({ lat: ev.coordenadas.lat, lng: ev.coordenadas.lng, color: SEVERITY[ev.severidade]?.color ?? '#64748B', title: ev.titulo, description: ev.tipoNome })),
  ], [pcs, eventos]);

  // Círculos = zonas de risco (ponto+raio) + eventos com raio afetado
  const circles: MapCircle[] = useMemo(() => [
    ...zonas.filter((z) => !!z.coordenadas && !!z.raioMetros).map((z) => ({
      lat: z.coordenadas!.lat, lng: z.coordenadas!.lng,
      radius: z.raioMetros!, color: ZONA_COLOR(z.nivelRisco),
    })),
    ...eventos.filter((ev) => !!ev.raioMetros).map((ev) => ({
      lat: ev.coordenadas.lat, lng: ev.coordenadas.lng,
      radius: ev.raioMetros!, color: SEVERITY[ev.severidade]?.color ?? '#64748B',
    })),
  ], [zonas, eventos]);

  const polygons: MapPolygon[] = useMemo(() =>
    zonas.filter((z) => !!z.geometria && !z.raioMetros).map((z) => ({
      geojson: z.geometria!, color: ZONA_COLOR(z.nivelRisco),
    })),
    [zonas],
  );

  return (
    <>
      <View style={styles.section}>
        <SectionHeader
          eyebrow="SUA REGIÃO"
          title="Mapa de Situação"
          action={<TouchableOpacity onPress={() => router.push('/mapa-fullscreen' as never)}><Ionicons name="expand-outline" size={20} color={Colors.blue.medium} /></TouchableOpacity>}
        />
        <LeafletMap style={styles.mapCard} markers={markers} circles={circles} polygons={polygons} />
      </View>

      {/* Botão único — Nova Doação → pontos de coleta */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.brand.dark_orange }]}
          onPress={() => router.push('/pontos-coleta' as never)}
          activeOpacity={0.8}
        >
          <Ionicons name="heart-outline" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>Nova Doação</Text>
        </TouchableOpacity>
      </View>

      {/* Última doação + link para histórico completo */}
      <View style={styles.section}>
        <SectionHeader
          eyebrow="HISTÓRICO"
          title="Última Doação"
          action={
            <TouchableOpacity onPress={() => router.push('/historico-doacoes' as never)}>
              <Text style={styles.linkText}>Ver histórico</Text>
            </TouchableOpacity>
          }
        />
        {loadingDoacoes ? <LoadingPlaceholder /> : doacoes.length === 0 ? (
          <EmptyState message="Você ainda não fez nenhuma doação." />
        ) : (() => {
          const d = doacoes[0];
          const cfg = DOACAO_STATUS[d.status] ?? { label: d.status, color: '#94A3B8' };
          return (
            <View style={styles.itemRow}>
              <View style={[styles.itemDot, { backgroundColor: cfg.color }]} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{d.quantidade}x item · {cfg.label}</Text>
                {d.dataPrevista && <Text style={styles.itemSub}>Previsão: {new Date(d.dataPrevista).toLocaleDateString('pt-BR')}</Text>}
              </View>
              <View style={[styles.badge, { backgroundColor: `${cfg.color}20`, borderColor: `${cfg.color}55` }]}>
                <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </View>
          );
        })()}
      </View>

      <View style={[styles.section, styles.lastSection]}>
        <SectionHeader eyebrow="URGENTE" title="Mais Necessário Agora" barColor="#EF4444" />
        {loadingDemandas ? <LoadingPlaceholder /> : demandas.length === 0 ? <EmptyState message="Nenhuma demanda urgente no momento." /> :
          demandas.map((d) => {
            const color = PRIORIDADE_COLOR[d.prioridade] ?? '#94A3B8';
            return (
              <View key={d.id} style={styles.itemRow}>
                <View style={[styles.itemDot, { backgroundColor: color }]} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{d.tipoNome}</Text>
                  <Text style={styles.itemSub}>{d.qtdAtendida}/{d.qtdSolicitada} atendidos</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: `${color}20`, borderColor: `${color}55` }]}>
                  <Text style={[styles.badgeText, { color }]}>{d.prioridade}</Text>
                </View>
              </View>
            );
          })
        }
      </View>
    </>
  );
}

// ── Home Staff (TECNICO, MONITOR, etc.) ───────────────────────

function StaffHome({ accessToken }: { accessToken: string }) {
  const [eventos, setEventos] = useState<EventoDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = useMemo(() => ({ Authorization: `Bearer ${accessToken}` }), [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    apiCached<EventoDTO[]>('/eventos', headers, TTL.eventos)
      .then((data) => setEventos(data.filter((e) => e.status !== 'ENCERRADO' && e.status !== 'CANCELADO')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken, headers]);

  const markers: MapMarker[] = useMemo(() =>
    eventos.map((ev) => ({
      lat: ev.coordenadas.lat, lng: ev.coordenadas.lng,
      color: SEVERITY[ev.severidade]?.color ?? '#64748B',
      title: ev.titulo, description: ev.tipoNome,
    })),
    [eventos],
  );

  const circles: MapCircle[] = useMemo(() =>
    eventos.filter((ev) => !!ev.raioMetros).map((ev) => ({
      lat: ev.coordenadas.lat, lng: ev.coordenadas.lng,
      radius: ev.raioMetros!, color: SEVERITY[ev.severidade]?.color ?? '#64748B',
    })),
    [eventos],
  );

  return (
    <>
      <View style={styles.section}>
        <SectionHeader
          eyebrow="SITUAÇÃO REGIONAL"
          title="Mapa de Ocorrências"
          action={<TouchableOpacity onPress={() => router.push('/mapa-fullscreen' as never)}><Ionicons name="expand-outline" size={20} color={Colors.blue.medium} /></TouchableOpacity>}
        />
        <LeafletMap style={styles.mapCard} markers={markers} circles={circles} />
      </View>

      {eventos.length > 0 && (
        <View style={[styles.section, styles.lastSection]}>
          <SectionHeader eyebrow="ATENÇÃO" title="Eventos Ativos" barColor="#EF4444" />
          {loading ? <LoadingPlaceholder /> :
            eventos.slice(0, 5).map((ev) => {
              const cfg = SEVERITY[ev.severidade] ?? SEVERITY.BAIXA;
              return (
                <View key={ev.id} style={styles.itemRow}>
                  <View style={[styles.itemDot, { backgroundColor: cfg.color }]} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{ev.titulo}</Text>
                    <Text style={styles.itemSub}>{ev.tipoNome}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: `${cfg.color}20`, borderColor: `${cfg.color}55` }]}>
                    <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
              );
            })
          }
        </View>
      )}
    </>
  );
}

// ── Componentes auxiliares ────────────────────────────────────

interface SectionHeaderProps {
  eyebrow: string; title: string; barColor?: string; action?: React.ReactNode;
}
function SectionHeader({ eyebrow, title, barColor = Colors.blue.dark, action }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionBar, { backgroundColor: barColor }]} />
      <View style={styles.sectionTitleBlock}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action && <View>{action}</View>}
    </View>
  );
}

function LoadingPlaceholder() {
  return <View style={styles.loadingPlaceholder}><ActivityIndicator color={Colors.blue.medium} size="small" /></View>;
}
function EmptyState({ message }: { message: string }) {
  return <View style={styles.emptyState}><Text style={styles.emptyText}>{message}</Text></View>;
}

// ── Estilos ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:     { flex: 1, backgroundColor: Colors.neutral.gray },
  scroll:       { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  greeting:     { marginBottom: 20, paddingTop: 4 },
  greetingLabel:{ fontSize: 14, color: '#64748B' },
  greetingName: { fontSize: 22, fontWeight: '700', color: Colors.blue.dark, textTransform: 'capitalize' },
  section:      { marginBottom: 20 },
  lastSection:  { marginBottom: 0 },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionBar:   { width: 3, height: 20, borderRadius: 2 },
  sectionTitleBlock: { flex: 1 },
  eyebrow:      { fontSize: 10, fontWeight: '600', color: '#94A3B8', letterSpacing: 0.8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', lineHeight: 19 },
  pinnedRow:    { gap: 12, paddingRight: 4 },
  pinnedCard:   { width: 80, height: 72, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  actionRow:    { flexDirection: 'row', gap: 12 },
  actionBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6 },
  actionBtnText:{ color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  mapCard:      { height: 260, borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  itemRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  itemDot:      { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  itemInfo:     { flex: 1 },
  itemTitle:    { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  itemSub:      { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  badge:        { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:    { fontSize: 11, fontWeight: '600' },
  loadingPlaceholder: { height: 60, alignItems: 'center', justifyContent: 'center' },
  emptyState:   { paddingVertical: 16, alignItems: 'center' },
  emptyText:    { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
  linkText:     { fontSize: 12, color: Colors.blue.light, fontWeight: '500' },
});
