import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { ChipBar, type ChipOption } from '../components/ChipBar';
import { useAppModal } from '../components/AppModal';
import { apiCached } from '../lib/cache';
import { api } from '../services/api';

// ── Tipos ────────────────────────────────────────────────────

interface SolicitacaoServicoDTO {
  id: string;
  tipo: string;
  enderecoTxt: string;
  descricaoMotivo: string;
  status: 'ABERTA' | 'EM_TRIAGEM' | 'EM_ATENDIMENTO' | 'CONCLUIDA' | 'INDEFERIDA';
  prioridade?: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA' | null;
  createdAt: string;
}

// ── Constantes ───────────────────────────────────────────────

const TIPO_CFG: Record<string, { label: string; icon: string; color: string }> = {
  CORTE_ARVORE:       { label: 'Corte de árvore',      icon: 'leaf-outline',        color: '#22C55E' },
  VISTORIA_RACHADURA: { label: 'Vistoria de rachadura', icon: 'build-outline',       color: '#F97316' },
  LIMPEZA_BUEIRO:     { label: 'Limpeza de bueiro',     icon: 'water-outline',       color: '#3B82F6' },
  RISCO_DESLIZAMENTO: { label: 'Risco de deslizamento', icon: 'warning-outline',     color: '#EF4444' },
  OUTRO:              { label: 'Outro',                 icon: 'help-circle-outline', color: '#64748B' },
};

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  ABERTA:         { label: 'Solicitado',     color: '#EAB308' },
  EM_TRIAGEM:     { label: 'Em revisão',     color: '#3B82F6' },
  EM_ATENDIMENTO: { label: 'Em atendimento', color: '#8B5CF6' },
  CONCLUIDA:      { label: 'Finalizado',     color: '#22C55E' },
  INDEFERIDA:     { label: 'Cancelado',      color: '#64748B' },
};

const FILTER_CHIPS: ChipOption[] = [
  { key: 'todos',      label: 'Todos'        },
  { key: 'abertas',    label: 'Abertas'      },
  { key: 'andamento',  label: 'Em andamento' },
  { key: 'concluidas', label: 'Concluídas'   },
];

const FILTER_STATUSES: Record<string, readonly string[] | null> = {
  todos:      null,
  abertas:    ['ABERTA', 'EM_TRIAGEM'],
  andamento:  ['EM_ATENDIMENTO'],
  concluidas: ['CONCLUIDA', 'INDEFERIDA'],
};

