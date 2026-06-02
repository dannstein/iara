import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { api } from '../services/api';
import { useAppModal } from '../components/AppModal';
import { checkPinned, togglePin } from '../lib/pinnedLocations';

// ── Tipos ────────────────────────────────────────────────────

interface PcDTO {
  id: string;
  pcNome: string;
  pcTipo?: string;
  pcDesc?: string;
  pcContato?: string;
  pcIsVerified: boolean;
  coordenadas: { lat: number; lng: number };
}

interface DemandaDTO {
  id: string;
  idTipo: string;
  tipoNome: string;
  prioridade: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA' | 'SUPRIDA';
  qtdSolicitada: number;
  qtdAtendida: number;
  isActive: boolean;
}

interface EstoqueDTO {
  id: string;
  idTipo: string;
  tipoNome: string;
  quantidade: number;
}

// ── Cores por prioridade ─────────────────────────────────────

const PRIORIDADE: Record<string, { color: string; label: string; bg: string }> = {
  CRITICA: { color: '#DC2626', label: 'Urgente',    bg: '#FEE2E2' },
  ALTA:    { color: '#C2410C', label: 'Necessário', bg: '#FFEDD5' },
  MEDIA:   { color: '#A16207', label: 'Médio',      bg: '#FEF9C3' },
  BAIXA:   { color: '#166534', label: 'Suficiente', bg: '#DCFCE7' },
  SUPRIDA: { color: '#6B7280', label: 'Suprido',    bg: '#F3F4F6' },
};

const PRIORIDADE_ORDER = ['CRITICA', 'ALTA', 'MEDIA', 'BAIXA', 'SUPRIDA'];

// ── Tela ─────────────────────────────────────────────────────

