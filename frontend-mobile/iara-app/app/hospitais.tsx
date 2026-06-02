import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getPinned, togglePin } from '../lib/pinnedLocations';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { apiCached, TTL } from '../lib/cache';
import { api } from '../services/api';

interface HospitalDTO {
  id: string;
  nome: string;
  tipo: 'PUBLICO' | 'PRIVADO' | 'MISTO' | 'CAMPANHA';
  coordenadas: { lat: number; lng: number };
  contato?: string;
  leitosTotal?: number;
  leitosDisponiveis?: number;
  leitosUti?: number;
  leitosUtiDisp?: number;
  aceitaCampanha?: boolean;
  isActive: boolean;
}

const openInMaps = (lat: number, lng: number) =>
  Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);

const TIPO_LABEL: Record<string, { label: string; color: string }> = {
  PUBLICO:   { label: 'Público',    color: '#3B82F6' },
  PRIVADO:   { label: 'Privado',    color: '#8B5CF6' },
  MISTO:     { label: 'Misto',      color: '#F97316' },
  CAMPANHA:  { label: 'Campanha',   color: '#EF4444' },
};

export default function HospitaisScreen() {
  const { accessToken } = useAuth();
  const [hospitais, setHospitais]   = useState<HospitalDTO[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pinnedIds, setPinnedIds]   = useState<Set<string>>(new Set());

  const headers = useMemo(() => ({ Authorization: `Bearer ${accessToken}` }), [accessToken]);

  useEffect(() => {
    getPinned().then((list) => {
      setPinnedIds(new Set(list.filter((p) => p.tipo === 'hospital').map((p) => p.id)));
    });
  }, []);

  async function handlePin(item: HospitalDTO) {
    const nowPinned = await togglePin({ id: item.id, tipo: 'hospital', nome: item.nome });
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (nowPinned) next.add(item.id); else next.delete(item.id);
      return next;
    });
  }

  const fetch = useCallback(async (force = false) => {
    if (!accessToken) return;
    try {
      const data = force
        ? (await api.get<HospitalDTO[]>('/hospitais', { headers })).data
        : await apiCached<HospitalDTO[]>('/hospitais', headers, TTL.hospitais);
      setHospitais(data.filter((h) => h.isActive));
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
        <Text style={styles.title}>Hospitais</Text>
        <View style={styles.countBadge}><Text style={styles.countText}>{hospitais.length}</Text></View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.blue.dark} size="large" /></View>
      ) : (
        <FlatList
          data={hospitais}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(true); }} colors={[Colors.blue.dark]} />}
          ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>Nenhum hospital cadastrado.</Text></View>}
          renderItem={({ item }) => {
            const tipoCfg = TIPO_LABEL[item.tipo] ?? { label: item.tipo, color: '#64748B' };
            return (
              <View style={styles.card}>
                {/* Badges de tipo */}
                <View style={styles.cardTop}>
                  <View style={[styles.tipoBadge, { backgroundColor: `${tipoCfg.color}18` }]}>
                    <Text style={[styles.tipoText, { color: tipoCfg.color }]}>{tipoCfg.label}</Text>
                  </View>
                  {item.aceitaCampanha && (
                    <View style={styles.campBadge}><Text style={styles.campText}>Aceita campanha</Text></View>
                  )}
                </View>

                {/* Nome + fixar */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.cardTitle, { flex: 1 }]}>{item.nome}</Text>
                  <TouchableOpacity onPress={() => handlePin(item)} hitSlop={8} activeOpacity={0.7}>
                    <Ionicons
                      name={pinnedIds.has(item.id) ? 'bookmark' : 'bookmark-outline'}
                      size={20}
                      color={pinnedIds.has(item.id) ? Colors.brand.dark_orange : '#94A3B8'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Localização */}
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={13} color="#6B7280" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {item.coordenadas.lat.toFixed(5)}, {item.coordenadas.lng.toFixed(5)}
                  </Text>
                </View>

                {/* Stats leitos */}
                <View style={styles.statsRow}>
                  {item.leitosDisponiveis != null && (
                    <View style={styles.stat}>
                      <Ionicons name="bed-outline" size={14} color="#64748B" />
                      <Text style={styles.statText}>{item.leitosDisponiveis}/{item.leitosTotal ?? '?'} leitos</Text>
                    </View>
                  )}
                  {item.leitosUtiDisp != null && (
                    <View style={styles.stat}>
                      <Ionicons name="pulse-outline" size={14} color="#EF4444" />
                      <Text style={[styles.statText, { color: '#EF4444' }]}>{item.leitosUtiDisp} UTI disp.</Text>
                    </View>
                  )}
                </View>

                {/* Contato */}
                {item.contato ? (
                  <View style={styles.stat}>
                    <Ionicons name="call-outline" size={13} color="#64748B" />
                    <Text style={styles.statText}>{item.contato}</Text>
                  </View>
                ) : null}

                {/* Botões */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.mapBtn}
                    onPress={() => openInMaps(item.coordenadas.lat, item.coordenadas.lng)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="map-outline" size={14} color={Colors.blue.medium} />
                    <Text style={styles.mapBtnText}>Ver no Mapa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.detailsBtn} activeOpacity={0.8}>
                    <Text style={styles.detailsBtnText}>Ver Detalhes</Text>
                    <Ionicons name="chevron-forward" size={15} color="#fff" />
                  </TouchableOpacity>
                </View>
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
  countBadge:  { backgroundColor: '#EF4444', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  countText:   { color: '#fff', fontSize: 12, fontWeight: '700' },
  list:        { paddingHorizontal: 16, paddingBottom: 100 },
  center:      { paddingTop: 60, alignItems: 'center' },
  emptyText:   { color: '#94A3B8', fontSize: 14 },
  card:        { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, gap: 12 },
  cardTop:     { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  cardTitle:   { fontSize: 15, fontWeight: '700', color: Colors.blue.dark },
  tipoBadge:   { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  tipoText:    { fontSize: 11, fontWeight: '700' },
  campBadge:   { backgroundColor: '#F97316', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  campText:    { fontSize: 11, fontWeight: '700', color: '#fff' },
  statsRow:    { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  stat:        { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText:    { fontSize: 12, color: '#64748B' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationText:{ flex: 1, fontSize: 12, color: '#6B7280' },
  actionRow:   { flexDirection: 'row', gap: 8 },
  mapBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 12, paddingVertical: 10, borderWidth: 1.5, borderColor: Colors.blue.medium },
  mapBtnText:  { color: Colors.blue.medium, fontSize: 13, fontWeight: '700' },
  detailsBtn:  { flex: 1, backgroundColor: Colors.blue.dark, borderRadius: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  detailsBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
