import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
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
import { apiCached, TTL } from '../lib/cache';

// ── Tipos ────────────────────────────────────────────────────

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

// ── Tela ─────────────────────────────────────────────────────

export default function PontoApoioDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accessToken } = useAuth();

  const [ponto, setPonto] = useState<PontoApoioDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${accessToken}` }),
    [accessToken],
  );

  useEffect(() => {
    if (!accessToken || !id) return;
    apiCached<PontoApoioDTO>(`/pontos-apoio/${id}`, headers, TTL.pontos)
      .then(setPonto)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken, id, headers]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}><ActivityIndicator color={Colors.blue.dark} size="large" /></View>
      </SafeAreaView>
    );
  }

  if (!ponto) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.blue.dark} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Ponto não encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={Colors.neutral.gray} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.blue.dark} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>{ponto.nome}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Zona de risco */}
        {ponto.zonaRiscoNome && (
          <View style={styles.zonaTag}>
            <Ionicons name="warning" size={15} color="#F97316" />
            <Text style={styles.zonaText}>Zona de Risco: {ponto.zonaRiscoNome}</Text>
          </View>
        )}

        {/* Card principal de informações */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Informações</Text>

          {ponto.descricao && (
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Descrição</Text>
              <Text style={styles.infoValue}>{ponto.descricao}</Text>
            </View>
          )}

          {ponto.enderecoTxt && (
            <InfoRow icon="location-outline" label="Endereço" value={ponto.enderecoTxt} />
          )}

          {ponto.responsavel && (
            <InfoRow icon="person-outline" label="Responsável" value={ponto.responsavel} />
          )}

          {ponto.contato && (
            <InfoRow icon="call-outline" label="Contato" value={ponto.contato} />
          )}

          <InfoRow
            icon="navigate-outline"
            label="Coordenadas"
            value={`${ponto.coordenadas.lat.toFixed(5)}, ${ponto.coordenadas.lng.toFixed(5)}`}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Componente auxiliar ───────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as never} size={16} color="#94A3B8" style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:       { flex: 1, backgroundColor: Colors.neutral.gray },
  topBar:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  backBtn:        { padding: 4 },
  topBarTitle:    { flex: 1, fontSize: 17, fontWeight: '800', color: Colors.blue.dark },
  scroll:         { paddingHorizontal: 16, paddingBottom: 40 },
  center:         { paddingTop: 60, alignItems: 'center' },
  emptyText:      { fontSize: 14, color: '#94A3B8' },

  zonaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  zonaText:       { fontSize: 13, fontWeight: '600', color: '#F97316', flex: 1 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardSectionTitle: { fontSize: 13, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6 },

  infoBlock:      { gap: 4 },
  infoRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoIcon:       { marginTop: 2 },
  infoContent:    { flex: 1, gap: 2 },
  infoLabel:      { fontSize: 11, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue:      { fontSize: 14, color: '#1E293B', fontWeight: '500', lineHeight: 20 },
});
