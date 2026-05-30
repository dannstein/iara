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

interface PontoApoioDTO {
  id: string;
  nome: string;
  descricao?: string;
  coordenadas: { lat: number; lng: number };
  contato?: string;
  responsavel?: string;
  enderecoTxt?: string;
  zonaRiscoId?: string;
  zonaRiscoNome?: string;
  isActive: boolean;
}

export default function PontosApoioScreen() {
  const { accessToken } = useAuth();
  const [pontos, setPontos] = useState<PontoApoioDTO[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headers = useMemo(() => ({ Authorization: `Bearer ${accessToken}` }), [accessToken]);

  const fetch = useCallback(async (force = false) => {
    if (!accessToken) return;
    try {
      const data = force
        ? (await api.get<PontoApoioDTO[]>('/pontos-apoio', { headers })).data
        : await apiCached<PontoApoioDTO[]>('/pontos-apoio', headers, TTL.pontos);
      setPontos(data.filter((p) => p.isActive));
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
        <Text style={styles.title}>Pontos de Apoio</Text>
        <View style={styles.countBadge}><Text style={styles.countText}>{pontos.length}</Text></View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.blue.dark} size="large" /></View>
      ) : (
        <FlatList
          data={pontos}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(true); }} colors={[Colors.blue.dark]} />}
          ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>Nenhum ponto de apoio cadastrado.</Text></View>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.nome}</Text>
              {item.descricao ? <Text style={styles.cardDesc} numberOfLines={2}>{item.descricao}</Text> : null}
              {item.enderecoTxt ? (
                <View style={styles.row}>
                  <Ionicons name="location-outline" size={13} color="#64748B" />
                  <Text style={styles.rowText}>{item.enderecoTxt}</Text>
                </View>
              ) : null}
              {item.responsavel ? (
                <View style={styles.row}>
                  <Ionicons name="person-outline" size={13} color="#64748B" />
                  <Text style={styles.rowText}>{item.responsavel}</Text>
                </View>
              ) : null}
              {item.contato ? (
                <View style={styles.row}>
                  <Ionicons name="call-outline" size={13} color="#64748B" />
                  <Text style={styles.rowText}>{item.contato}</Text>
                </View>
              ) : null}
              {item.zonaRiscoNome ? (
                <View style={[styles.row, styles.zonaTag]}>
                  <Ionicons name="warning-outline" size={13} color="#F97316" />
                  <Text style={styles.zonaText}>Zona: {item.zonaRiscoNome}</Text>
                </View>
              ) : null}
            </View>
          )}
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
  countBadge:  { backgroundColor: Colors.brand.orange, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  countText:   { color: '#fff', fontSize: 12, fontWeight: '700' },
  list:        { paddingHorizontal: 16, paddingBottom: 100 },
  center:      { paddingTop: 60, alignItems: 'center' },
  emptyText:   { color: '#94A3B8', fontSize: 14 },
  card:        { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, gap: 6 },
  cardTitle:   { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  cardDesc:    { fontSize: 12, color: '#64748B', lineHeight: 17 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowText:     { fontSize: 12, color: '#64748B', flex: 1 },
  zonaTag:     { backgroundColor: '#FFF7ED', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  zonaText:    { fontSize: 11, color: '#F97316', fontWeight: '600' },
});
