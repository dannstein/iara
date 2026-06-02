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
import { LocalCard } from '../components/LocalCard';

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
  const [pontos, setPontos]         = useState<PontoApoioDTO[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headers = useMemo(() => ({ Authorization: `Bearer ${accessToken}` }), [accessToken]);

  const fetchData = useCallback(async (force = false) => {
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

  useEffect(() => { fetchData(); }, [fetchData]);

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchData(true); }}
              colors={[Colors.blue.dark]}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Nenhum ponto de apoio cadastrado.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <LocalCard
              nome={item.nome}
              tipo={item.zonaRiscoNome ? `Zona: ${item.zonaRiscoNome}` : undefined}
              endereco={item.enderecoTxt}
              contato={item.contato}
              coordenadas={item.coordenadas}
              onPressDetails={() =>
                router.push({ pathname: '/ponto-apoio-detalhe', params: { id: item.id } } as never)
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:   { flex: 1, backgroundColor: Colors.neutral.gray },
  topBar:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  backBtn:    { padding: 4 },
  title:      { fontSize: 18, fontWeight: '800', color: Colors.blue.dark, flex: 1 },
  countBadge: { backgroundColor: Colors.brand.orange, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  countText:  { color: '#fff', fontSize: 12, fontWeight: '700' },
  list:       { paddingHorizontal: 16, paddingBottom: 100 },
  center:     { paddingTop: 60, alignItems: 'center' },
  emptyText:  { color: '#94A3B8', fontSize: 14 },
});
