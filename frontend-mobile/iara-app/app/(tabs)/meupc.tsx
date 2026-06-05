import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

// ── Tipos ─────────────────────────────────────────────────────

interface PcDTO {
  id: string;
  coordenadorId: string;
  pcNome: string;
  pcTipo?: string;
  pcContato?: string;
  pcDesc?: string;
  pcIsVerified: boolean;
  isActive: boolean;
  coordenadas: { lat: number; lng: number };
}

interface EstoqueItem {
  id: string;
  idTipo: string;
  tipoNome: string;
  quantidade: number;
}

interface DemandaDTO {
  id: string;
  idTipo: string;
  tipoNome: string;
  prioridade: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA';
  qtdSolicitada: number;
  qtdAtendida: number;
  descricao?: string;
  isActive: boolean;
}

interface TipoDTO {
  id: string;
  nome: string;
}

interface EventoSimples {
  id: string;
  titulo: string;
}

interface PcEventoDTO {
  id: string;
  pcId: string;
  eventoId: string;
  status: string;
}

interface EventoDTO {
  id: string;
  titulo: string;
  status: string;
}

// ── Constantes ────────────────────────────────────────────────

const PRIORIDADE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  CRITICA: { label: 'Urgente',    color: '#DC2626', bg: '#FEE2E2' },
  ALTA:    { label: 'Necessário', color: '#C2410C', bg: '#FFEDD5' },
  MEDIA:   { label: 'Médio',      color: '#A16207', bg: '#FEF9C3' },
  BAIXA:   { label: 'Suficiente', color: '#166534', bg: '#DCFCE7' },
};

const PRIORIDADES = ['CRITICA', 'ALTA', 'MEDIA', 'BAIXA'] as const;
type Prioridade = typeof PRIORIDADES[number];

// ── Tela Principal ────────────────────────────────────────────

