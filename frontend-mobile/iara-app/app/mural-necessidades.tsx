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
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// ── Tipos ────────────────────────────────────────────────────

interface DemandaDTO {
  id: string;
  idTipo: string;
  tipoNome: string;
  prioridade: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA' | 'SUPRIDA';
  qtdSolicitada: number;
  qtdAtendida: number;
  descricao?: string;
  isActive: boolean;
}

// ── Constantes ───────────────────────────────────────────────

const PRIORIDADE_ORDER = ['CRITICA', 'ALTA', 'MEDIA', 'BAIXA', 'SUPRIDA'];

const PRIORIDADE: Record<string, { color: string; label: string; bg: string }> = {
  CRITICA: { color: '#DC2626', label: 'Urgente',    bg: '#FEE2E2' },
  ALTA:    { color: '#C2410C', label: 'Necessário', bg: '#FFEDD5' },
  MEDIA:   { color: '#A16207', label: 'Médio',      bg: '#FEF9C3' },
  BAIXA:   { color: '#166534', label: 'Suficiente', bg: '#DCFCE7' },
  SUPRIDA: { color: '#6B7280', label: 'Suprido',    bg: '#F3F4F6' },
};

// ── Tela ─────────────────────────────────────────────────────

export default function MuralNecessidades() {
  const { id, pcNome } = useLocalSearchParams<{ id: string; pcNome?: string }>();
  const { accessToken } = useAuth();

  const [demandas, setDemandas]     = useState<DemandaDTO[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${accessToken}` }),
    [accessToken],
  );

  const fetchDemandas = useCallback(async (force = false) => {
    if (!accessToken || !id) return;
    try {
      const res = await api.get<DemandaDTO[]>(
        `/pontos-coleta/${id}/demandas?is_active=true`,
        { headers },
      );
      const sorted = [...res.data].sort(
        (a, b) => PRIORIDADE_ORDER.indexOf(a.prioridade) - PRIORIDADE_ORDER.indexOf(b.prioridade),
      );
      setDemandas(sorted);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, id, headers]);

  useEffect(() => { fetchDemandas(); }, [fetchDemandas]);

  const titulo = pcNome ? `Mural — ${pcNome}` : 'Mural de Necessidades';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={Colors.neutral.gray} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.blue.dark} />
        </TouchableOpacity>
        <View style={styles.topBarText}>
          <Text style={styles.topBarTitle} numberOfLines={1}>{titulo}</Text>
          {!loading && (
            <Text style={styles.topBarSub}>{demandas.length} {demandas.length === 1 ? 'item' : 'itens'}</Text>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.blue.dark} size="large" />
        </View>
      ) : (
        <FlatList
          data={demandas}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchDemandas(true); }}
              colors={[Colors.blue.dark]}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyText}>Nenhuma necessidade ativa.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const cfg = PRIORIDADE[item.prioridade] ?? PRIORIDADE.BAIXA;
            const progresso = item.qtdSolicitada > 0
              ? Math.min((item.qtdAtendida / item.qtdSolicitada) * 100, 100)
              : 0;

            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardNome}>{item.tipoNome}</Text>
                  <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>

                {item.descricao ? (
                  <Text style={styles.cardDesc}>{item.descricao}</Text>
                ) : null}

                <View style={styles.progressRow}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progresso}%` as any, backgroundColor: cfg.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressLabel}>
                    {item.qtdAtendida}/{item.qtdSolicitada}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ── Estilos ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:       { flex: 1, backgroundColor: Colors.neutral.gray },
  topBar:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  backBtn:        { padding: 4 },
  topBarText:     { flex: 1 },
  topBarTitle:    { fontSize: 17, fontWeight: '800', color: Colors.blue.dark },
  topBarSub:      { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  list:           { paddingHorizontal: 16, paddingBottom: 40 },
  center:         { paddingTop: 60, alignItems: 'center', gap: 12 },
  emptyText:      { fontSize: 14, color: '#94A3B8', textAlign: 'center' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardTop:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardNome:     { flex: 1, fontSize: 14, fontWeight: '700', color: '#1E293B' },
  cardDesc:     { fontSize: 12, color: '#64748B', lineHeight: 17 },
  badge:        { borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText:    { fontSize: 11, fontWeight: '700' },
  progressRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar:  { flex: 1, height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel:{ fontSize: 11, color: '#94A3B8', width: 44, textAlign: 'right' },
});
