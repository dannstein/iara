import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
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
import * as Location from 'expo-location';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useAppModal } from '../../components/AppModal';
import { apiCached } from '../../lib/cache';
import { api } from '../../services/api';

// ── Tipos ────────────────────────────────────────────────────

interface DesastreTipoDTO {
  id: string;
  nome: string;
  cobradeCod: string;
}

// ── Constantes ───────────────────────────────────────────────

const SEVERIDADES = [
  { key: 'BAIXA',  label: 'Baixo',   color: '#22C55E' },
  { key: 'MEDIA',  label: 'Médio',   color: '#EAB308' },
  { key: 'ALTA',   label: 'Alto',    color: '#F97316' },
  { key: 'CRITICA',label: 'Crítico', color: '#EF4444' },
] as const;

const DEFAULT_RAIO = 500;

// ── Geocodificação via Nominatim ──────────────────────────────

async function geocodeStructured(fields: {
  logradouro: string; numero: string; bairro: string;
  cidade: string; uf: string; cep: string;
}): Promise<{ lat: number; lng: number; label: string } | null> {
  const parts = [
    fields.logradouro && `${fields.logradouro}${fields.numero ? ' ' + fields.numero : ''}`,
    fields.bairro,
    fields.cidade,
    fields.uf,
    'Brasil',
  ].filter(Boolean);
  if (parts.length < 2) return null;

  const q = encodeURIComponent(parts.join(', '));
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1&countrycodes=br`,
    { headers: { 'User-Agent': 'IARA-App/1.0' } },
  );
  const data: any[] = await res.json();
  if (!data.length) return null;

  const short = data[0].display_name.split(',').slice(0, 3).join(',').trim();
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: short };
}

async function lookupCep(cep: string): Promise<{
  logradouro: string; bairro: string; cidade: string; uf: string;
} | null> {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const res  = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  const data = await res.json();
  if (data.erro) return null;
  return {
    logradouro: data.logradouro ?? '',
    bairro:     data.bairro     ?? '',
    cidade:     data.localidade ?? '',
    uf:         data.uf         ?? '',
  };
}

// ── Tela ─────────────────────────────────────────────────────

export default function Report() {
  const { accessToken, role } = useAuth();
  const { show, modal }  = useAppModal();

  // Guard: COORDENADOR não tem acesso a esta aba — retorna fundo neutro
  // para que a animação de transição não exponha a UI de reporte.
  if (role === 'COORDENADOR') {
    return <View style={{ flex: 1, backgroundColor: '#dfdfdf' }} />;
  }

  // Lookup
  const [tipos, setTipos]             = useState<DesastreTipoDTO[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(true);

  // Modais
  const [showTipoModal, setShowTipoModal]   = useState(false);
  const [showRaioModal, setShowRaioModal]   = useState(false);

  // Form
  const [tipoId, setTipoId]         = useState('');
  const [severidade, setSeveridade] = useState('MEDIA');
  const [titulo, setTitulo]         = useState('');
  const [descricao, setDescricao]   = useState('');
  const [isSimulado, setIsSimulado] = useState(false);
  const [raio, setRaio]             = useState(DEFAULT_RAIO);
  const [raioInput, setRaioInput]   = useState(String(DEFAULT_RAIO));

  // Localização
  const [locationMode, setLocationMode]   = useState<'gps' | 'address'>('gps');
  const [lat, setLat]                     = useState('');
  const [lng, setLng]                     = useState('');
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Campos de endereço
  const [cep, setCep]             = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero]       = useState('');
  const [bairro, setBairro]       = useState('');
  const [cidade, setCidade]       = useState('');
  const [uf, setUf]               = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${accessToken}` }),
    [accessToken],
  );

  // ── Fetch tipos ───────────────────────────────────────────────

  const fetchTipos = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await apiCached<DesastreTipoDTO[]>('/lookup/desastre-tipos', headers);
      setTipos(data);
    } catch {
      show({ type: 'error', title: 'Erro', message: 'Não foi possível carregar os tipos de evento.' });
    } finally {
      setLoadingTipos(false);
    }
  }, [accessToken, headers]);

  useEffect(() => { fetchTipos(); }, [fetchTipos]);

  // ── GPS ──────────────────────────────────────────────────────

  async function getGPSLocation() {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        show({ type: 'warning', title: 'Permissão negada', message: 'Permita o acesso à localização nas configurações.' });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const la  = pos.coords.latitude.toFixed(6);
      const ln  = pos.coords.longitude.toFixed(6);
      setLat(la);
      setLng(ln);
      setLocationLabel(`GPS: ${la}, ${ln}`);
    } catch {
      show({ type: 'error', title: 'Erro de GPS', message: 'Não foi possível obter sua localização.' });
    } finally {
      setGettingLocation(false);
    }
  }

  // ── CEP lookup ────────────────────────────────────────────────

  async function onCepBlur() {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const r = await lookupCep(cep);
      if (r) {
        setLogradouro((prev) => r.logradouro || prev);
        setBairro    ((prev) => r.bairro     || prev);
        setCidade    ((prev) => r.cidade     || prev);
        setUf        ((prev) => r.uf         || prev);
      }
    } catch {}
    finally { setCepLoading(false); }
  }

  // ── Geocodificar endereço ─────────────────────────────────────

  async function geocodeAddress() {
    if (!logradouro.trim() && !cidade.trim() && !cep.trim()) {
      show({ type: 'warning', title: 'Atenção', message: 'Preencha ao menos o CEP ou a cidade/logradouro.' });
      return;
    }
    setGeocoding(true);
    setLocationLabel(null);
    try {
      const r = await geocodeStructured({ logradouro, numero, bairro, cidade, uf, cep });
      if (!r) {
        show({ type: 'error', title: 'Não encontrado', message: 'Endereço não localizado. Ajuste os campos ou use o GPS.' });
      } else {
        setLat(String(r.lat));
        setLng(String(r.lng));
        setLocationLabel(`✓ ${r.label}`);
      }
    } catch {
      show({ type: 'error', title: 'Erro', message: 'Falha ao geocodificar o endereço. Tente novamente.' });
    } finally {
      setGeocoding(false);
    }
  }

  // ── Limpar localização ────────────────────────────────────────

  function clearLocation() {
    setLat(''); setLng(''); setLocationLabel(null);
  }

  // ── Raio ────────────────────────────────────────────────────

  function confirmRaio() {
    const n = parseInt(raioInput, 10);
    if (!isNaN(n) && n > 0) setRaio(n);
    setShowRaioModal(false);
  }

  // ── Reset ────────────────────────────────────────────────────

  function resetForm() {
    setTipoId(''); setSeveridade('MEDIA');
    setTitulo(''); setDescricao('');
    setIsSimulado(false); setRaio(DEFAULT_RAIO); setRaioInput(String(DEFAULT_RAIO));
    clearLocation();
    setCep(''); setLogradouro(''); setNumero(''); setBairro(''); setCidade(''); setUf('');
  }

  // ── Submit ──────────────────────────────────────────────────

  async function handleSubmit() {
    if (!tipoId)        { show({ type: 'warning', title: 'Atenção', message: 'Selecione o tipo (COBRADE).' }); return; }
    if (!titulo.trim()) { show({ type: 'warning', title: 'Atenção', message: 'Informe o título do evento.' }); return; }
    if (!lat || !lng)   { show({ type: 'warning', title: 'Atenção', message: 'Defina a localização: use o GPS ou busque o endereço.' }); return; }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      show({ type: 'warning', title: 'Localização inválida', message: 'Obtenha a localização via GPS ou geocodificando o endereço.' });
      return;
    }

    const tipo = tipos.find((t) => t.id === tipoId);
    setSubmitting(true);
    try {
      await api.post('/eventos', {
        titulo:      titulo.trim(),
        descricao:   descricao.trim() || undefined,
        idTipo:      tipoId,
        severidade,
        coordenadas: { lat: latNum, lng: lngNum },
        raioMetros:  raio,
        cobradeCod:  tipo?.cobradeCod,
        isSimulado,
      }, { headers });

      resetForm();
      show({ type: 'success', title: 'Evento criado!', message: 'Status: SOLICITADO. Aguarda aprovação do gestor.' });
    } catch {
      show({ type: 'error', title: 'Erro ao criar', message: 'Verifique suas permissões ou tente novamente.' });
    } finally {
      setSubmitting(false);
    }
  }

  const selectedTipo = tipos.find((t) => t.id === tipoId);

  // ── Render ───────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={Colors.neutral.gray} />
      {modal}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Novo Evento</Text>
        <Text style={styles.headerSub}>Registrar ocorrência na região</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Tipo (COBRADE) ── */}
        <Text style={styles.fieldLabel}>TIPO (COBRADE) *</Text>
        <TouchableOpacity
          style={[styles.selectBtn, tipoId && styles.selectBtnActive]}
          onPress={() => setShowTipoModal(true)}
          activeOpacity={0.8}
          disabled={loadingTipos}
        >
          {loadingTipos ? (
            <ActivityIndicator size="small" color="#94A3B8" />
          ) : (
            <Ionicons name="warning-outline" size={18} color={tipoId ? Colors.blue.dark : '#94A3B8'} />
          )}
          <Text style={[styles.selectBtnText, tipoId && styles.selectBtnTextActive]} numberOfLines={1}>
            {loadingTipos
              ? 'Carregando tipos…'
              : selectedTipo
                ? `${selectedTipo.nome}${selectedTipo.cobradeCod ? ` (${selectedTipo.cobradeCod})` : ''}`
                : 'Selecione o tipo COBRADE…'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={tipoId ? Colors.blue.dark : '#94A3B8'} />
        </TouchableOpacity>

        {/* ── Severidade ── */}
        <Text style={styles.fieldLabel}>SEVERIDADE *</Text>
        <View style={styles.sevRow}>
          {SEVERIDADES.map((s) => {
            const active = severidade === s.key;
            return (
              <TouchableOpacity
                key={s.key}
                style={[styles.sevChip, { borderColor: s.color }, active && { backgroundColor: s.color }]}
                onPress={() => setSeveridade(s.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.sevChipText, active && styles.sevChipTextActive]}>{s.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Título ── */}
        <Text style={styles.fieldLabel}>TÍTULO *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex.: Enchente no bairro Centro"
          placeholderTextColor="#94A3B8"
          value={titulo}
          onChangeText={setTitulo}
          returnKeyType="next"
        />

        {/* ── Descrição ── */}
        <Text style={styles.fieldLabel}>DESCRIÇÃO <Text style={styles.optional}>(opcional)</Text></Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="Detalhes da ocorrência…"
          placeholderTextColor="#94A3B8"
          value={descricao}
          onChangeText={setDescricao}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* ── Localização ── */}
        <Text style={styles.fieldLabel}>LOCALIZAÇÃO DO EVENTO *</Text>

        {/* Modo selector */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, locationMode === 'gps' && styles.modeBtnActive]}
            onPress={() => { setLocationMode('gps'); clearLocation(); }}
            activeOpacity={0.8}
          >
            <Ionicons name="locate-outline" size={14} color={locationMode === 'gps' ? Colors.blue.dark : '#64748B'} />
            <Text style={[styles.modeBtnText, locationMode === 'gps' && styles.modeBtnTextActive]}>GPS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, locationMode === 'address' && styles.modeBtnActive]}
            onPress={() => { setLocationMode('address'); clearLocation(); }}
            activeOpacity={0.8}
          >
            <Ionicons name="search-outline" size={14} color={locationMode === 'address' ? Colors.blue.dark : '#64748B'} />
            <Text style={[styles.modeBtnText, locationMode === 'address' && styles.modeBtnTextActive]}>Endereço</Text>
          </TouchableOpacity>
        </View>

        {/* ── Modo GPS ── */}
        {locationMode === 'gps' && (
          locationLabel ? (
            <View style={styles.locationOk}>
              <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
              <Text style={styles.locationOkText} numberOfLines={1}>{locationLabel}</Text>
              <TouchableOpacity onPress={clearLocation} hitSlop={10}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.gpsBtn} onPress={getGPSLocation} disabled={gettingLocation} activeOpacity={0.8}>
              {gettingLocation
                ? <ActivityIndicator size="small" color={Colors.blue.medium} />
                : <Ionicons name="locate-outline" size={18} color={Colors.blue.medium} />
              }
              <Text style={styles.gpsBtnText}>
                {gettingLocation ? 'Obtendo localização…' : 'Usar minha localização atual'}
              </Text>
            </TouchableOpacity>
          )
        )}

        {/* ── Modo Endereço ── */}
        {locationMode === 'address' && (
          <View style={styles.addressSection}>
            {/* CEP */}
            <View style={styles.fieldRow}>
              <View style={[styles.fieldCol, { flex: 1.2 }]}>
                <Text style={styles.subLabel}>CEP</Text>
                <View style={styles.cepWrapper}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="00000-000"
                    placeholderTextColor="#94A3B8"
                    value={cep}
                    onChangeText={setCep}
                    onBlur={onCepBlur}
                    keyboardType="numeric"
                    maxLength={9}
                  />
                  {cepLoading && (
                    <ActivityIndicator size="small" color="#94A3B8" style={styles.cepLoader} />
                  )}
                </View>
              </View>
              <View style={[styles.fieldCol, { flex: 2 }]}>
                <Text style={styles.subLabel}>Logradouro</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Rua / Avenida"
                  placeholderTextColor="#94A3B8"
                  value={logradouro}
                  onChangeText={setLogradouro}
                />
              </View>
            </View>

            {/* Número + Bairro */}
            <View style={styles.fieldRow}>
              <View style={[styles.fieldCol, { flex: 1 }]}>
                <Text style={styles.subLabel}>Número</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  placeholderTextColor="#94A3B8"
                  value={numero}
                  onChangeText={setNumero}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.fieldCol, { flex: 2 }]}>
                <Text style={styles.subLabel}>Bairro</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Bairro"
                  placeholderTextColor="#94A3B8"
                  value={bairro}
                  onChangeText={setBairro}
                />
              </View>
            </View>

            {/* Cidade + UF */}
            <View style={styles.fieldRow}>
              <View style={[styles.fieldCol, { flex: 2 }]}>
                <Text style={styles.subLabel}>Cidade</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Cidade"
                  placeholderTextColor="#94A3B8"
                  value={cidade}
                  onChangeText={setCidade}
                />
              </View>
              <View style={[styles.fieldCol, { flex: 1 }]}>
                <Text style={styles.subLabel}>UF</Text>
                <TextInput
                  style={styles.input}
                  placeholder="SP"
                  placeholderTextColor="#94A3B8"
                  value={uf}
                  onChangeText={(v) => setUf(v.toUpperCase())}
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Botão geocodificar */}
            <TouchableOpacity style={styles.geocodeBtn} onPress={geocodeAddress} disabled={geocoding} activeOpacity={0.8}>
              {geocoding
                ? <ActivityIndicator size="small" color={Colors.blue.medium} />
                : <Ionicons name="search-outline" size={16} color={Colors.blue.medium} />
              }
              <Text style={styles.geocodeBtnText}>
                {geocoding ? 'Buscando coordenadas…' : 'Buscar coordenadas do endereço'}
              </Text>
            </TouchableOpacity>

            {/* Resultado */}
            {locationLabel && (
              <View style={styles.locationOk}>
                <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                <Text style={styles.locationOkText} numberOfLines={2}>{locationLabel}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Raio afetado ── */}
        <View style={styles.raioRow}>
          <View>
            <Text style={styles.fieldLabel}>RAIO AFETADO</Text>
            <Text style={styles.raioValue}>{raio.toLocaleString('pt-BR')} metros</Text>
          </View>
          <TouchableOpacity
            style={styles.raioChangeBtn}
            onPress={() => { setRaioInput(String(raio)); setShowRaioModal(true); }}
            activeOpacity={0.8}
          >
            <Ionicons name="pencil-outline" size={14} color={Colors.blue.medium} />
            <Text style={styles.raioChangeBtnText}>Alterar</Text>
          </TouchableOpacity>
        </View>

        {/* ── Simulado ── */}
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Evento simulado</Text>
            <Text style={styles.switchDesc}>Exercício — excluído dos KPIs reais</Text>
          </View>
          <Switch
            value={isSimulado}
            onValueChange={setIsSimulado}
            trackColor={{ false: '#E2E8F0', true: `${Colors.blue.dark}55` }}
            thumbColor={isSimulado ? Colors.blue.dark : '#CBD5E1'}
          />
        </View>

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.82}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="warning-outline" size={18} color="#fff" />
              <Text style={styles.submitText}>Criar Evento</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ════════ Modal: Tipo COBRADE ════════ */}
      <Modal visible={showTipoModal} transparent animationType="slide" onRequestClose={() => setShowTipoModal(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setShowTipoModal(false)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Tipo (COBRADE)</Text>
            <Text style={styles.sheetSub}>Classificação Brasileira de Desastres</Text>
            <FlatList
              data={tipos}
              keyExtractor={(t) => t.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetList}
              renderItem={({ item }) => {
                const active = tipoId === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.sheetItem, active && styles.sheetItemActive]}
                    onPress={() => { setTipoId(item.id); setShowTipoModal(false); }}
                    activeOpacity={0.75}
                  >
                    {item.cobradeCod ? (
                      <View style={[styles.cobradeTag, active && styles.cobradeTagActive]}>
                        <Text style={[styles.cobradeTagText, active && styles.cobradeTagTextActive]}>
                          {item.cobradeCod}
                        </Text>
                      </View>
                    ) : null}
                    <Text style={[styles.sheetItemText, active && styles.sheetItemTextActive]} numberOfLines={2}>
                      {item.nome}
                    </Text>
                    {active && <Ionicons name="checkmark" size={18} color={Colors.blue.dark} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>

      {/* ════════ Modal: Raio ════════ */}
      <Modal visible={showRaioModal} transparent animationType="fade" onRequestClose={() => setShowRaioModal(false)}>
        <Pressable style={styles.raioBackdrop} onPress={() => setShowRaioModal(false)}>
          <View style={styles.raioCard} onStartShouldSetResponder={() => true}>
            <Text style={styles.raioCardTitle}>Raio afetado</Text>
            <Text style={styles.raioCardSub}>Define a área de impacto do evento</Text>
            <TextInput
              style={styles.raioInput}
              value={raioInput}
              onChangeText={setRaioInput}
              keyboardType="numeric"
              autoFocus
              selectTextOnFocus
              textAlign="center"
            />
            <Text style={styles.raioUnit}>metros</Text>
            <View style={styles.raioModalBtns}>
              <TouchableOpacity style={styles.raioCancelBtn} onPress={() => setShowRaioModal(false)} activeOpacity={0.8}>
                <Text style={styles.raioCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.raioConfirmBtn} onPress={confirmRaio} activeOpacity={0.8}>
                <Text style={styles.raioConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ── Estilos ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: Colors.neutral.gray },
  header:      { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.blue.dark },
  headerSub:   { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  scroll:      { paddingHorizontal: 16, paddingBottom: 100 },

  fieldLabel:  { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, marginTop: 20, marginBottom: 8 },
  optional:    { fontWeight: '400', textTransform: 'none', letterSpacing: 0 },
  subLabel:    { fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 4 },

  // Tipo select button
  selectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 14,
  },
  selectBtnActive: { borderColor: Colors.blue.dark, backgroundColor: `${Colors.blue.dark}08` },
  selectBtnText: { flex: 1, fontSize: 14, color: '#94A3B8' },
  selectBtnTextActive: { color: Colors.blue.dark, fontWeight: '600' },

  // Severidade
  sevRow:            { flexDirection: 'row', gap: 8 },
  sevChip:           { flex: 1, borderRadius: 12, paddingVertical: 10, borderWidth: 1.5, alignItems: 'center', backgroundColor: '#fff' },
  sevChipText:       { fontSize: 12, fontWeight: '700', color: '#64748B' },
  sevChipTextActive: { color: '#fff' },

  // Inputs
  input: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#1E293B',
  },
  inputMulti: { minHeight: 100, paddingTop: 12 },

  // Localização
  modeRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0',
    padding: 3, gap: 3,
    marginBottom: 10,
  },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 10, paddingVertical: 9,
  },
  modeBtnActive:     { backgroundColor: `${Colors.blue.dark}15` },
  modeBtnText:       { fontSize: 13, fontWeight: '600', color: '#64748B' },
  modeBtnTextActive: { color: Colors.blue.dark },

  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14,
    borderWidth: 1.5, borderColor: Colors.blue.medium, borderStyle: 'dashed',
  },
  gpsBtnText: { fontSize: 14, fontWeight: '600', color: Colors.blue.medium },

  locationOk: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12,
    borderWidth: 1.5, borderColor: '#22C55E55', marginTop: 6,
  },
  locationOkText: { flex: 1, fontSize: 13, color: '#166534', fontWeight: '500' },

  // Endereço
  addressSection: { gap: 8 },
  fieldRow:       { flexDirection: 'row', gap: 8 },
  fieldCol:       { gap: 0 },
  cepWrapper:     { flexDirection: 'row', alignItems: 'center' },
  cepLoader:      { position: 'absolute', right: 12 },

  geocodeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12,
    borderWidth: 1.5, borderColor: Colors.blue.medium,
  },
  geocodeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.blue.medium },

  // Raio
  raioRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 12, marginTop: 8,
  },
  raioValue:     { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 2 },
  raioChangeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1.5, borderColor: Colors.blue.medium },
  raioChangeBtnText: { fontSize: 12, fontWeight: '700', color: Colors.blue.medium },

  // Simulado
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 12, marginTop: 14 },
  switchInfo:  { flex: 1 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  switchDesc:  { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  // Submit
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.brand.dark_orange, borderRadius: 14, paddingVertical: 16, marginTop: 28,
    elevation: 3, shadowColor: Colors.brand.dark_orange,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // ── Bottom sheet (Tipo) ──
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 16, paddingBottom: 32,
    maxHeight: '75%',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  sheetTitle:  { fontSize: 17, fontWeight: '800', color: '#1E293B', marginBottom: 2 },
  sheetSub:    { fontSize: 12, color: '#94A3B8', marginBottom: 12 },
  sheetList:   { paddingBottom: 16 },
  sheetItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  sheetItemActive:     { backgroundColor: `${Colors.blue.dark}08`, borderRadius: 10, paddingHorizontal: 8 },
  sheetItemText:       { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
  sheetItemTextActive: { color: Colors.blue.dark, fontWeight: '600' },
  cobradeTag:           { backgroundColor: '#F1F5F9', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  cobradeTagActive:     { backgroundColor: `${Colors.blue.dark}20` },
  cobradeTagText:       { fontSize: 10, fontWeight: '700', color: '#64748B' },
  cobradeTagTextActive: { color: Colors.blue.dark },

  // ── Modal raio ──
  raioBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'center', paddingHorizontal: 40 },
  raioCard: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 24, alignItems: 'center', gap: 8, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16 },
  raioCardTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  raioCardSub:   { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginBottom: 4 },
  raioInput: { width: '100%', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', fontSize: 32, fontWeight: '800', color: Colors.blue.dark, paddingVertical: 12, paddingHorizontal: 16 },
  raioUnit:  { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginBottom: 8 },
  raioModalBtns: { flexDirection: 'row', gap: 10, width: '100%' },
  raioCancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  raioCancelText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  raioConfirmBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: Colors.blue.dark, alignItems: 'center' },
  raioConfirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
