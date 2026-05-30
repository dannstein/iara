import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/theme';
import { ChipBar, type ChipOption } from '../../components/ChipBar';
import { useAuth } from '../../context/AuthContext';
import { apiCached, TTL } from '../../lib/cache';
import { api } from '../../services/api';

// ── Tipos ────────────────────────────────────────────────────

interface EventoDTO {
  id: string;
  titulo: string;
  status: 'SOLICITADO' | 'ATIVO' | 'ALERTA_CRITICO' | 'ENCERRADO' | 'CANCELADO';
  severidade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  tipoNome: string;
  descricao?: string;
  coordenadas: { lat: number; lng: number };
  dataSolicitacao: string;
  isSimulado: boolean;
}

// ── Configurações visuais ────────────────────────────────────

const SEVERITY: Record<string, { color: string; label: string }> = {
  CRITICA: { color: '#EF4444', label: 'Crítico' },
  ALTA:    { color: '#F97316', label: 'Alto'    },
  MEDIA:   { color: '#EAB308', label: 'Médio'   },
  BAIXA:   { color: '#22C55E', label: 'Baixo'   },
};

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  SOLICITADO:     { label: 'Solicitado',     color: '#64748B' },
  ATIVO:          { label: 'Ativo',          color: '#3B82F6' },
  ALERTA_CRITICO: { label: 'Alerta Crítico', color: '#EF4444' },
  ENCERRADO:      { label: 'Encerrado',      color: '#22C55E' },
  CANCELADO:      { label: 'Cancelado',      color: '#64748B' },
};

const FILTER_CHIPS = [
  { key: 'ativos',    label: 'Ativos',      statuses: ['ATIVO', 'ALERTA_CRITICO'] },
  { key: 'todos',     label: 'Todos',       statuses: null },
  { key: 'solicit',   label: 'Solicitados', statuses: ['SOLICITADO'] },
  { key: 'encerrado', label: 'Encerrados',  statuses: ['ENCERRADO', 'CANCELADO'] },
] as const;

type FilterKey = typeof FILTER_CHIPS[number]['key'];

const CHIP_OPTIONS: ChipOption[] = FILTER_CHIPS.map((c) => ({ key: c.key, label: c.label }));

function relativeDate(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `há ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `há ${hrs}h`;
    return `há ${Math.floor(hrs / 24)}d`;
  } catch { return '—'; }
}

// ── Tela ─────────────────────────────────────────────────────

export default function Events() {
  const { accessToken } = useAuth();
  const [eventos, setEventos]       = useState<EventoDTO[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]         = useState<FilterKey>('ativos');

  const headers = useMemo(() => ({ Authorization: `Bearer ${accessToken}` }), [accessToken]);

  const fetchEventos = useCallback(async (forceRefresh = false) => {
    if (!accessToken) return;
    try {
      let data: EventoDTO[];
      if (forceRefresh) {
        const res = await api.get<EventoDTO[]>('/eventos', { headers });
        data = res.data;
      } else {
        data = await apiCached<EventoDTO[]>('/eventos', headers, TTL.eventos);
      }
      setEventos(data.filter((e) => !e.isSimulado));
    } catch {
      // mantém dados em cache se já carregados
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, headers]);

  useEffect(() => { fetchEventos(); }, [fetchEventos]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEventos(true);
  }, [fetchEventos]);

  const filtered = useMemo(() => {
    const chip = FILTER_CHIPS.find((c) => c.key === filter);
    if (!chip || !chip.statuses) return eventos;
    return eventos.filter((e) => (chip.statuses as readonly string[]).includes(e.status));
  }, [eventos, filter]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={Colors.neutral.gray} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eventos</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{filtered.length}</Text>
        </View>
      </View>

      {/* Chips de filtro */}
      <ChipBar
        options={CHIP_OPTIONS}
        selected={filter}
        onChange={(key) => setFilter(key as FilterKey)}
        style={styles.chipBarWrap}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.blue.dark} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={filtered.length === 0 ? styles.centerFlex : styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.blue.dark]} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyText}>Nenhum evento neste filtro.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/evento-detalhe', params: { id: item.id } } as never)}
              activeOpacity={0.85}
            >
              <EventCard evento={item} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ── Card de evento ────────────────────────────────────────────

function EventCard({ evento }: { evento: EventoDTO }) {
  const sev    = SEVERITY[evento.severidade]   ?? { color: '#64748B', label: evento.severidade };
  const status = STATUS_CFG[evento.status]     ?? { label: evento.status, color: '#64748B' };

  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: sev.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle} numberOfLines={2}>{evento.titulo}</Text>
          <View style={[styles.badge, { backgroundColor: `${sev.color}20`, borderColor: `${sev.color}55` }]}>
            <Text style={[styles.badgeText, { color: sev.color }]}>{sev.label}</Text>
          </View>
        </View>
        <Text style={styles.cardType}>{evento.tipoNome}</Text>
        {evento.descricao ? <Text style={styles.cardDesc} numberOfLines={2}>{evento.descricao}</Text> : null}
        <View style={styles.cardFooter}>
          <View style={[styles.statusPill, { backgroundColor: `${status.color}18` }]}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.dateText}>{relativeDate(evento.dataSolicitacao)}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Estilos ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: Colors.neutral.gray },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.blue.dark, flex: 1 },
  countBadge:  { backgroundColor: Colors.blue.dark, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  countText:   { color: '#fff', fontSize: 12, fontWeight: '700' },
  chipBarWrap: { paddingVertical: 10 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  centerFlex:  { flex: 1 },
  center:      { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyText:   { fontSize: 14, color: '#94A3B8', textAlign: 'center' },
  card:        { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, flexDirection: 'row', overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  cardAccent:  { width: 4 },
  cardBody:    { flex: 1, padding: 12, gap: 4 },
  cardTopRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle:   { flex: 1, fontSize: 14, fontWeight: '700', color: '#1E293B', lineHeight: 20 },
  cardType:    { fontSize: 12, color: '#64748B' },
  cardDesc:    { fontSize: 12, color: '#94A3B8', lineHeight: 16 },
  cardFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  statusPill:  { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusText:  { fontSize: 11, fontWeight: '600' },
  dateText:    { fontSize: 11, color: '#94A3B8' },
  badge:       { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:   { fontSize: 11, fontWeight: '600' },
});
