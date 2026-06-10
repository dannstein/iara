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
import { apiCached, TTL } from '../lib/cache';
import { api } from '../services/api';
import { LocalCard, type InventarioItem } from '../components/LocalCard';

// ── Tipos ────────────────────────────────────────────────────

interface PcDTO {
  id: string;
  pcNome: string;
  pcTipo?: 'FIXO' | 'TEMPORARIO';
  coordenadas: { lat: number; lng: number };
  pcDesc?: string;
  pcContato?: string;
  pcIsVerified: boolean;
  isActive: boolean;
}

interface DemandaDTO {
  id: string;
  tipoNome: string;
  prioridade: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA' | 'SUPRIDA';
  qtdSolicitada: number;
  qtdAtendida: number;
  isActive: boolean;
}

interface PcComDemandas extends PcDTO {
  demandas: InventarioItem[];
}

// ── Ordenação por confiança ───────────────────────────────────

function pontuacao(pc: PcDTO): number {
  let s = 0;
  if (pc.pcIsVerified)      s += 10;
  if (pc.pcTipo === 'FIXO') s += 5;
  return s;
}

// ── Tela ─────────────────────────────────────────────────────

export default function PontosColetaScreen() {
  const { accessToken } = useAuth();
  const [pcsComDemandas, setPcsComDemandas] = useState<PcComDemandas[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headers = useMemo(() => ({ Authorization: `Bearer ${accessToken}` }), [accessToken]);

  const fetchTudo = useCallback(async (force = false) => {
    if (!accessToken) return;
    try {
      const pcs = await apiCached<PcDTO[]>('/pontos-coleta?is_active=true', headers, TTL.pontos);

      const ordenados = [...pcs].sort((a, b) => pontuacao(b) - pontuacao(a));

      const comDemandas = await Promise.all(
        ordenados.map(async (pc) => {
          try {
            const dems = await apiCached<DemandaDTO[]>(
              `/pontos-coleta/${pc.id}/demandas?is_active=true`,
              headers,
              TTL.pontos,
            );
            const inventario: InventarioItem[] = dems
              .filter((d) => d.prioridade !== 'SUPRIDA')
              .map((d) => ({ tipoNome: d.tipoNome, prioridade: d.prioridade }));
            return { ...pc, demandas: inventario };
          } catch {
            return { ...pc, demandas: [] };
          }
        }),
      );

      setPcsComDemandas(comDemandas);
    } catch {
      // mantém dados anteriores se falhar
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, headers]);

  useEffect(() => { fetchTudo(); }, [fetchTudo]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTudo(true);
  }, [fetchTudo]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={Colors.neutral.gray} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.blue.dark} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Pontos de Coleta</Text>
          <Text style={styles.subtitle}>Ordenados por confiança</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{pcsComDemandas.length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.blue.dark} size="large" />
        </View>
      ) : (
        <FlatList
          data={pcsComDemandas}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.blue.dark]} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="archive-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>Nenhum ponto de coleta ativo.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <LocalCard
              nome={item.pcNome}
              tipo={item.pcTipo === 'FIXO' ? 'Fixo' : item.pcTipo === 'TEMPORARIO' ? 'Temporário' : undefined}
              isVerified={item.pcIsVerified}
              endereco={item.pcDesc}
              contato={item.pcContato}
              coordenadas={item.coordenadas}
              inventario={item.demandas}
              onPressDetails={() => router.push(`/ponto-coleta-detalhe?id=${item.id}` as never)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ── Estilos ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:   { flex: 1, backgroundColor: Colors.neutral.gray },
  topBar:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  backBtn:    { padding: 4 },
  title:      { fontSize: 18, fontWeight: '800', color: Colors.blue.dark },
  subtitle:   { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  countBadge: { marginLeft: 'auto', backgroundColor: Colors.blue.dark, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  countText:  { color: '#fff', fontSize: 12, fontWeight: '700' },
  list:       { paddingHorizontal: 16, paddingBottom: 100 },
  center:     { paddingTop: 60, alignItems: 'center', gap: 12 },
  emptyText:  { color: '#94A3B8', fontSize: 14, textAlign: 'center' },
});