export default function MeuPcScreen() {
  const { accessToken } = useAuth();
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${accessToken}` }),
    [accessToken],
  );

  const [pc, setPc]                 = useState<PcDTO | null>(null);
  const [estoque, setEstoque]       = useState<EstoqueItem[]>([]);
  const [demandas, setDemandas]     = useState<DemandaDTO[]>([]);
  const [tipos, setTipos]           = useState<TipoDTO[]>([]);
  const [eventosAceitos, setEventosAceitos] = useState<EventoSimples[]>([]);
  const [noPc, setNoPc]             = useState(false);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [addEstoqueOpen, setAddEstoqueOpen]       = useState(false);
  const [createDemandaOpen, setCreateDemandaOpen] = useState(false);
  const [toggling, setToggling]                   = useState(false);

  // Debounce por tipoId para atualização de estoque
  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const loadAll = useCallback(async () => {
    if (!accessToken) return;
    try {
      // 1. ID do usuário logado
      const meRes = await api.get('/usuarios/me', { headers });
      const userId = meRes.data.id as string;

      // 2. Encontrar o PC do qual é coordenador
      const pcsRes = await api.get<PcDTO[]>('/pontos-coleta', { headers });
      const myPc = pcsRes.data.find((p) => p.coordenadorId === userId) ?? null;
      if (!myPc) { setNoPc(true); return; }
      setPc(myPc);

      // 3. Dados paralelos
      const [estoqueRes, demandasRes, pcEventosRes, tiposRes, eventosRes] = await Promise.all([
        api.get(`/pontos-coleta/${myPc.id}/estoque`, { headers }),
        api.get(`/pontos-coleta/${myPc.id}/demandas?is_active=true`, { headers }),
        api.get(`/pontos-coleta/${myPc.id}/eventos`, { headers }),
        api.get('/lookup/demanda-tipos'),
        api.get('/eventos', { headers }),
      ]);

      setEstoque(estoqueRes.data);
      setDemandas(demandasRes.data);
      setTipos(tiposRes.data);

      // Apenas eventos que o PC aceitou
      const acceptedIds = new Set<string>(
        (pcEventosRes.data as PcEventoDTO[])
          .filter((pe) => pe.status === 'ACEITO')
          .map((pe) => pe.eventoId),
      );
      setEventosAceitos(
        (eventosRes.data as EventoDTO[])
          .filter((e) => acceptedIds.has(e.id))
          .map((e) => ({ id: e.id, titulo: e.titulo })),
      );
    } catch {
      // silencioso — estado vazio exibido
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, headers]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Limpa debounces ao desmontar
  useEffect(() => {
    return () => { Object.values(debounceRefs.current).forEach(clearTimeout); };
  }, []);

  // ── Toggle isActive ────────────────────────────────────────

  async function handleToggleActive() {
    if (!pc || toggling) return;
    const newActive = !pc.isActive;
    setToggling(true);
    setPc((prev) => prev ? { ...prev, isActive: newActive } : null);
    try {
      const endpoint = newActive ? 'ativar' : 'desativar';
      await api.patch(`/pontos-coleta/${pc.id}/${endpoint}`, null, { headers });
    } catch {
      // Reverte em caso de erro
      setPc((prev) => prev ? { ...prev, isActive: !newActive } : null);
      Alert.alert('Erro', 'Não foi possível alterar o status do ponto de coleta.');
    } finally {
      setToggling(false);
    }
  }

  // ── Ações de estoque ───────────────────────────────────────

  function adjustStock(item: EstoqueItem, delta: number) {
    const newQtd = Math.max(0, item.quantidade + delta);
    setEstoque((prev) =>
      prev.map((e) => (e.idTipo === item.idTipo ? { ...e, quantidade: newQtd } : e)),
    );
    clearTimeout(debounceRefs.current[item.idTipo]);
    debounceRefs.current[item.idTipo] = setTimeout(() => {
      api.patch(
        `/pontos-coleta/${pc!.id}/estoque/${item.idTipo}?quantidade=${newQtd}`,
        null,
        { headers },
      ).catch(() => {});
    }, 700);
  }

  async function handleAddEstoque(tipoId: string, quantidade: number) {
    await api.patch(
      `/pontos-coleta/${pc!.id}/estoque/${tipoId}?quantidade=${quantidade}`,
      null,
      { headers },
    );
    const res = await api.get(`/pontos-coleta/${pc!.id}/estoque`, { headers });
    setEstoque(res.data);
    setAddEstoqueOpen(false);
  }

  // ── Ações de demanda ───────────────────────────────────────

  async function handleCreateDemanda(
    tipoId: string, eventoId: string, prioridade: string,
    quantidade: number, descricao: string,
  ) {
    await api.post(
      `/pontos-coleta/${pc!.id}/demandas`,
      {
        idEvento: eventoId, idTipo: tipoId, prioridade,
        qtdSolicitada: quantidade,
        descricao: descricao.trim() || undefined,
      },
      { headers },
    );
    const res = await api.get(`/pontos-coleta/${pc!.id}/demandas?is_active=true`, { headers });
    setDemandas(res.data);
    setCreateDemandaOpen(false);
  }

  async function handleDesativarDemanda(demandaId: string) {
    try {
      await api.patch(
        `/pontos-coleta/${pc!.id}/demandas/${demandaId}/desativar`,
        null, { headers },
      );
      setDemandas((prev) => prev.filter((d) => d.id !== demandaId));
    } catch {
      Alert.alert('Erro', 'Não foi possível encerrar a demanda.');
    }
  }

  // ── Estados de carregamento / sem PC ──────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.blue.dark} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (noPc) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" backgroundColor={Colors.neutral.gray} />
        <View style={styles.center}>
          <Ionicons name="storefront-outline" size={56} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Sem ponto de coleta</Text>
          <Text style={styles.emptyText}>
            Aguarde um gestor atribuir um ponto de coleta à sua conta.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const tiposNoEstoque    = new Set(estoque.map((e) => e.idTipo));
  const tiposDisponiveis  = tipos.filter((t) => !tiposNoEstoque.has(t.id));
  const semEventosAceitos = eventosAceitos.length === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={Colors.neutral.gray} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadAll(); }}
            colors={[Colors.blue.dark]}
          />
        }
      >

        {/* ── Nome + chips de status ─────────────────────── */}
        <Text style={styles.pcNome} numberOfLines={2}>{pc!.pcNome}</Text>

        <View style={styles.pcChipRow}>
          {/* Chip de status com switch embutido */}
          {pc!.isActive ? (
            <View style={styles.chipAtivo}>
              <Switch
                value
                onValueChange={handleToggleActive}
                disabled={toggling}
                trackColor={{ false: '#CBD5E1', true: '#BBF7D0' }}
                thumbColor="#22C55E"
                style={styles.chipSwitch}
              />
              <Text style={styles.chipAtivoText}>Ativo</Text>
            </View>
          ) : (
            <View style={styles.chipDesativado}>
              <Switch
                value={false}
                onValueChange={handleToggleActive}
                disabled={toggling}
                trackColor={{ false: '#FECACA', true: '#BBF7D0' }}
                thumbColor="#EF4444"
                style={styles.chipSwitch}
              />
              <Text style={styles.chipDesativadoText}>Desativado</Text>
            </View>
          )}

          {/* Evento vinculado — clicável, só aparece quando ativo */}
          {pc!.isActive && eventosAceitos.length > 0 && (
            <TouchableOpacity
              style={styles.chipEvento}
              onPress={() =>
                router.push({
                  pathname: '/evento-detalhe',
                  params: { id: eventosAceitos[0].id },
                } as never)
              }
              activeOpacity={0.75}
            >
              <Ionicons name="flash" size={11} color={Colors.blue.medium} />
              <Text style={styles.chipEventoText} numberOfLines={1}>
                {eventosAceitos[0].titulo}
              </Text>
              <Ionicons name="chevron-forward" size={11} color={Colors.blue.medium} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Detalhes do PC ─────────────────────────────── */}
        <View style={styles.pcCard}>
          {pc!.pcIsVerified && (
            <View style={[styles.pcRow, { marginBottom: 2 }]}>
              <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
              <Text style={[styles.pcRowText, { color: '#22C55E', fontWeight: '600' }]}>
                Verificado
              </Text>
            </View>
          )}

          {pc!.pcTipo ? (
            <View style={styles.pcRow}>
              <Ionicons name="business-outline" size={13} color="#64748B" />
              <Text style={styles.pcRowText}>{pc!.pcTipo}</Text>
            </View>
          ) : null}

          {pc!.pcContato ? (
            <View style={styles.pcRow}>
              <Ionicons name="call-outline" size={13} color="#64748B" />
              <Text style={styles.pcRowText}>{pc!.pcContato}</Text>
            </View>
          ) : null}

          {pc!.pcDesc ? (
            <Text style={styles.pcDesc} numberOfLines={3}>{pc!.pcDesc}</Text>
          ) : null}

          <View style={styles.pcRow}>
            <Ionicons name="location-outline" size={13} color="#64748B" />
            <Text style={styles.pcRowText}>
              {pc!.coordenadas.lat.toFixed(5)}, {pc!.coordenadas.lng.toFixed(5)}
            </Text>
          </View>
        </View>

        {/* ── Conteúdo bloqueado quando inativo ─────────── */}
        <View
          style={!pc!.isActive && styles.sectionsDisabled}
          pointerEvents={pc!.isActive ? 'auto' : 'none'}
        >

        {/* ── Seção Estoque ──────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Ionicons name="cube-outline" size={17} color={Colors.blue.dark} />
          <Text style={styles.sectionTitle}>Estoque</Text>
          <Text style={styles.sectionCount}>{estoque.length} tipos</Text>
          <TouchableOpacity
            style={[styles.sectionBtn, tiposDisponiveis.length === 0 && { opacity: 0.4 }]}
            onPress={() => setAddEstoqueOpen(true)}
            disabled={tiposDisponiveis.length === 0}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={14} color="#fff" />
            <Text style={styles.sectionBtnText}>Adicionar</Text>
          </TouchableOpacity>
        </View>

        {estoque.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>Nenhum item cadastrado no estoque.</Text>
          </View>
        ) : (
          estoque.map((item) => (
            <View key={item.idTipo} style={styles.estoqueCard}>
              <Text style={styles.estoqueNome} numberOfLines={1}>{item.tipoNome}</Text>
              <View style={styles.estoqueControls}>
                <TouchableOpacity
                  style={[styles.qtdBtn, item.quantidade === 0 && styles.qtdBtnDisabled]}
                  onPress={() => adjustStock(item, -1)}
                  disabled={item.quantidade === 0}
                  hitSlop={10}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={item.quantidade === 0 ? '#CBD5E1' : Colors.blue.dark}
                  />
                </TouchableOpacity>
                <Text style={styles.qtdText}>{item.quantidade}</Text>
                <TouchableOpacity
                  style={styles.qtdBtn}
                  onPress={() => adjustStock(item, 1)}
                  hitSlop={10}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={18} color={Colors.blue.dark} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* ── Seção Demandas ─────────────────────────────── */}
        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <Ionicons name="list-outline" size={17} color={Colors.brand.orange} />
          <Text style={[styles.sectionTitle, { color: Colors.brand.orange }]}>Demandas ativas</Text>
          <Text style={styles.sectionCount}>{demandas.length}</Text>
          <TouchableOpacity
            style={[
              styles.sectionBtn,
              { backgroundColor: Colors.brand.orange },
              semEventosAceitos && { opacity: 0.4 },
            ]}
            onPress={() => setCreateDemandaOpen(true)}
            disabled={semEventosAceitos}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={14} color="#fff" />
            <Text style={styles.sectionBtnText}>Nova</Text>
          </TouchableOpacity>
        </View>

        {semEventosAceitos && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={14} color="#64748B" />
            <Text style={styles.infoBoxText}>
              Aceite o vínculo com um evento para poder emitir demandas.
            </Text>
          </View>
        )}

        {demandas.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>Nenhuma demanda ativa.</Text>
          </View>
        ) : (
          demandas.map((d) => {
            const cfg = PRIORIDADE_CFG[d.prioridade] ?? PRIORIDADE_CFG.MEDIA;
            const pct = d.qtdSolicitada > 0
              ? Math.min((d.qtdAtendida / d.qtdSolicitada) * 100, 100)
              : 0;
            return (
              <View key={d.id} style={styles.demandaCard}>
                <View style={[styles.demandaAccent, { backgroundColor: cfg.color }]} />
                <View style={styles.demandaBody}>
                  <View style={styles.demandaTop}>
                    <View style={[styles.demandaBadge, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.demandaBadgeText, { color: cfg.color }]}>
                        {cfg.label}
                      </Text>
                    </View>
                    <Text style={styles.demandaQtd}>
                      {d.qtdAtendida}/{d.qtdSolicitada}
                    </Text>
                    <TouchableOpacity
                      onPress={() => Alert.alert(
                        'Encerrar demanda',
                        `Deseja encerrar a demanda de "${d.tipoNome}"?`,
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Encerrar', style: 'destructive', onPress: () => handleDesativarDemanda(d.id) },
                        ],
                      )}
                      hitSlop={8}
                    >
                      <Ionicons name="close-circle-outline" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.demandaNome}>{d.tipoNome}</Text>
                  {d.descricao ? (
                    <Text style={styles.demandaDesc} numberOfLines={2}>{d.descricao}</Text>
                  ) : null}

                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${pct}%` as any, backgroundColor: cfg.color },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 32 }} />
        </View>{/* fim wrapper bloqueável */}
      </ScrollView>

      {/* ── Modais ─────────────────────────────────────────── */}
      <AddEstoqueModal
        visible={addEstoqueOpen}
        tipos={tiposDisponiveis}
        onConfirm={handleAddEstoque}
        onClose={() => setAddEstoqueOpen(false)}
      />
      <CreateDemandaModal
        visible={createDemandaOpen}
        tipos={tipos}
        eventos={eventosAceitos}
        onConfirm={handleCreateDemanda}
        onClose={() => setCreateDemandaOpen(false)}
      />
    </SafeAreaView>
  );
}

