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
  statusVerificacao?: string;
  motivoRejeicao?: string;
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
  pcId: string;
  eventoId: string;
  idTipo: string;
  tipoNome: string;
  prioridade: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA';
  qtdSolicitada: number;
  qtdAtendida: number;
  qtdRecebida: number;
  qtdIntencionada: number;
  qtdMaximaCapacidade?: number;
  descricao?: string;
  isActive: boolean;
  status?: string;
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
  dataNotificacao?: string;
  dataResposta?: string;
}

interface MotivoRecusaDTO {
  id: string;
  codigo: string;
  label: string;
  descricaoObrigatoria: boolean;
}

interface DoacaoDTO {
  id: string;
  usuarioId: string;
  pcId: string;
  demandaId: string;
  idTipo: string;
  quantidade: number;
  descricao?: string;
  status: string;
  pdrReferencia?: string;
  dataPrevista?: string;
  dataConfirmacao?: string;
  qtdRecebida: number;
  dataExpiracao?: string;
}

interface EventoDTO {
  id: string;
  titulo: string;
  status: string;
}

interface PendingEvento {
  pcEventoId: string;
  eventoId: string;
  titulo: string;
  dataNotificacao?: string;
}

interface WorkerDisponibilidadeDTO {
  id: string;
  pcEventoId: string;
  eventoId: string;
  usuarioId: string;
  usuarioNome: string;
  status: 'PENDENTE' | 'CONFIRMADA' | 'RECUSADA' | 'EXPIRADA';
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