export default function PontoColetaDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accessToken } = useAuth();
  const { show, modal } = useAppModal();

  const [pc, setPc]             = useState<PcDTO | null>(null);
  const [demandas, setDemandas] = useState<DemandaDTO[]>([]);
  const [estoque, setEstoque]   = useState<EstoqueDTO[]>([]);
  const [loading, setLoading]   = useState(true);
  const [pinned, setPinned] = useState(false);

  // Modal de doação
  const [modalVisible, setModalVisible] = useState(false);
  const [demandaSelecionada, setDemandaSelecionada] = useState<DemandaDTO | null>(null);
  const [quantidade, setQuantidade] = useState('');
  const [enviando, setEnviando]     = useState(false);

  const headers = useMemo(() => ({ Authorization: `Bearer ${accessToken}` }), [accessToken]);

  useEffect(() => {
    if (id) checkPinned(id, 'ponto-coleta').then(setPinned);
  }, [id]);

  async function handlePin() {
    if (!pc) return;
    const nowPinned = await togglePin({
      id: id as string, tipo: 'ponto-coleta',
      nome: pc.pcNome, endereco: pc.pcDesc,
    });
    setPinned(nowPinned);
  }

  useEffect(() => {
    if (!accessToken || !id) return;

    Promise.all([
      apiCached<PcDTO>(`/pontos-coleta/${id}`, headers, TTL.pontos),
      apiCached<DemandaDTO[]>(`/pontos-coleta/${id}/demandas?is_active=true`, headers, TTL.pontos),
      apiCached<EstoqueDTO[]>(`/pontos-coleta/${id}/estoque`, headers, TTL.pontos),
    ])
      .then(([pcData, demData, estData]) => {
        setPc(pcData);
        setEstoque(estData);
        const sorted = [...demData].sort(
          (a, b) => PRIORIDADE_ORDER.indexOf(a.prioridade) - PRIORIDADE_ORDER.indexOf(b.prioridade),
        );
        setDemandas(sorted);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken, id, headers]);

  const abrirDoacao = useCallback((demanda: DemandaDTO) => {
    setDemandaSelecionada(demanda);
    setQuantidade('');
    setModalVisible(true);
  }, []);

  const confirmarDoacao = useCallback(async () => {
    if (!demandaSelecionada || !id) return;
    const qty = parseInt(quantidade, 10);
    if (!qty || qty <= 0) {
      show({ type: 'warning', title: 'Atenção', message: 'Informe uma quantidade válida.' });
      return;
    }
    setEnviando(true);
    try {
      await api.post(
        '/doacoes',
        {
          idPc:      id,
          idDemanda: demandaSelecionada.id,
          idTipo:    demandaSelecionada.idTipo,
          quantidade: qty,
        },
        { headers },
      );
      setModalVisible(false);
      show({ type: 'success', title: 'Doação registrada!', message: 'Obrigado pela sua contribuição. O ponto de coleta irá confirmar o recebimento.' });
    } catch (err: any) {
      const msg = err?.response?.data?.mensagem ?? 'Erro ao registrar doação. Tente novamente.';
      show({ type: 'error', title: 'Erro', message: msg });
    } finally {
      setEnviando(false);
    }
  }, [demandaSelecionada, quantidade, id, headers]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}><ActivityIndicator color={Colors.blue.dark} size="large" /></View>
      </SafeAreaView>
    );
  }

  if (!pc) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}><Text style={styles.emptyText}>Ponto não encontrado.</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {modal}
      <StatusBar style="dark" backgroundColor={Colors.neutral.gray} />

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.blue.dark} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>{pc.pcNome}</Text>
        <TouchableOpacity onPress={handlePin} style={styles.pinBtn} activeOpacity={0.7}>
          <Ionicons
            name={pinned ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={pinned ? Colors.brand.dark_orange : '#94A3B8'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Info do PC */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            {pc.pcIsVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={13} color="#16A34A" />
                <Text style={styles.verifiedText}>Verificado</Text>
              </View>
            )}
            {pc.pcTipo && (
              <View style={styles.tipoBadge}>
                <Text style={styles.tipoText}>{pc.pcTipo === 'FIXO' ? 'Fixo' : 'Temporário'}</Text>
              </View>
            )}
          </View>

          {pc.pcDesc ? <Text style={styles.pcDesc}>{pc.pcDesc}</Text> : null}

          {pc.pcContato ? (
            <View style={styles.contactLine}>
              <Ionicons name="call-outline" size={14} color="#6B7280" />
              <Text style={styles.contactText}>{pc.pcContato}</Text>
            </View>
          ) : null}

          <View style={styles.contactLine}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.contactText}>
              {pc.coordenadas.lat.toFixed(5)}, {pc.coordenadas.lng.toFixed(5)}
            </Text>
          </View>
        </View>

        {/* ── Mural de Necessidades ─────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Mural de Necessidades</Text>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/mural-necessidades', params: { id, pcNome: pc.pcNome } } as never)}
            style={styles.verMaisBtn}
          >
            <Text style={styles.verMaisText}>Ver tudo</Text>
            <Ionicons name="chevron-forward" size={13} color={Colors.blue.medium} />
          </TouchableOpacity>
        </View>

        {demandas.filter(d => d.prioridade !== 'SUPRIDA').length === 0 ? (
          <View style={styles.emptySection}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#22C55E" />
            <Text style={styles.emptySectionText}>Nenhuma necessidade urgente no momento.</Text>
          </View>
        ) : (
          <View style={styles.chipsWrap}>
            {demandas.filter(d => d.prioridade !== 'SUPRIDA').slice(0, 6).map((d) => {
              const cfg = PRIORIDADE[d.prioridade] ?? PRIORIDADE.BAIXA;
              return (
                <View key={d.id} style={[styles.chip, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.chipText, { color: cfg.color }]}>{d.tipoNome}</Text>
                  <View style={[styles.chipBadge, { backgroundColor: cfg.color + '22' }]}>
                    <Text style={[styles.chipBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
              );
            })}
            {demandas.filter(d => d.prioridade !== 'SUPRIDA').length > 6 && (
              <View style={[styles.chip, { backgroundColor: '#F1F5F9' }]}>
                <Text style={[styles.chipText, { color: '#64748B' }]}>
                  +{demandas.filter(d => d.prioridade !== 'SUPRIDA').length - 6} mais
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Inventário ────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Inventário</Text>

        {estoque.length === 0 ? (
          <View style={styles.emptySection}>
            <Ionicons name="cube-outline" size={20} color="#94A3B8" />
            <Text style={styles.emptySectionText}>Nenhum item registrado no estoque.</Text>
          </View>
        ) : (
          <View style={styles.estoqueCard}>
            {estoque.map((item, idx) => (
              <View key={item.id}>
                <View style={styles.estoqueRow}>
                  <Ionicons name="cube-outline" size={15} color="#64748B" />
                  <Text style={styles.estoqueNome}>{item.tipoNome}</Text>
                  <View style={styles.estoqueQtdBadge}>
                    <Text style={styles.estoqueQtd}>{item.quantidade}</Text>
                  </View>
                </View>
                {idx < estoque.length - 1 && <View style={styles.estoqueDivider} />}
              </View>
            ))}
          </View>
        )}

        {/* ── Demandas detalhadas ───────────────────────────── */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Contribuir</Text>

        {demandas.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>Nenhuma demanda ativa no momento.</Text>
          </View>
        ) : (
          demandas.map((d) => {
            const cfg = PRIORIDADE[d.prioridade] ?? PRIORIDADE.BAIXA;
            const progresso = d.qtdSolicitada > 0
              ? Math.min((d.qtdAtendida / d.qtdSolicitada) * 100, 100)
              : 0;
            return (
              <View key={d.id} style={styles.demandaCard}>
                <View style={styles.demandaTop}>
                  <Text style={styles.demandaNome}>{d.tipoNome}</Text>
                  <View style={[styles.prioridadeBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.prioridadeText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>

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
                    {d.qtdAtendida}/{d.qtdSolicitada}
                  </Text>
                </View>

                {d.prioridade !== 'SUPRIDA' && (
                  <TouchableOpacity
                    style={[styles.doarBtn, { backgroundColor: cfg.color }]}
                    onPress={() => abrirDoacao(d)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="heart-outline" size={14} color="#fff" />
                    <Text style={styles.doarBtnText}>Quero Contribuir</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal de doação */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: 'padding', android: 'height' })}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Fazer Doação</Text>
            {demandaSelecionada && (
              <Text style={styles.modalSubtitle}>{demandaSelecionada.tipoNome}</Text>
            )}

            <Text style={styles.inputLabel}>Quantidade</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 5"
              keyboardType="number-pad"
              value={quantidade}
              onChangeText={setQuantidade}
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={confirmarDoacao}
                disabled={enviando}
              >
                {enviando
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.confirmBtnText}>Confirmar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Estilos ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:       { flex: 1, backgroundColor: Colors.neutral.gray },
  topBar:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  backBtn:        { padding: 4 },
  pinBtn:         { padding: 4 },
  topBarTitle:    { flex: 1, fontSize: 17, fontWeight: '800', color: Colors.blue.dark },
  scroll:         { paddingHorizontal: 16, paddingBottom: 100 },
  center:         { paddingTop: 60, alignItems: 'center' },
  emptyText:      { color: '#94A3B8', fontSize: 14 },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  infoRow:        { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  verifiedBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  verifiedText:   { fontSize: 11, fontWeight: '700', color: '#16A34A' },
  tipoBadge:      { backgroundColor: '#FFEDD5', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  tipoText:       { fontSize: 11, fontWeight: '600', color: '#C2410C' },
  pcDesc:         { fontSize: 13, color: '#4B5563', lineHeight: 18 },
  contactLine:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactText:    { fontSize: 12, color: '#6B7280' },

  sectionLabel:   { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  verMaisBtn:     { flexDirection: 'row', alignItems: 'center', gap: 2 },
  verMaisText:    { fontSize: 12, color: Colors.blue.medium, fontWeight: '600' },

  chipsWrap:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  chip:           { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  chipText:       { fontSize: 12, fontWeight: '600' },
  chipBadge:      { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  chipBadgeText:  { fontSize: 10, fontWeight: '700' },

  emptySection:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 16 },
  emptySectionText: { fontSize: 13, color: '#94A3B8' },

  estoqueCard:    { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  estoqueRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11 },
  estoqueNome:    { flex: 1, fontSize: 13, fontWeight: '500', color: '#1E293B' },
  estoqueQtdBadge:{ backgroundColor: Colors.blue.dark + '15', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  estoqueQtd:     { fontSize: 13, fontWeight: '700', color: Colors.blue.dark },
  estoqueDivider: { height: 1, backgroundColor: '#F1F5F9' },

  demandaCard: {
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
  demandaTop:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  demandaNome:      { flex: 1, fontSize: 14, fontWeight: '700', color: '#1E293B' },
  prioridadeBadge:  { borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3 },
  prioridadeText:   { fontSize: 11, fontWeight: '700' },
  progressRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar:      { flex: 1, height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill:     { height: '100%', borderRadius: 3 },
  progressLabel:    { fontSize: 11, color: '#94A3B8', width: 40, textAlign: 'right' },
  doarBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 9 },
  doarBtnText:      { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Modal
  modalOverlay:   { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet:     { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 36, gap: 12 },
  modalHandle:    { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalTitle:     { fontSize: 18, fontWeight: '800', color: '#1E293B', textAlign: 'center' },
  modalSubtitle:  { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: -4 },
  inputLabel:     { fontSize: 13, fontWeight: '600', color: '#374151' },
  input:          { backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0' },
  modalBtns:      { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn:      { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  cancelBtnText:  { fontSize: 14, fontWeight: '600', color: '#64748B' },
  confirmBtn:     { flex: 2, paddingVertical: 13, borderRadius: 12, backgroundColor: Colors.blue.dark, alignItems: 'center' },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