// ── Modal: Adicionar ao Estoque ───────────────────────────────

interface AddEstoqueModalProps {
  visible: boolean;
  tipos: TipoDTO[];
  onConfirm: (tipoId: string, quantidade: number) => Promise<void>;
  onClose: () => void;
}

function AddEstoqueModal({ visible, tipos, onConfirm, onClose }: AddEstoqueModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [qtdStr, setQtdStr]     = useState('0');
  const [saving, setSaving]     = useState(false);

  function reset() { setSelected(null); setQtdStr('0'); }
  function close() { reset(); onClose(); }

  async function confirm() {
    if (!selected) return;
    const qtd = parseInt(qtdStr, 10);
    if (isNaN(qtd) || qtd < 0) { Alert.alert('Atenção', 'Quantidade inválida.'); return; }
    setSaving(true);
    try {
      await onConfirm(selected, qtd);
      reset();
    } catch {
      Alert.alert('Erro', 'Não foi possível adicionar o item.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Adicionar ao Estoque</Text>
            <TouchableOpacity onPress={close} hitSlop={8}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {tipos.length === 0 ? (
            <Text style={styles.emptySectionText}>
              Todos os tipos de item já estão no estoque.
            </Text>
          ) : (
            <>
              <Text style={styles.modalSubtitle}>Selecione o tipo de item</Text>
              <FlatList
                data={tipos}
                keyExtractor={(t) => t.id}
                style={{ maxHeight: 220 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.tipoItem, selected === item.id && styles.tipoItemSelected]}
                    onPress={() => setSelected(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.tipoNome,
                        selected === item.id && { color: Colors.blue.dark, fontWeight: '700' },
                      ]}
                    >
                      {item.nome}
                    </Text>
                    {selected === item.id && (
                      <Ionicons name="checkmark-circle" size={18} color={Colors.blue.dark} />
                    )}
                  </TouchableOpacity>
                )}
              />

              {selected && (
                <View style={styles.modalField}>
                  <Text style={styles.fieldLabel}>Quantidade inicial</Text>
                  <TextInput
                    style={styles.textInput}
                    value={qtdStr}
                    onChangeText={setQtdStr}
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                </View>
              )}
            </>
          )}

          <TouchableOpacity
            style={[styles.confirmBtn, (!selected || saving) && { opacity: 0.45 }]}
            onPress={confirm}
            disabled={!selected || saving}
            activeOpacity={0.8}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.confirmBtnText}>Adicionar</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Modal: Criar Demanda ──────────────────────────────────────

interface CreateDemandaModalProps {
  visible: boolean;
  tipos: TipoDTO[];
  eventos: EventoSimples[];
  onConfirm: (
    tipoId: string, eventoId: string, prioridade: string,
    quantidade: number, descricao: string,
  ) => Promise<void>;
  onClose: () => void;
}

type DemandaStep = 'tipo' | 'evento' | 'detalhes';

function CreateDemandaModal({
  visible, tipos, eventos, onConfirm, onClose,
}: CreateDemandaModalProps) {
  const [step, setStep]           = useState<DemandaStep>('tipo');
  const [tipoId, setTipoId]       = useState<string | null>(null);
  const [eventoId, setEventoId]   = useState<string | null>(null);
  const [prioridade, setPrioridade] = useState<Prioridade>('MEDIA');
  const [qtdStr, setQtdStr]       = useState('1');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving]       = useState(false);

  function reset() {
    setStep('tipo'); setTipoId(null); setEventoId(null);
    setPrioridade('MEDIA'); setQtdStr('1'); setDescricao('');
  }
  function close() { reset(); onClose(); }

  async function confirm() {
    if (!tipoId || !eventoId) return;
    const qtd = parseInt(qtdStr, 10);
    if (isNaN(qtd) || qtd < 1) { Alert.alert('Atenção', 'Quantidade deve ser ao menos 1.'); return; }
    setSaving(true);
    try {
      await onConfirm(tipoId, eventoId, prioridade, qtd, descricao);
      reset();
    } catch {
      Alert.alert('Erro', 'Não foi possível criar a demanda.');
    } finally {
      setSaving(false);
    }
  }

  const tipoNome   = tipos.find((t) => t.id === tipoId)?.nome ?? '';
  const eventoTit  = eventos.find((e) => e.id === eventoId)?.titulo ?? '';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalSheet}>
          {/* Cabeçalho */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nova Demanda</Text>
            <TouchableOpacity onPress={close} hitSlop={8}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Passo 1 — Tipo */}
          {step === 'tipo' && (
            <>
              <Text style={styles.modalSubtitle}>Qual item está em falta?</Text>
              <FlatList
                data={tipos}
                keyExtractor={(t) => t.id}
                style={{ maxHeight: 260 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.tipoItem, tipoId === item.id && styles.tipoItemSelected]}
                    onPress={() => { setTipoId(item.id); setStep('evento'); }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.tipoNome,
                        tipoId === item.id && { color: Colors.blue.dark, fontWeight: '700' },
                      ]}
                    >
                      {item.nome}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                )}
              />
            </>
          )}

          {/* Passo 2 — Evento */}
          {step === 'evento' && (
            <>
              <Text style={styles.modalSubtitle}>Vincular ao evento</Text>
              <FlatList
                data={eventos}
                keyExtractor={(e) => e.id}
                style={{ maxHeight: 220 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.tipoItem, eventoId === item.id && styles.tipoItemSelected]}
                    onPress={() => { setEventoId(item.id); setStep('detalhes'); }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.tipoNome,
                        eventoId === item.id && { color: Colors.blue.dark, fontWeight: '700' },
                      ]}
                      numberOfLines={2}
                    >
                      {item.titulo}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity onPress={() => setStep('tipo')} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={13} color="#64748B" />
                <Text style={styles.backBtnText}>Voltar</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Passo 3 — Detalhes */}
          {step === 'detalhes' && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Chips editáveis com o que foi selecionado */}
              <View style={styles.chipRow}>
                <TouchableOpacity style={styles.summaryChip} onPress={() => setStep('tipo')}>
                  <Text style={styles.summaryChipText} numberOfLines={1}>{tipoNome}</Text>
                  <Ionicons name="pencil" size={11} color={Colors.blue.dark} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.summaryChip} onPress={() => setStep('evento')}>
                  <Text style={styles.summaryChipText} numberOfLines={1}>{eventoTit}</Text>
                  <Ionicons name="pencil" size={11} color={Colors.blue.dark} />
                </TouchableOpacity>
              </View>

              {/* Prioridade */}
              <Text style={styles.fieldLabel}>Prioridade</Text>
              <View style={styles.prioridadeRow}>
                {PRIORIDADES.map((p) => {
                  const cfg = PRIORIDADE_CFG[p];
                  const sel = prioridade === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[styles.prioBtn, sel && { backgroundColor: cfg.color }]}
                      onPress={() => setPrioridade(p)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.prioBtnText, sel && { color: '#fff' }]}>
                        {cfg.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Quantidade */}
              <Text style={styles.fieldLabel}>Quantidade solicitada</Text>
              <TextInput
                style={styles.textInput}
                value={qtdStr}
                onChangeText={setQtdStr}
                keyboardType="numeric"
                selectTextOnFocus
              />

              {/* Descrição */}
              <Text style={styles.fieldLabel}>Descrição (opcional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={descricao}
                onChangeText={setDescricao}
                multiline
                placeholder="Ex: Garrafas de 500 ml, de preferência"
                placeholderTextColor="#94A3B8"
              />

              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  { backgroundColor: Colors.brand.orange },
                  saving && { opacity: 0.5 },
                ]}
                onPress={confirm}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.confirmBtnText}>Emitir Demanda</Text>}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Estilos ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: Colors.neutral.gray },
  scroll:    { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle:{ fontSize: 16, fontWeight: '700', color: '#475569', textAlign: 'center' },
  emptyText: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },

  // ── PC nome + chips ──────────────────────────────────────
  pcNome: {
    fontSize: 22, fontWeight: '800', color: Colors.blue.dark, marginBottom: 8,
  },
  pcChipRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 14, flexWrap: 'wrap',
  },
  sectionsDisabled: { opacity: 0.38 },
  chipAtivo: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
    gap: 2, backgroundColor: '#DCFCE7', borderRadius: 16, borderWidth: 1, borderColor: '#BBF7D0',
    paddingLeft: 2, paddingRight: 10, height: 30, overflow: 'hidden',
  },
  chipAtivoText: { fontSize: 12, fontWeight: '700', color: '#166534', textAlign: 'left' },
  chipDesativado: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
    gap: 2, backgroundColor: '#FEE2E2', borderRadius: 16, borderWidth: 1, borderColor: '#FECACA',
    paddingLeft: 2, paddingRight: 10, height: 30, overflow: 'hidden',
  },
  chipDesativadoText: { fontSize: 12, fontWeight: '700', color: '#DC2626', textAlign: 'left' },
  chipSwitch: { transform: [{ scale: 0.7 }], marginHorizontal: -8 },
  chipEvento: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#EFF6FF', borderRadius: 20, borderWidth: 1, borderColor: Colors.blue.light,
    paddingHorizontal: 10, paddingVertical: 5, maxWidth: 200,
  },
  chipEventoText: { fontSize: 12, fontWeight: '600', color: Colors.blue.medium, flex: 1 },

  // ── PC card (detalhes) ───────────────────────────────────
  pcCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 20, gap: 8,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  pcRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pcRowText:{ fontSize: 12, color: '#475569', flex: 1 },
  pcDesc:   { fontSize: 12, color: '#64748B', lineHeight: 17 },

  // ── Cabeçalho de seção ───────────────────────────────────
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10,
  },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: Colors.blue.dark },
  sectionCount: {
    fontSize: 11, fontWeight: '700', color: '#94A3B8',
    backgroundColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  sectionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.blue.dark, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  sectionBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // ── Estoque ──────────────────────────────────────────────
  estoqueCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  estoqueNome: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1E293B' },
  estoqueControls: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  qtdBtn: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  qtdBtnDisabled: { backgroundColor: '#F8FAFC' },
  qtdText: {
    width: 40, textAlign: 'center',
    fontSize: 16, fontWeight: '800', color: '#1E293B',
  },

  // ── Demandas ─────────────────────────────────────────────
  demandaCard: {
    backgroundColor: '#fff', borderRadius: 12, marginBottom: 8,
    flexDirection: 'row', overflow: 'hidden',
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  demandaAccent: { width: 4 },
  demandaBody:   { flex: 1, padding: 12, gap: 6 },
  demandaTop: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  demandaBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  demandaBadgeText: { fontSize: 11, fontWeight: '700' },
  demandaQtd:  { flex: 1, fontSize: 12, color: '#64748B', fontWeight: '600' },
  demandaNome: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  demandaDesc: { fontSize: 12, color: '#64748B', lineHeight: 17 },
  progressBar: {
    height: 5, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },

  // ── Info box (sem eventos) ───────────────────────────────
  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#F8FAFC', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9, marginBottom: 10,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  infoBoxText: { flex: 1, fontSize: 12, color: '#64748B', lineHeight: 17 },

  // ── Seções vazias ────────────────────────────────────────
  emptySection: { alignItems: 'center', paddingVertical: 20 },
  emptySectionText: { fontSize: 13, color: '#94A3B8' },

  // ── Modais ───────────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 32,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle:    { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  modalSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 10 },
  modalField:    { marginTop: 14 },

  tipoItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 11, paddingHorizontal: 12,
    borderRadius: 10, marginBottom: 4, backgroundColor: '#F8FAFC',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  tipoItemSelected: {
    backgroundColor: '#EFF6FF', borderColor: Colors.blue.dark,
  },
  tipoNome: { fontSize: 14, color: '#334155', flex: 1, marginRight: 8 },

  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6 },
  textInput: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: '#1E293B', backgroundColor: '#F8FAFC',
    marginBottom: 14,
  },
  textArea: { height: 72, textAlignVertical: 'top' },

  // Prioridade
  prioridadeRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  prioBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: 8, backgroundColor: '#F1F5F9',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  prioBtnText: { fontSize: 11, fontWeight: '700', color: '#64748B' },

  // Confirm
  confirmBtn: {
    backgroundColor: Colors.blue.dark, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Chips de resumo (passo detalhes)
  chipRow:      { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  summaryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#EFF6FF', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.blue.light,
    maxWidth: 160,
  },
  summaryChipText: { fontSize: 12, fontWeight: '600', color: Colors.blue.dark, flex: 1 },

  // Voltar
  backBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  backBtnText: { fontSize: 12, color: '#64748B' },
});