  const [pc, setPc]                       = useState<PcDTO | null>(null);
  const [estoque, setEstoque]             = useState<EstoqueItem[]>([]);
  const [demandas, setDemandas]           = useState<DemandaDTO[]>([]);
  const [tipos, setTipos]                 = useState<TipoDTO[]>([]);
  const [eventosAceitos, setEventosAceitos] = useState<EventoSimples[]>([]);
  const [pendingEventos, setPendingEventos] = useState<PendingEvento[]>([]);
  const [doacoes, setDoacoes]             = useState<DoacaoDTO[]>([]);
  const [motivosRecusa, setMotivosRecusa] = useState<MotivoRecusaDTO[]>([]);
  const [workforce, setWorkforce]         = useState<WorkerDisponibilidadeDTO[]>([]);
  const [noPc, setNoPc]                   = useState(false);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);

  const [addEstoqueOpen, setAddEstoqueOpen]       = useState(false);
  const [createDemandaOpen, setCreateDemandaOpen] = useState(false);
  const [recusarOpen, setRecusarOpen]             = useState(false);
  const [recusandoEvento, setRecusandoEvento]     = useState<PendingEvento | null>(null);
  const [recebendoDoacao, setRecebendoDoacao]     = useState<DoacaoDTO | null>(null);
  const [toggling, setToggling]                   = useState(false);

  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const loadAll = useCallback(async () => {
    if (!accessToken) return;
    try {
      const meRes = await api.get('/usuarios/me', { headers });
      const userId = meRes.data.id as string;

      const pcsRes = await api.get<PcDTO[]>('/pontos-coleta', { headers });
      const myPc = pcsRes.data.find((p) => p.coordenadorId === userId) ?? null;
      if (!myPc) { setNoPc(true); return; }
      setPc(myPc);

      const [estoqueRes, demandasRes, pcEventosRes, tiposRes, eventosRes, motivosRes, doacoesRes] =
        await Promise.all([
          api.get(`/pontos-coleta/${myPc.id}/estoque`, { headers }).catch(() => ({ data: [] })),
          api.get(`/pontos-coleta/${myPc.id}/demandas?is_active=true`, { headers }).catch(() => ({ data: [] })),
          api.get(`/pontos-coleta/${myPc.id}/eventos`, { headers }).catch(() => ({ data: [] })),
          api.get('/lookup/demanda-tipos', { headers }).catch(() => ({ data: [] })),
          api.get('/eventos', { headers }).catch(() => ({ data: [] })),
          api.get('/pontos-coleta/motivos-recusa', { headers }).catch(() => ({ data: [] })),
          api.get(`/pontos-coleta/${myPc.id}/doacoes`, { headers }).catch(() => ({ data: [] })),
        ]);

      setEstoque(estoqueRes.data);
      setDemandas(demandasRes.data);
      setTipos(tiposRes.data);
      setMotivosRecusa(motivosRes.data);
      setDoacoes(doacoesRes.data);

      const allEventos = eventosRes.data as EventoDTO[];
      const pcEventos  = pcEventosRes.data as PcEventoDTO[];

      const acceptedIds = new Set<string>(
        pcEventos.filter((pe) => pe.status === 'ACEITO').map((pe) => pe.eventoId),
      );
      setEventosAceitos(
        allEventos.filter((e) => acceptedIds.has(e.id)).map((e) => ({ id: e.id, titulo: e.titulo })),
      );

      const pending: PendingEvento[] = pcEventos
        .filter((pe) => pe.status === 'NOTIFICADO')
        .map((pe) => {
          const ev = allEventos.find((e) => e.id === pe.eventoId);
          return {
            pcEventoId: pe.id,
            eventoId: pe.eventoId,
            titulo: ev?.titulo ?? pe.eventoId,
            dataNotificacao: pe.dataNotificacao,
          };
        });
      setPendingEventos(pending);
    } catch {
      // silencioso — estado vazio exibido
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, headers]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    return () => { Object.values(debounceRefs.current).forEach(clearTimeout); };
  }, []);

  // Carrega equipe (workforce) do primeiro evento aceito
  useEffect(() => {
    if (!eventosAceitos[0] || !pc || !accessToken) return;
    api.get(
      `/pontos-coleta/${pc.id}/eventos/${eventosAceitos[0].id}/workforce`,
      { headers },
    ).then((res) => setWorkforce(res.data as WorkerDisponibilidadeDTO[])).catch(() => {});
  }, [eventosAceitos, pc, accessToken, headers]);

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
      api.post(
        `/pontos-coleta/${pc!.id}/estoque/ajustar`,
        { idTipo: item.idTipo, delta },
        { headers },
      ).catch(() => {});
    }, 700);
  }

  async function handleAddEstoque(tipoId: string, quantidade: number) {
    await api.post(
      `/pontos-coleta/${pc!.id}/estoque/ajustar`,
      { idTipo: tipoId, delta: quantidade },
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
      { idEvento: eventoId, idTipo: tipoId, prioridade, qtdSolicitada: quantidade,
        descricao: descricao.trim() || undefined },
      { headers },
    );
    const res = await api.get(`/pontos-coleta/${pc!.id}/demandas?is_active=true`, { headers });
    setDemandas(res.data);
    setCreateDemandaOpen(false);
  }

  async function handleFecharDemanda(demandaId: string) {
    try {
      await api.patch(`/pontos-coleta/${pc!.id}/demandas/${demandaId}/fechar`, null, { headers });
      setDemandas((prev) => prev.filter((d) => d.id !== demandaId));
    } catch {
      Alert.alert('Erro', 'Não foi possível encerrar a demanda.');
    }
  }

  // ── Ações de evento (aceitar / recusar) ────────────────────

  async function handleAceitarEvento(ev: PendingEvento) {
    try {
      await api.patch(`/pontos-coleta/${pc!.id}/eventos/${ev.eventoId}/aceitar`, null, { headers });
      setPendingEventos((prev) => prev.filter((p) => p.eventoId !== ev.eventoId));
      setEventosAceitos((prev) => [...prev, { id: ev.eventoId, titulo: ev.titulo }]);
    } catch {
      Alert.alert('Erro', 'Não foi possível aceitar o evento.');
    }
  }

  async function handleRecusarEvento(ev: PendingEvento, motivoId: string, descricao?: string) {
    try {
      await api.patch(
        `/pontos-coleta/${pc!.id}/eventos/${ev.eventoId}/recusar`,
        { motivoRecusaId: motivoId, descricao: descricao?.trim() || undefined },
        { headers },
      );
      setPendingEventos((prev) => prev.filter((p) => p.eventoId !== ev.eventoId));
      setRecusarOpen(false);
      setRecusandoEvento(null);
    } catch {
      Alert.alert('Erro', 'Não foi possível recusar o evento.');
    }
  }

  // ── Ações de doação ────────────────────────────────────────

  async function handleReceberDoacao(doacaoId: string, qtd: number) {
    try {
      await api.patch(`/doacoes/${doacaoId}/receber`, { qtdRecebida: qtd }, { headers });
      setDoacoes((prev) => prev.filter((d) => d.id !== doacaoId));
      const estoqueRes = await api.get(`/pontos-coleta/${pc!.id}/estoque`, { headers });
      setEstoque(estoqueRes.data);
      setRecebendoDoacao(null);
    } catch {
      Alert.alert('Erro', 'Não foi possível registrar o recebimento.');
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

  const tiposNoEstoque   = new Set(estoque.map((e) => e.idTipo));
  const tiposDisponiveis = tipos.filter((t) => !tiposNoEstoque.has(t.id));
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

          {pc!.isActive && eventosAceitos.length > 0 && (
            <TouchableOpacity
              style={styles.chipEvento}
              onPress={() =>
                router.push({ pathname: '/evento-detalhe', params: { id: eventosAceitos[0].id } } as never)
              }
              activeOpacity={0.75}
            >
              <Text style={styles.chipEventoText} numberOfLines={1}>
                {eventosAceitos[0].titulo}
              </Text>
              {workforce.length > 0 && (
                <View style={styles.workforceBadge}>
                  <Ionicons name="people" size={9} color="#fff" />
                  <Text style={styles.workforceBadgeText}>
                    {workforce.filter((w) => w.status === 'CONFIRMADA').length}/{workforce.length}
                  </Text>
                </View>
              )}
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
          {pc!.statusVerificacao === 'REJEITADO' && pc!.motivoRejeicao && (
            <View style={styles.rejeitadoBadge}>
              <Ionicons name="warning-outline" size={13} color="#DC2626" />
              <Text style={styles.rejeitadoText} numberOfLines={2}>{pc!.motivoRejeicao}</Text>
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

        {/* ── Eventos pendentes de resposta ──────────────── */}
        {pendingEventos.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="mail-unread-outline" size={17} color="#C2410C" />
              <Text style={[styles.sectionTitle, { color: '#C2410C' }]}>Convites de Evento</Text>
              <Text style={[styles.sectionCount, { backgroundColor: '#FFEDD5', color: '#C2410C' }]}>
                {pendingEventos.length}
              </Text>
            </View>

            {pendingEventos.map((ev) => (
              <View key={ev.eventoId} style={styles.eventoCard}>
                <View style={styles.eventoCardAccent} />
                <View style={styles.eventoCardBody}>
                  <Text style={styles.eventoCardTitulo} numberOfLines={2}>{ev.titulo}</Text>
                  {ev.dataNotificacao && (
                    <Text style={styles.eventoCardData}>
                      Convidado em {new Date(ev.dataNotificacao).toLocaleDateString('pt-BR')}
                    </Text>
                  )}
                  <View style={styles.eventoCardBtns}>
                    <TouchableOpacity
                      style={styles.eventoAceitarBtn}
                      onPress={() => handleAceitarEvento(ev)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="checkmark" size={14} color="#fff" />
                      <Text style={styles.eventoBtnText}>Aceitar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.eventoRecusarBtn}
                      onPress={() => { setRecusandoEvento(ev); setRecusarOpen(true); }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={14} color="#DC2626" />
                      <Text style={[styles.eventoBtnText, { color: '#DC2626' }]}>Recusar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── Conteúdo bloqueado quando inativo ─────────── */}
        <View
          style={!pc!.isActive ? styles.sectionsDisabled : undefined}
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

          {/* ── Doações pendentes ──────────────────────────── */}
          {doacoes.length > 0 && (
            <>
              <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                <Ionicons name="gift-outline" size={17} color="#7C3AED" />
                <Text style={[styles.sectionTitle, { color: '#7C3AED' }]}>Doações Pendentes</Text>
                <Text style={[styles.sectionCount, { backgroundColor: '#EDE9FE', color: '#7C3AED' }]}>
                  {doacoes.length}
                </Text>
              </View>

              {doacoes.map((doacao) => {
                const tipoNome = tipos.find((t) => t.id === doacao.idTipo)?.nome ?? doacao.idTipo;
                return (
                  <View key={doacao.id} style={styles.doacaoCard}>
                    <View style={styles.doacaoInfo}>
                      <Text style={styles.doacaoTipo} numberOfLines={1}>{tipoNome}</Text>
                      <Text style={styles.doacaoQtd}>Qtd: {doacao.quantidade}</Text>
                      {doacao.descricao ? (
                        <Text style={styles.doacaoDesc} numberOfLines={1}>{doacao.descricao}</Text>
                      ) : null}
                      {doacao.dataPrevista && (
                        <Text style={styles.doacaoData}>
                          Previsto: {new Date(doacao.dataPrevista).toLocaleDateString('pt-BR')}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.receberBtn}
                      onPress={() => setRecebendoDoacao(doacao)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.receberBtnText}>Receber</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </>
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
              const cfg   = PRIORIDADE_CFG[d.prioridade] ?? PRIORIDADE_CFG.MEDIA;
              const total = d.qtdMaximaCapacidade ?? d.qtdSolicitada;
              const pct   = total > 0 ? Math.min((d.qtdAtendida / total) * 100, 100) : 0;
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
                        {d.qtdMaximaCapacidade ? ` · cap. ${d.qtdMaximaCapacidade}` : ''}
                      </Text>
                      <TouchableOpacity
                        onPress={() => Alert.alert(
                          'Encerrar demanda',
                          `Deseja encerrar a demanda de "${d.tipoNome}"?`,
                          [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Encerrar', style: 'destructive',
                              onPress: () => handleFecharDemanda(d.id) },
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
                    {d.qtdIntencionada > 0 && (
                      <Text style={styles.demandaIntencionada}>
                        {d.qtdIntencionada} em trânsito
                      </Text>
                    )}

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
        </View>
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
      {recusandoEvento && (
        <RecusarEventoModal
          visible={recusarOpen}
          evento={recusandoEvento}
          motivos={motivosRecusa}
          onConfirm={handleRecusarEvento}
          onClose={() => { setRecusarOpen(false); setRecusandoEvento(null); }}
        />
      )}
      {recebendoDoacao && (
        <ReceberDoacaoModal
          visible
          doacao={recebendoDoacao}
          tipoNome={tipos.find((t) => t.id === recebendoDoacao.idTipo)?.nome ?? ''}
          onConfirm={handleReceberDoacao}
          onClose={() => setRecebendoDoacao(null)}
        />
      )}
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
  const [error, setError]       = useState<string | null>(null);

  function reset() { setSelected(null); setQtdStr('0'); setError(null); }
  function close() { reset(); onClose(); }

  async function confirm() {
    if (!selected) return;
    setError(null);
    const qtd = parseInt(qtdStr, 10);
    if (isNaN(qtd) || qtd < 0) {
      setError('Informe uma quantidade válida (mínimo 0).');
      return;
    }
    setSaving(true);
    try { await onConfirm(selected, qtd); reset(); }
    catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Não foi possível adicionar o item. Tente novamente.';
      setError(msg);
    }
    finally { setSaving(false); }
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
            <Text style={styles.emptySectionText}>Todos os tipos já estão no estoque.</Text>
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
                    onPress={() => { setSelected(item.id); setError(null); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tipoNome, selected === item.id && { color: Colors.blue.dark, fontWeight: '700' }]}>
                      {item.nome}
                    </Text>
                    {selected === item.id && <Ionicons name="checkmark-circle" size={18} color={Colors.blue.dark} />}
                  </TouchableOpacity>
                )}
              />

              {selected && (
                <View style={styles.modalField}>
                  <Text style={styles.fieldLabel}>Quantidade inicial</Text>
                  <TextInput
                    style={styles.textInput}
                    value={qtdStr}
                    onChangeText={(v) => { setQtdStr(v); setError(null); }}
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                </View>
              )}
            </>
          )}

          {error && (
            <View style={styles.modalErrorBox}>
              <Ionicons name="alert-circle-outline" size={14} color="#DC2626" />
              <Text style={styles.modalErrorText}>{error}</Text>
            </View>
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
  onConfirm: (tipoId: string, eventoId: string, prioridade: string, quantidade: number, descricao: string) => Promise<void>;
  onClose: () => void;
}

type DemandaStep = 'tipo' | 'evento' | 'detalhes';

function CreateDemandaModal({ visible, tipos, eventos, onConfirm, onClose }: CreateDemandaModalProps) {
  const [step, setStep]             = useState<DemandaStep>('tipo');
  const [tipoId, setTipoId]         = useState<string | null>(null);
  const [eventoId, setEventoId]     = useState<string | null>(null);
  const [prioridade, setPrioridade] = useState<Prioridade>('MEDIA');
  const [qtdStr, setQtdStr]         = useState('1');
  const [descricao, setDescricao]   = useState('');
  const [saving, setSaving]         = useState(false);

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
    try { await onConfirm(tipoId, eventoId, prioridade, qtd, descricao); reset(); }
    catch { Alert.alert('Erro', 'Não foi possível criar a demanda.'); }
    finally { setSaving(false); }
  }

  const tipoNome  = tipos.find((t) => t.id === tipoId)?.nome ?? '';
  const eventoTit = eventos.find((e) => e.id === eventoId)?.titulo ?? '';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nova Demanda</Text>
            <TouchableOpacity onPress={close} hitSlop={8}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

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
                    <Text style={[styles.tipoNome, tipoId === item.id && { color: Colors.blue.dark, fontWeight: '700' }]}>
                      {item.nome}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                )}
              />
            </>
          )}

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
                      style={[styles.tipoNome, eventoId === item.id && { color: Colors.blue.dark, fontWeight: '700' }]}
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

          {step === 'detalhes' && (
            <ScrollView showsVerticalScrollIndicator={false}>
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
                      <Text style={[styles.prioBtnText, sel && { color: '#fff' }]}>{cfg.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Quantidade solicitada</Text>
              <TextInput
                style={styles.textInput}
                value={qtdStr}
                onChangeText={setQtdStr}
                keyboardType="numeric"
                selectTextOnFocus
              />

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
                style={[styles.confirmBtn, { backgroundColor: Colors.brand.orange }, saving && { opacity: 0.5 }]}
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

// ── Modal: Recusar Evento ─────────────────────────────────────

interface RecusarEventoModalProps {
  visible: boolean;
  evento: PendingEvento;
  motivos: MotivoRecusaDTO[];
  onConfirm: (ev: PendingEvento, motivoId: string, descricao?: string) => Promise<void>;
  onClose: () => void;
}

function RecusarEventoModal({ visible, evento, motivos, onConfirm, onClose }: RecusarEventoModalProps) {
  const [motivoId, setMotivoId]     = useState<string | null>(null);
  const [descricao, setDescricao]   = useState('');
  const [saving, setSaving]         = useState(false);

  const motivoSelecionado = motivos.find((m) => m.id === motivoId);

  function reset() { setMotivoId(null); setDescricao(''); }
  function close() { reset(); onClose(); }

  async function confirm() {
    if (!motivoId) return;
    if (motivoSelecionado?.descricaoObrigatoria && !descricao.trim()) {
      Alert.alert('Atenção', 'Descrição obrigatória para este motivo.');
      return;
    }
    setSaving(true);
    try { await onConfirm(evento, motivoId, descricao); reset(); }
    catch { Alert.alert('Erro', 'Não foi possível recusar o evento.'); }
    finally { setSaving(false); }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Recusar Evento</Text>
            <TouchableOpacity onPress={close} hitSlop={8}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle} numberOfLines={2}>
            {evento.titulo}
          </Text>

          <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>Motivo da recusa</Text>
          <FlatList
            data={motivos}
            keyExtractor={(m) => m.id}
            style={{ maxHeight: 180 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.tipoItem, motivoId === item.id && styles.tipoItemSelected]}
                onPress={() => setMotivoId(item.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tipoNome, motivoId === item.id && { color: Colors.blue.dark, fontWeight: '700' }]}>
                  {item.label}
                </Text>
                {motivoId === item.id && <Ionicons name="checkmark-circle" size={18} color={Colors.blue.dark} />}
              </TouchableOpacity>
            )}
          />

          {motivoId && (
            <View style={styles.modalField}>
              <Text style={styles.fieldLabel}>
                Descrição{motivoSelecionado?.descricaoObrigatoria ? ' (obrigatória)' : ' (opcional)'}
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={descricao}
                onChangeText={setDescricao}
                multiline
                placeholder="Explique o motivo..."
                placeholderTextColor="#94A3B8"
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: '#DC2626' }, (!motivoId || saving) && { opacity: 0.45 }]}
            onPress={confirm}
            disabled={!motivoId || saving}
            activeOpacity={0.8}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.confirmBtnText}>Confirmar Recusa</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Modal: Receber Doação ─────────────────────────────────────

interface ReceberDoacaoModalProps {
  visible: boolean;
  doacao: DoacaoDTO;
  tipoNome: string;
  onConfirm: (id: string, qtd: number) => Promise<void>;
  onClose: () => void;
}

function ReceberDoacaoModal({ visible, doacao, tipoNome, onConfirm, onClose }: ReceberDoacaoModalProps) {
  const [qtdStr, setQtdStr] = useState(String(doacao.quantidade));
  const [saving, setSaving] = useState(false);

  async function confirm() {
    const qtd = parseInt(qtdStr, 10);
    if (isNaN(qtd) || qtd < 1) { Alert.alert('Atenção', 'Quantidade inválida.'); return; }
    if (qtd > doacao.quantidade) {
      Alert.alert('Atenção', `Máximo permitido: ${doacao.quantidade}`);
      return;
    }
    setSaving(true);
    try { await onConfirm(doacao.id, qtd); }
    catch { Alert.alert('Erro', 'Não foi possível registrar o recebimento.'); }
    finally { setSaving(false); }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Receber Doação</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>{tipoNome}</Text>
          <Text style={[styles.fieldLabel, { marginBottom: 4 }]}>
            Quantidade prevista: {doacao.quantidade}
          </Text>

          <View style={styles.modalField}>
            <Text style={styles.fieldLabel}>Quantidade recebida</Text>
            <TextInput
              style={styles.textInput}
              value={qtdStr}
              onChangeText={setQtdStr}
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: '#7C3AED' }, saving && { opacity: 0.5 }]}
            onPress={confirm}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.confirmBtnText}>Confirmar Recebimento</Text>}
          </TouchableOpacity>
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
  pcNome: { fontSize: 22, fontWeight: '800', color: Colors.blue.dark, marginBottom: 8 },
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
  workforceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: Colors.blue.dark, borderRadius: 8,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  workforceBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  // ── PC card ──────────────────────────────────────────────
  pcCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 20, gap: 8,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  pcRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pcRowText:{ fontSize: 12, color: '#475569', flex: 1 },
  pcDesc:   { fontSize: 12, color: '#64748B', lineHeight: 17 },
  rejeitadoBadge: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: '#FEE2E2', borderRadius: 8, padding: 8,
    borderWidth: 1, borderColor: '#FECACA',
  },
  rejeitadoText: { flex: 1, fontSize: 12, color: '#DC2626', lineHeight: 16 },

  // ── Eventos pendentes ────────────────────────────────────
  eventoCard: {
    backgroundColor: '#fff', borderRadius: 12, marginBottom: 8,
    flexDirection: 'row', overflow: 'hidden',
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  eventoCardAccent: { width: 4, backgroundColor: '#C2410C' },
  eventoCardBody:   { flex: 1, padding: 12, gap: 10 },
  eventoCardTitulo: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  eventoCardData:   { fontSize: 11, color: '#94A3B8' },
  eventoCardBtns:   { flexDirection: 'row', gap: 8 },
  eventoAceitarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#22C55E', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  eventoRecusarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEE2E2', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: '#FECACA',
  },
  eventoBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // ── Doações ──────────────────────────────────────────────
  doacaoCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  doacaoInfo:  { flex: 1 },
  doacaoTipo:  { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  doacaoQtd:   { fontSize: 12, color: '#64748B', marginTop: 2 },
  doacaoDesc:  { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  doacaoData:  { fontSize: 11, color: '#64748B', marginTop: 2 },
  receberBtn: {
    backgroundColor: '#EDE9FE', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: '#C4B5FD',
  },
  receberBtnText: { fontSize: 12, fontWeight: '700', color: '#7C3AED' },

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
  estoqueControls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
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
  demandaTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  demandaBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  demandaBadgeText: { fontSize: 11, fontWeight: '700' },
  demandaQtd:  { flex: 1, fontSize: 12, color: '#64748B', fontWeight: '600' },
  demandaNome: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  demandaDesc: { fontSize: 12, color: '#64748B', lineHeight: 17 },
  demandaIntencionada: { fontSize: 11, color: '#7C3AED', fontWeight: '600' },
  progressBar: { height: 5, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  // ── Info box ─────────────────────────────────────────────
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
  tipoItemSelected: { backgroundColor: '#EFF6FF', borderColor: Colors.blue.dark },
  tipoNome: { fontSize: 14, color: '#334155', flex: 1, marginRight: 8 },

  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6 },
  textInput: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: '#1E293B', backgroundColor: '#F8FAFC',
    marginBottom: 14,
  },
  textArea: { height: 72, textAlignVertical: 'top' },

  prioridadeRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  prioBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: 8, backgroundColor: '#F1F5F9',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  prioBtnText: { fontSize: 11, fontWeight: '700', color: '#64748B' },

  confirmBtn: {
    backgroundColor: Colors.blue.dark, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  chipRow:     { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  summaryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#EFF6FF', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.blue.light,
    maxWidth: 160,
  },
  summaryChipText: { fontSize: 12, fontWeight: '600', color: Colors.blue.dark, flex: 1 },

  backBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  backBtnText: { fontSize: 12, color: '#64748B' },

  // ── Erro inline em modal ─────────────────────────────────
  modalErrorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    backgroundColor: '#FEE2E2', borderRadius: 10, padding: 10, marginBottom: 8,
    borderWidth: 1, borderColor: '#FECACA',
  },
  modalErrorText: { flex: 1, fontSize: 12, color: '#DC2626', lineHeight: 17 },
});
