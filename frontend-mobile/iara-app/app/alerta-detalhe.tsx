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
import { useAppModal } from '../components/AppModal';
import { api } from '../services/api';
import {
  SEVERITY_COLOR,
  SEVERITY_LABEL,
  CATEGORIA_LABEL,
  type AlertaDTO,
} from '../context/AlertaContext';

// ── Formatação ────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const GEOFENCE_LABEL: Record<string, string> = {
  INSIDE: 'Dentro da área',
  NEAR:   'Próximo da área',
  HOME:   'Endereço residencial na área',
};

// ── Tela ─────────────────────────────────────────────────────

export default function AlertaDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accessToken } = useAuth();
  const { show, modal } = useAppModal();

  const [alerta, setAlerta]   = useState<AlertaDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [ackDone, setAckDone] = useState(false);
  const [ackLoading, setAckLoading] = useState(false);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${accessToken}` }),
    [accessToken],
  );

  // Carrega o alerta
  useEffect(() => {
    if (!accessToken || !id) return;
    api.get<AlertaDTO>(`/alertas/${id}`, { headers })
      .then((r) => setAlerta(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken, id]);

  // Auto-visualiza ao abrir
  useEffect(() => {
    if (!accessToken || !id) return;
    api.patch(`/alertas/${id}/visualizar`, {}, { headers }).catch(() => {});
  }, [accessToken, id]);

  async function sendAck(acao: 'ACKNOWLEDGE' | 'ACCEPT' | 'REFUSE' | 'UNAVAILABLE') {
    setAckLoading(true);
    try {
      await api.patch(`/alertas/${id}/ack`, { acao }, { headers });
      setAckDone(true);
      show({ type: 'success', title: 'Confirmado!', message: 'Sua resposta foi registrada.' });
    } catch {
      show({ type: 'error', title: 'Erro', message: 'Não foi possível enviar sua resposta.' });
    } finally {
      setAckLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.blue.dark} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!alerta) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.blue.dark} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Alerta</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Alerta não encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const color    = SEVERITY_COLOR[alerta.severidade];
  const sevLabel = SEVERITY_LABEL[alerta.severidade];
  const catLabel = CATEGORIA_LABEL[alerta.categoria];
  const title    = alerta.titulo ?? catLabel;
  const isTech   = alerta.categoria === 'TECHNICAL_REQUEST';

  return (
    <SafeAreaView style={styles.safeArea}>
      {modal}
      <StatusBar style="dark" backgroundColor={Colors.neutral.gray} />

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.blue.dark} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>{title}</Text>
        <View style={[styles.sevBadge, { backgroundColor: color }]}>
          <Text style={styles.sevBadgeText}>{sevLabel}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Card principal */}
        <View style={[styles.card, { borderTopColor: color, borderTopWidth: 3 }]}>
          {/* Categoria */}
          <View style={[styles.catBadge, { backgroundColor: `${color}15` }]}>
            <Text style={[styles.catText, { color }]}>{catLabel}</Text>
          </View>

          {/* Mensagem */}
          <Text style={styles.cardLabel}>Mensagem</Text>
          <Text style={styles.mensagem}>{alerta.mensagem}</Text>

          {/* Datas */}
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Emitido em</Text>
              <Text style={styles.metaValue}>{formatDate(alerta.createdAt)}</Text>
            </View>
            {alerta.dataExpiracao && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Expira em</Text>
                <Text style={styles.metaValue}>{formatDate(alerta.dataExpiracao)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Cobertura geográfica */}
        {alerta.coordenadas && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="location-outline" size={16} color={Colors.blue.dark} />
              <Text style={styles.cardSectionTitle}>Área de Cobertura</Text>
            </View>
            {alerta.raioMetros && (
              <Text style={styles.metaValue}>
                Raio de <Text style={{ fontWeight: '700' }}>
                  {(alerta.raioMetros / 1000).toFixed(1)} km
                </Text> ao redor do ponto
              </Text>
            )}
          </View>
        )}

        {/* ACK */}
        {alerta.requerAck && (
          <View style={[styles.card, styles.ackCard]}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color={color} />
              <Text style={[styles.cardSectionTitle, { color }]}>
                {isTech ? 'Sua Disponibilidade' : 'Confirmação'}
              </Text>
            </View>

            {ackDone ? (
              <View style={styles.ackDoneRow}>
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                <Text style={styles.ackDoneText}>Resposta registrada com sucesso.</Text>
              </View>
            ) : isTech ? (
              <View style={styles.ackBtns}>
                <TouchableOpacity
                  style={[styles.ackBtn, { backgroundColor: '#22C55E' }]}
                  onPress={() => sendAck('ACCEPT')}
                  disabled={ackLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.ackBtnText}>Aceitar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ackBtn, { backgroundColor: '#EF4444' }]}
                  onPress={() => sendAck('REFUSE')}
                  disabled={ackLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                  <Text style={styles.ackBtnText}>Recusar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ackBtn, { backgroundColor: '#94A3B8' }]}
                  onPress={() => sendAck('UNAVAILABLE')}
                  disabled={ackLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="remove-circle-outline" size={16} color="#fff" />
                  <Text style={styles.ackBtnText}>Indisponível</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: color }]}
                onPress={() => sendAck('ACKNOWLEDGE')}
                disabled={ackLoading}
                activeOpacity={0.8}
              >
                {ackLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                      <Text style={styles.confirmBtnText}>Confirmar recebimento</Text>
                    </>
                }
              </TouchableOpacity>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: Colors.neutral.gray },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 14 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backBtn:      { padding: 4 },
  topBarTitle:  { flex: 1, fontSize: 17, fontWeight: '800', color: Colors.blue.dark },
  sevBadge:     { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  sevBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  scroll: { paddingHorizontal: 16, paddingBottom: 100 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  ackCard: { borderWidth: 1, borderColor: '#E2E8F0' },

  cardHeaderRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardSectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.blue.dark },
  cardLabel:        { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6 },

  catBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  catText:  { fontSize: 11, fontWeight: '700' },

  mensagem: { fontSize: 15, color: '#1E293B', lineHeight: 22 },

  metaGrid:  { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  metaItem:  { gap: 2 },
  metaLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 13, color: '#374151' },

  ackDoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ackDoneText:{ fontSize: 14, color: '#22C55E', fontWeight: '600' },

  ackBtns: { flexDirection: 'row', gap: 8 },
  ackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 12,
    paddingVertical: 11,
  },
  ackBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 13,
  },
  confirmBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
