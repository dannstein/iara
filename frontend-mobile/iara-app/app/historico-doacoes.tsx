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
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { apiCached } from '../lib/cache';
import { api } from '../services/api';

// ── Tipos ────────────────────────────────────────────────────

interface DoacaoDTO {
  id: string;
  idTipo: string;
  quantidade: number;
  status: 'PENDENTE' | 'CONFIRMADA' | 'CANCELADA' | 'EXPIRADA';
  descricao?: string;
  dataPrevista?: string;
  dataConfirmacao?: string;
  pcId: string;
  pdrReferencia?: string;
}

// ── Configurações visuais ────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; color: string; icon: string }> = {
  PENDENTE:   { label: 'Pendente',   color: '#F97316', icon: 'time-outline'           },
  CONFIRMADA: { label: 'Confirmada', color: '#22C55E', icon: 'checkmark-circle-outline'},
  CANCELADA:  { label: 'Cancelada',  color: '#EF4444', icon: 'close-circle-outline'   },
  EXPIRADA:   { label: 'Expirada',   color: '#94A3B8', icon: 'alert-circle-outline'   },
};

function formatDate(iso?: string): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('pt-BR'); } catch { return '—'; }
}

// ── Tela ─────────────────────────────────────────────────────

export default function HistoricoDoacoes() {
  const { accessToken } = useAuth();
  const [doacoes, setDoacoes]   = useState<DoacaoDTO[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headers = useMemo(() => ({ Authorization: `Bearer ${accessToken}` }), [accessToken]);

  const TTL_CURTO = 2 * 60_000; // 2 min — histórico muda com frequência

  const fetchDoacoes = useCallback(async (force = false) => {
    if (!accessToken) return;
    try {
      const data = await apiCached<DoacaoDTO[]>('/doacoes/minhas', headers, TTL_CURTO);
      setDoacoes(data);
    } catch {
      // mantém dados em cache
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, headers]);

  useEffect(() => { fetchDoacoes(); }, [fetchDoacoes]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDoacoes(true);
  }, [fetchDoacoes]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={Colors.neutral.gray} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.blue.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Histórico de Doações</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{doacoes.length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.blue.dark} size="large" />
        </View>
      ) : (
        <FlatList
          data={doacoes}
          keyExtractor={(i) => i.id}
          contentContainerStyle={doacoes.length === 0 ? styles.centerFlex : styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.blue.dark]} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="heart-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Nenhuma doação ainda</Text>
              <Text style={styles.emptyText}>Suas contribuições aparecerão aqui.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const cfg = STATUS_CFG[item.status] ?? STATUS_CFG.PENDENTE;
            return (
              <View style={styles.card}>
                {/* Barra lateral */}
                <View style={[styles.cardAccent, { backgroundColor: cfg.color }]} />

                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <View style={[styles.statusPill, { backgroundColor: `${cfg.color}18` }]}>
                      <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
                      <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                    <Text style={styles.qtd}>{item.quantidade}x</Text>
                  </View>

                  {item.descricao ? (
                    <Text style={styles.descricao} numberOfLines={2}>{item.descricao}</Text>
                  ) : null}

                  <View style={styles.datesRow}>
                    {item.dataPrevista && (
                      <View style={styles.dateItem}>
                        <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
                        <Text style={styles.dateText}>Prevista: {formatDate(item.dataPrevista)}</Text>
                      </View>
                    )}
                    {item.dataConfirmacao && (
                      <View style={styles.dateItem}>
                        <Ionicons name="checkmark-outline" size={12} color="#22C55E" />
                        <Text style={[styles.dateText, { color: '#22C55E' }]}>
                          Confirmada: {formatDate(item.dataConfirmacao)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {item.pdrReferencia && (
                    <Text style={styles.pdr}>PDR: {item.pdrReferencia}</Text>
                  )}
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
  safeArea:    { flex: 1, backgroundColor: Colors.neutral.gray },
  topBar:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  backBtn:     { padding: 4 },
  title:       { flex: 1, fontSize: 18, fontWeight: '800', color: Colors.blue.dark },
  countBadge:  { backgroundColor: Colors.blue.dark, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  countText:   { color: '#fff', fontSize: 12, fontWeight: '700' },
  list:        { paddingHorizontal: 16, paddingBottom: 100 },
  centerFlex:  { flex: 1 },
  center:      { paddingTop: 60, alignItems: 'center', gap: 10 },
  emptyTitle:  { fontSize: 16, fontWeight: '700', color: '#475569' },
  emptyText:   { fontSize: 13, color: '#94A3B8', textAlign: 'center' },

  card:        { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, flexDirection: 'row', overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  cardAccent:  { width: 4 },
  cardBody:    { flex: 1, padding: 12, gap: 6 },
  cardTop:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusPill:  { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  statusText:  { fontSize: 12, fontWeight: '700' },
  qtd:         { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  descricao:   { fontSize: 12, color: '#64748B', lineHeight: 17 },
  datesRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dateItem:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText:    { fontSize: 11, color: '#94A3B8' },
  pdr:         { fontSize: 10, color: '#CBD5E1', fontFamily: 'monospace' },
});
