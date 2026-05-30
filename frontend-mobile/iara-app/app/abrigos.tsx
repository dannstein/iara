import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { apiCached, TTL } from '../lib/cache';
import { api } from '../services/api';

interface AbrigoDTO {
  id: string;
  nome: string;
  descricao?: string;
  coordenadas: { lat: number; lng: number };
  capacidadeTotal: number;
  ocupacaoAtual: number;
  contato?: string;
  isActive: boolean;
}

function ocupacaoPct(ab: AbrigoDTO) {
  if (!ab.capacidadeTotal) return 0;
  return Math.round((ab.ocupacaoAtual / ab.capacidadeTotal) * 100);
}

function ocupacaoColor(pct: number) {
  if (pct >= 90) return '#EF4444';
  if (pct >= 70) return '#F97316';
  return '#22C55E';
}

export default function AbrigosScreen() {
  const { accessToken } = useAuth();
  const [abrigos, setAbrigos] = useState<AbrigoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headers = useMemo(() => ({ Authorization: `Bearer ${accessToken}` }), [accessToken]);

  const fetch = useCallback(async (force = false) => {
    if (!accessToken) return;
    try {
      const data = force
        ? (await api.get<AbrigoDTO[]>('/abrigos?is_active=true', { headers })).data
        : await apiCached<AbrigoDTO[]>('/abrigos?is_active=true', headers, TTL.abrigos);
      setAbrigos(data);
    } catch {} finally {
      setLoading(false); setRefreshing(false);
    }
  }, [accessToken, headers]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={Colors.neutral.gray} />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.blue.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Abrigos</Text>
        <View style={styles.countBadge}><Text style={styles.countText}>{abrigos.length}</Text></View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.blue.dark} size="large" /></View>
      ) : (
        <FlatList
          data={abrigos}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(true); }} colors={[Colors.blue.dark]} />}
          ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>Nenhum abrigo ativo.</Text></View>}
          renderItem={({ item }) => {
            const pct   = ocupacaoPct(item);
            const color = ocupacaoColor(pct);
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.nome}</Text>
                  <View style={[styles.pctBadge, { backgroundColor: `${color}20` }]}>
                    <Text style={[styles.pctText, { color }]}>{pct}% ocupado</Text>
                  </View>
                </View>
                {item.descricao ? <Text style={styles.cardDesc} numberOfLines={2}>{item.descricao}</Text> : null}
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Ionicons name="people-outline" size={14} color="#64748B" />
                    <Text style={styles.statText}>{item.ocupacaoAtual} / {item.capacidadeTotal} vagas</Text>
                  </View>
                  {item.contato ? (
                    <View style={styles.stat}>
                      <Ionicons name="call-outline" size={14} color="#64748B" />
                      <Text style={styles.statText}>{item.contato}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: color }]} />
                </View>
                <TouchableOpacity style={styles.detailsBtn} activeOpacity={0.8}>
                  <Text style={styles.detailsBtnText}>Ver detalhes</Text>
                  <Ionicons name="chevron-forward" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: Colors.neutral.gray },
  topBar:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  backBtn:     { padding: 4 },
  title:       { fontSize: 18, fontWeight: '800', color: Colors.blue.dark, flex: 1 },
  countBadge:  { backgroundColor: Colors.blue.dark, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  countText:   { color: '#fff', fontSize: 12, fontWeight: '700' },
  list:        { paddingHorizontal: 16, paddingBottom: 100 },
  center:      { paddingTop: 60, alignItems: 'center' },
  emptyText:   { color: '#94A3B8', fontSize: 14 },
  card:        { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, gap: 12 },
  cardTop:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle:   { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.blue.dark },
  pctBadge:    { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  pctText:     { fontSize: 11, fontWeight: '700' },
  cardDesc:    { fontSize: 12, color: '#64748B', lineHeight: 17 },
  statsRow:    { flexDirection: 'row', gap: 16 },
  stat:        { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText:    { fontSize: 12, color: '#64748B' },
  progressBar: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill:{ height: '100%', borderRadius: 3 },
  detailsBtn:  { backgroundColor: Colors.blue.dark, borderRadius: 12, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  detailsBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