function relativeDate(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `há ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `há ${hrs}h`;
    return `há ${Math.floor(hrs / 24)}d`;
  } catch { return '—'; }
}

// ── Tela ─────────────────────────────────────────────────────

export default function Solicitacoes() {
  const { accessToken } = useAuth();
  const { show, modal } = useAppModal();

  const [view, setView]             = useState<'list' | 'form'>('list');
  const [minhas, setMinhas]         = useState<SolicitacaoServicoDTO[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]         = useState('todos');

  const [tipo, setTipo]           = useState('');
  const [endereco, setEndereco]   = useState('');
  const [descricao, setDescricao] = useState('');
  const [fotos, setFotos]         = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${accessToken}` }),
    [accessToken],
  );

  const fetchMinhas = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await apiCached<SolicitacaoServicoDTO[]>(
        '/solicitacoes-servico/minhas', headers,
      );
      setMinhas(data);
    } catch { } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, headers]);

  useEffect(() => { fetchMinhas(); }, [fetchMinhas]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMinhas();
  }, [fetchMinhas]);

  const filtered = useMemo(() => {
    const statuses = FILTER_STATUSES[filter];
    if (!statuses) return minhas;
    return minhas.filter((s) => statuses.includes(s.status));
  }, [minhas, filter]);

  function resetForm() {
    setTipo(''); setEndereco(''); setDescricao(''); setFotos([]);
  }

  function openForm()  { resetForm(); setView('form'); }
  function closeForm() { resetForm(); setView('list'); }

  async function pickFotos() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*', multiple: true, copyToCacheDirectory: true,
      });
      if (!result.canceled) setFotos((prev) => [...prev, ...result.assets]);
    } catch {
      show({ type: 'error', title: 'Erro', message: 'Não foi possível acessar as fotos.' });
    }
  }

  async function handleSubmit() {
    if (!tipo)           { show({ type: 'warning', title: 'Atenção', message: 'Selecione o tipo do problema.' }); return; }
    if (!endereco.trim()){ show({ type: 'warning', title: 'Atenção', message: 'Informe o endereço do problema.' }); return; }
    if (!descricao.trim()){ show({ type: 'warning', title: 'Atenção', message: 'Descreva o problema observado.' }); return; }
    if (fotos.length === 0){ show({ type: 'warning', title: 'Atenção', message: 'Adicione ao menos uma foto.' }); return; }

    const formData = new FormData();
    formData.append('tipo', tipo);
    formData.append('enderecoTxt', endereco.trim());
    formData.append('descricaoMotivo', descricao.trim());
    fotos.forEach((f) =>
      formData.append('fotos', { uri: f.uri, name: f.name, type: f.mimeType ?? 'image/jpeg' } as never),
    );

    setSubmitting(true);
    try {
      await api.post('/solicitacoes-servico', formData, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'multipart/form-data' },
      });
      setView('list');
      resetForm();
      fetchMinhas();
      show({ type: 'success', title: 'Enviado!', message: 'Sua solicitação foi registrada e será analisada pela equipe.' });
    } catch {
      show({ type: 'error', title: 'Erro ao enviar', message: 'Não foi possível registrar sua solicitação. Tente novamente.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={Colors.neutral.gray} />
      {modal}

      {view === 'list' ? (
        <>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color={Colors.blue.dark} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Solicitações</Text>
              <Text style={styles.headerSub}>Serviços preventivos reportados</Text>
            </View>
            <TouchableOpacity style={styles.newBtn} onPress={openForm} activeOpacity={0.8}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ChipBar options={FILTER_CHIPS} selected={filter} onChange={setFilter} style={styles.chipBar} />

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.blue.dark} size="large" />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(i) => i.id}
              contentContainerStyle={filtered.length === 0 ? styles.centerFlex : styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.blue.dark]} />
              }
              ListEmptyComponent={
                <View style={styles.center}>
                  <Ionicons name="shield-checkmark-outline" size={52} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>Nenhuma solicitação ainda</Text>
                  <Text style={styles.emptyDesc}>Use o botão + para reportar um problema na sua comunidade.</Text>
                  <TouchableOpacity style={styles.emptyBtn} onPress={openForm} activeOpacity={0.8}>
                    <Ionicons name="add" size={16} color="#fff" />
                    <Text style={styles.emptyBtnText}>Nova Solicitação</Text>
                  </TouchableOpacity>
                </View>
              }
              renderItem={({ item }) => <SolicitacaoCard item={item} />}
            />
          )}
        </>
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={closeForm} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color={Colors.blue.dark} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Nova Solicitação</Text>
              <Text style={styles.headerSub}>Relate um risco na sua região</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>TIPO DO PROBLEMA *</Text>
            <View style={styles.tipoGrid}>
              {Object.entries(TIPO_CFG).map(([key, cfg]) => {
                const active = tipo === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.tipoCard, active && { borderColor: cfg.color, backgroundColor: `${cfg.color}12` }]}
                    onPress={() => setTipo(key)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name={cfg.icon as never} size={22} color={active ? cfg.color : '#94A3B8'} />
                    <Text style={[styles.tipoLabel, active && { color: cfg.color, fontWeight: '700' }]}>{cfg.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>ENDEREÇO *</Text>
            <TextInput style={styles.input} placeholder="Ex: Rua das Flores, 123" placeholderTextColor="#94A3B8" value={endereco} onChangeText={setEndereco} returnKeyType="next" />

            <Text style={styles.fieldLabel}>DESCRIÇÃO DO PROBLEMA *</Text>
            <TextInput style={[styles.input, styles.inputMulti]} placeholder="Descreva o que observou…" placeholderTextColor="#94A3B8" value={descricao} onChangeText={setDescricao} multiline numberOfLines={5} textAlignVertical="top" />

            <Text style={styles.fieldLabel}>FOTOS * <Text style={styles.fieldHint}>(ao menos 1)</Text></Text>
            <TouchableOpacity style={styles.fotoAddBtn} onPress={pickFotos} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={18} color={Colors.blue.medium} />
              <Text style={styles.fotoAddText}>{fotos.length === 0 ? 'Adicionar fotos' : `${fotos.length} foto(s) — adicionar mais`}</Text>
            </TouchableOpacity>

            {fotos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fotosRow}>
                {fotos.map((f, i) => (
                  <View key={i} style={styles.fotoThumb}>
                    <Image source={{ uri: f.uri }} style={styles.fotoImg} contentFit="cover" />
                    <TouchableOpacity style={styles.fotoRemove} onPress={() => setFotos((prev) => prev.filter((_, idx) => idx !== i))}>
                      <Ionicons name="close-circle" size={22} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitDisabled]} onPress={handleSubmit} activeOpacity={0.82} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <Ionicons name="send-outline" size={18} color="#fff" />
                  <Text style={styles.submitText}>Enviar Solicitação</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

function SolicitacaoCard({ item }: { item: SolicitacaoServicoDTO }) {
  const tipoCfg   = TIPO_CFG[item.tipo]     ?? { label: item.tipo,   icon: 'help-circle-outline', color: '#64748B' };
  const statusCfg = STATUS_CFG[item.status] ?? { label: item.status, color: '#64748B' };
  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: tipoCfg.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Ionicons name={tipoCfg.icon as never} size={15} color={tipoCfg.color} />
          <Text style={styles.cardTitle} numberOfLines={1}>{tipoCfg.label}</Text>
          <View style={[styles.statusPill, { backgroundColor: `${statusCfg.color}18` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>
        <View style={styles.cardLocRow}>
          <Ionicons name="location-outline" size={12} color="#94A3B8" />
          <Text style={styles.cardLocText} numberOfLines={1}>{item.enderecoTxt}</Text>
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.descricaoMotivo}</Text>
        <Text style={styles.cardDate}>{relativeDate(item.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: Colors.neutral.gray },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.blue.dark },
  headerSub:   { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  backBtn:     { padding: 4 },
  newBtn:      { marginLeft: 'auto', width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.blue.dark, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: Colors.blue.dark, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 },
  chipBar:     { paddingVertical: 10 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  centerFlex:  { flex: 1 },
  center:      { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyTitle:  { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 4 },
  emptyDesc:   { fontSize: 13, color: '#94A3B8', textAlign: 'center', maxWidth: 260, lineHeight: 19 },
  emptyBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.blue.dark, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 11, marginTop: 8 },
  emptyBtnText:{ color: '#fff', fontSize: 14, fontWeight: '700' },
  card:        { backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, flexDirection: 'row', overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  cardAccent:  { width: 4 },
  cardBody:    { flex: 1, padding: 12, gap: 5 },
  cardTopRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle:   { flex: 1, fontSize: 14, fontWeight: '700', color: '#1E293B' },
  statusPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusText:  { fontSize: 11, fontWeight: '600' },
  cardLocRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardLocText: { flex: 1, fontSize: 11, color: '#94A3B8' },
  cardDesc:    { fontSize: 12, color: '#64748B', lineHeight: 17 },
  cardDate:    { fontSize: 11, color: '#CBD5E1' },
  formScroll:  { paddingHorizontal: 16, paddingBottom: 100, gap: 4 },
  fieldLabel:  { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, marginTop: 16, marginBottom: 8 },
  fieldHint:   { fontWeight: '400', textTransform: 'none', fontSize: 11 },
  tipoGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tipoCard:    { flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff' },
  tipoLabel:   { flex: 1, fontSize: 12, fontWeight: '500', color: '#94A3B8', lineHeight: 17 },
  input:       { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: '#1E293B' },
  inputMulti:  { minHeight: 110, paddingTop: 13 },
  fotoAddBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: Colors.blue.medium, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 14, justifyContent: 'center', backgroundColor: '#fff' },
  fotoAddText: { fontSize: 14, fontWeight: '600', color: Colors.blue.medium },
  fotosRow:    { gap: 8, paddingTop: 10, paddingBottom: 4 },
  fotoThumb:   { width: 90, height: 90, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  fotoImg:     { width: '100%', height: '100%' },
  fotoRemove:  { position: 'absolute', top: 2, right: 2, backgroundColor: '#fff', borderRadius: 11 },
  submitBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.blue.dark, borderRadius: 14, paddingVertical: 15, marginTop: 24, elevation: 3, shadowColor: Colors.blue.dark, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 },
  submitDisabled: { opacity: 0.6 },
  submitText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
});
