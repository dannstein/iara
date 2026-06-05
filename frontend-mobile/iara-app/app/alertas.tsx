import { useCallback, useState } from 'react';
import {
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
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '../constants/theme';
import { ChipBar } from '../components/ChipBar';
import {
  useAlerta,
  sortBySeveridade,
  SEVERITY_COLOR,
  SEVERITY_LABEL,
  CATEGORIA_LABEL,
  type AlertaDTO,
  type AlertaSeveridade,
} from '../context/AlertaContext';

// ── Filtros ───────────────────────────────────────────────────

type Filtro = 'todos' | 'ativos' | 'criticos';

const FILTROS = [
  { key: 'todos',    label: 'Todos'   },
  { key: 'ativos',   label: 'Ativos'  },
  { key: 'criticos', label: 'Críticos' },
] as const;

const CRITICOS = new Set<AlertaSeveridade>(['CRITICAL', 'EMERGENCY']);

function applyFilter(list: AlertaDTO[], filtro: Filtro): AlertaDTO[] {
  switch (filtro) {
    case 'ativos':   return list.filter((a) => a.status === 'ACTIVE');
    case 'criticos': return list.filter((a) => CRITICOS.has(a.severidade));
    default:         return list;
  }
}

// ── Formatação de data relativa ───────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)   return 'agora';
  if (m < 60)  return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE:     'Ativo',
  EXPIRED:    'Expirado',
  RESOLVED:   'Resolvido',
  CANCELLED:  'Cancelado',
  SUPERSEDED: 'Substituído',
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:     '#22C55E',
  EXPIRED:    '#94A3B8',
  RESOLVED:   '#3B82F6',
  CANCELLED:  '#EF4444',
  SUPERSEDED: '#F97316',
};

// ── Card ──────────────────────────────────────────────────────

function AlertaCard({ item }: { item: AlertaDTO }) {
  const color     = SEVERITY_COLOR[item.severidade];
  const sevLabel  = SEVERITY_LABEL[item.severidade];
  const catLabel  = CATEGORIA_LABEL[item.categoria];
  const statLabel = STATUS_LABEL[item.status]  ?? item.status;
  const statColor = STATUS_COLOR[item.status]  ?? '#94A3B8';
  const title     = item.titulo ?? catLabel;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/alerta-detalhe', params: { id: item.id } } as never)}
      activeOpacity={0.8}
    >
      {/* Barra lateral */}
      <View style={[styles.cardAccent, { backgroundColor: color }]} />

      <View style={styles.cardBody}>
        {/* Badges topo */}
        <View style={styles.cardBadges}>
          <View style={[styles.sevBadge, { backgroundColor: `${color}20` }]}>
            <Text style={[styles.sevBadgeText, { color }]}>{sevLabel}</Text>
          </View>
          <View style={[styles.statBadge, { backgroundColor: `${statColor}15` }]}>
            <Text style={[styles.statBadgeText, { color: statColor }]}>{statLabel}</Text>
          </View>
          {item.requerAck && (
            <Ionicons name="alert-circle" size={14} color={Colors.brand.dark_orange} />
          )}
        </View>

        {/* Título */}
        <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>

        {/* Mensagem preview */}
        <Text style={styles.cardMsg} numberOfLines={2}>{item.mensagem}</Text>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Ionicons name="folder-outline" size={11} color="#94A3B8" />
          <Text style={styles.cardCat}>{catLabel}</Text>
          <Text style={styles.cardDot}>·</Text>
          <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Tela ──────────────────────────────────────────────────────

export default function AlertasScreen() {
  const { alertas, notificationCount, isLoading, refresh, clearFloating } = useAlerta();
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      clearFloating();
      refresh();
    }, []),
  );

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const filtered = applyFilter([...alertas].sort(sortBySeveridade), filtro);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={Colors.neutral.gray} />

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.blue.dark} />
        </TouchableOpacity>
        <View style={styles.topBarText}>
          <Text style={styles.title}>Alertas</Text>
          <Text style={styles.subtitle}>Avisos e notificações</Text>
        </View>
        {notificationCount > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{notificationCount}</Text>
          </View>
        )}
      </View>

      {/* Filtros */}
      <View style={styles.chipWrap}>
        <ChipBar
          options={FILTROS.map((f) => ({ key: f.key, label: f.label }))}
          selected={filtro}
          onChange={(k) => setFiltro(k as Filtro)}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={filtered.length === 0 ? styles.centerFlex : styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={onRefresh}
            colors={[Colors.blue.dark]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={52} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Nenhum alerta</Text>
            <Text style={styles.emptyDesc}>
              Quando a Defesa Civil emitir avisos eles aparecerão aqui.
            </Text>
          </View>
        }
        renderItem={({ item }) => <AlertaCard item={item} />}
      />
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.neutral.gray },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  backBtn:    { padding: 4 },
  topBarText: { flex: 1 },
  title:      { fontSize: 18, fontWeight: '800', color: Colors.blue.dark },
  subtitle:   { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  countBadge: {
    backgroundColor: Colors.brand.dark_orange,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  chipWrap: { paddingHorizontal: 16, paddingBottom: 8 },

  list:      { paddingHorizontal: 16, paddingBottom: 100 },
  centerFlex:{ flex: 1 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  emptyDesc:  { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  cardAccent: { width: 4 },
  cardBody:   { flex: 1, padding: 12, gap: 5 },
  cardBadges: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  sevBadge:   { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  sevBadgeText:{ fontSize: 10, fontWeight: '700' },
  statBadge:  { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  statBadgeText:{ fontSize: 10, fontWeight: '700' },
  cardTitle:  { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  cardMsg:    { fontSize: 12, color: '#4B5563', lineHeight: 17 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cardCat:    { fontSize: 11, color: '#94A3B8' },
  cardDot:    { fontSize: 11, color: '#CBD5E1' },
  cardTime:   { fontSize: 11, color: '#94A3B8' },
});
