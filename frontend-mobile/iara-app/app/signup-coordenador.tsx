import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAppModal } from '../components/AppModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Colors } from '../constants/theme';

// ── Helpers ────────────────────────────────────────────────────

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

async function geocodeAddress(fields: {
  logradouro: string; numero: string; bairro: string;
  cidade: string; uf: string;
}): Promise<{ lat: number; lng: number } | null> {
  const parts = [
    fields.logradouro && `${fields.logradouro}${fields.numero ? ' ' + fields.numero : ''}`,
    fields.bairro,
    fields.cidade,
    fields.uf,
    'Brasil',
  ].filter(Boolean);
  if (parts.length < 2) return null;
  const q   = encodeURIComponent(parts.join(', '));
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1&countrycodes=br`,
    { headers: { 'User-Agent': 'IARA-App/1.0' } },
  );
  const data: any[] = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

type Step = 'pessoal' | 'ponto';

export default function SignupCoordenador() {
  const { refresh } = useAuth();
  const { show, modal } = useAppModal();

  const [step, setStep] = useState<Step>('pessoal');

  // Dados pessoais
  const [nome,      setNome     ] = useState('');
  const [email,     setEmail    ] = useState('');
  const [telefone,  setTelefone ] = useState('');
  const [documento, setDocumento] = useState('');
  const [senha,     setSenha    ] = useState('');

  // Dados do ponto de coleta
  const [pcNome,       setPcNome      ] = useState('');
  const [cep,          setCep         ] = useState('');
  const [logradouro,   setLogradouro  ] = useState('');
  const [numero,       setNumero      ] = useState('');
  const [complemento,  setComplemento ] = useState('');
  const [bairro,       setBairro      ] = useState('');
  const [cidade,       setCidade      ] = useState('');
  const [uf,           setUf          ] = useState('');

  const [cepLoading, setCepLoading] = useState(false);
  const [loading,    setLoading   ] = useState(false);

  // ── CEP lookup ─────────────────────────────────────────────

  async function handleCepChange(value: string) {
    setCep(value);
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const r = await lookupCep(value);
      if (r) {
        setLogradouro(r.logradouro);
        setBairro(r.bairro);
        setCidade(r.cidade);
        setUf(r.uf);
      } else {
        show({ type: 'warning', title: 'CEP não encontrado', message: 'Preencha o endereço manualmente.' });
      }
    } catch {
      // silencioso — usuário preenche manualmente
    } finally {
      setCepLoading(false);
    }
  }

  // ── Passo 1 → 2 ────────────────────────────���──────────────

  function handleProximo() {
    if (!nome.trim() || !email.trim() || !documento.trim() || !senha.trim()) {
      show({ type: 'warning', title: 'Campos obrigatórios', message: 'Preencha nome, e-mail, CPF e senha.' });
      return;
    }
    if (senha.length < 8) {
      show({ type: 'warning', title: 'Senha fraca', message: 'A senha deve ter ao menos 8 caracteres.' });
      return;
    }
    setStep('ponto');
  }

  // ── Envio final ────────────────────────────────────────────

  async function handleRegistrar() {
    if (!pcNome.trim() || !logradouro.trim() || !numero.trim() || !bairro.trim() || !cidade.trim() || !uf.trim()) {
      show({ type: 'warning', title: 'Campos obrigatórios', message: 'Preencha o nome do ponto e o endereço completo.' });
      return;
    }
    if (uf.trim().length !== 2) {
      show({ type: 'warning', title: 'UF inválida', message: 'Digite a sigla do estado com 2 letras (ex: SP).' });
      return;
    }

    setLoading(true);
    try {
      // Coordenadas obrigatórias pelo backend — geocodifica antes de enviar
      const coords = await geocodeAddress({ logradouro, numero, bairro, cidade, uf });
      if (!coords) {
        show({
          type: 'error',
          title: 'Endereço não localizado',
          message: 'Não foi possível obter as coordenadas do endereço. Verifique os dados e tente novamente.',
        });
        setLoading(false);
        return;
      }

      const response = await api.post('/usuarios/cadastro/coordenador', {
        nome:     nome.trim(),
        email:    email.trim(),
        telefone: telefone.trim() || undefined,
        documento:documento.trim(),
        senha,
        tenantId: TENANT_ID,
        pcNome:   pcNome.trim(),
        endereco: {
          cep:         cep.replace(/\D/g, '') || undefined,
          logradouro:  logradouro.trim(),
          numero:      numero.trim(),
          complemento: complemento.trim() || undefined,
          bairro:      bairro.trim(),
          cidade:      cidade.trim(),
          uf:          uf.trim().toUpperCase(),
          coordenadas: coords,
        },
      });

      const { accessToken } = response.data;
      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('userData', JSON.stringify(response.data));

      await refresh();
      await new Promise<void>((r) => setTimeout(r, 150));

      show({
        type: 'success',
        title: 'Cadastro realizado!',
        message: 'Sua conta e ponto de coleta foram criados. Um gestor irá verificar e ativar seu ponto em breve.',
        confirmLabel: 'Entrar',
        onConfirm: () => router.replace('/(tabs)/home'),
      });
    } catch (error: any) {
      const msg = error.response?.data?.mensagem ?? 'Não foi possível realizar o cadastro.';
      show({ type: 'error', title: 'Erro no Cadastro', message: msg });
    } finally {
      setLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {modal}
      <StatusBar style="light" backgroundColor={COLOR} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ── */}
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="storefront" size={40} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>Ponto de Coleta</Text>
            <Text style={styles.heroSubtitle}>
              Crie sua conta e cadastre seu ponto em um único passo
            </Text>

            {/* Indicador de etapas */}
            <View style={styles.steps}>
              <View style={styles.stepItem}>
                <View style={[styles.stepDot, step === 'pessoal' ? styles.stepDotActive : styles.stepDotDone]}>
                  {step === 'ponto'
                    ? <Ionicons name="checkmark" size={12} color="#fff" />
                    : <Text style={styles.stepNum}>1</Text>}
                </View>
                <Text style={styles.stepLabel}>Seus dados</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={styles.stepItem}>
                <View style={[styles.stepDot, step === 'ponto' ? styles.stepDotActive : styles.stepDotInactive]}>
                  <Text style={styles.stepNum}>2</Text>
                </View>
                <Text style={styles.stepLabel}>Ponto de Coleta</Text>
              </View>
            </View>
          </View>

          {/* ── Card ── */}
          <View style={styles.card}>

            {/* ── Etapa 1: Dados pessoais ── */}
            {step === 'pessoal' && (
              <>
                <Text style={styles.stepTitle}>Seus dados pessoais</Text>
                <View style={styles.form}>
                  <Input placeholder="Nome Completo" autoCapitalize="words" value={nome} onChangeText={setNome} />
                  <Input placeholder="E-mail" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
                  <Input placeholder="Telefone (com DDD)" keyboardType="phone-pad" value={telefone} onChangeText={setTelefone} />
                  <Input placeholder="CPF" keyboardType="numeric" value={documento} onChangeText={setDocumento} />
                  <Input placeholder="Senha (mín. 8 caracteres)" secureTextEntry value={senha} onChangeText={setSenha} />
                  <Button label="Próximo →" onPress={handleProximo} />
                </View>
              </>
            )}

            {/* ── Etapa 2: Dados do ponto ── */}
            {step === 'ponto' && (
              <>
                <Text style={styles.stepTitle}>Dados do Ponto de Coleta</Text>

                <View style={styles.pendingBadge}>
                  <Ionicons name="time-outline" size={14} color="#C2410C" />
                  <Text style={styles.pendingText}>
                    Após o cadastro, um gestor verificará e ativará seu ponto de coleta.
                  </Text>
                </View>

                <View style={styles.form}>
                  <Input
                    placeholder="Nome do Ponto de Coleta"
                    value={pcNome}
                    onChangeText={setPcNome}
                  />

                  {/* CEP com indicador de carregamento */}
                  <View style={styles.cepWrapper}>
                    <Input
                      placeholder="CEP (somente números)"
                      keyboardType="numeric"
                      maxLength={9}
                      value={cep}
                      onChangeText={handleCepChange}
                    />
                    {cepLoading && (
                      <ActivityIndicator
                        size="small"
                        color="#94A3B8"
                        style={styles.cepLoader}
                      />
                    )}
                  </View>

                  <View style={styles.row}>
                    <View style={styles.rowFlex}>
                      <Input placeholder="Logradouro" value={logradouro} onChangeText={setLogradouro} />
                    </View>
                    <View style={styles.rowFixed}>
                      <Input placeholder="Nº" keyboardType="numeric" value={numero} onChangeText={setNumero} />
                    </View>
                  </View>

                  <Input placeholder="Complemento (opcional)" value={complemento} onChangeText={setComplemento} />
                  <Input placeholder="Bairro" value={bairro} onChangeText={setBairro} />

                  <View style={styles.row}>
                    <View style={styles.rowFlex}>
                      <Input placeholder="Cidade" value={cidade} onChangeText={setCidade} />
                    </View>
                    <View style={styles.rowUf}>
                      <Input
                        placeholder="UF"
                        value={uf}
                        onChangeText={(t) => setUf(t.toUpperCase())}
                        autoCapitalize="characters"
                        maxLength={2}
                      />
                    </View>
                  </View>

                  <Button
                    label={loading ? 'Criando...' : 'Criar Conta e Ponto de Coleta'}
                    onPress={handleRegistrar}
                  />
                </View>

                <TouchableOpacity style={styles.backBtn} onPress={() => setStep('pessoal')} activeOpacity={0.7}>
                  <Ionicons name="arrow-back" size={14} color="#94A3B8" />
                  <Text style={styles.backBtnText}>Voltar para dados pessoais</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancelar e voltar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const COLOR = '#059669'; // esmeralda — identidade visual do coordenador/PC

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: COLOR },
  flex:       { flex: 1 },
  scrollView: { backgroundColor: '#fff' },
  scroll:     { flexGrow: 1 },

  hero: {
    backgroundColor: COLOR,
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 28,
    gap: 8,
    paddingHorizontal: 24,
  },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle:    { fontSize: 22, fontWeight: '800', color: '#fff' },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 18 },

  // Indicador de etapas
  steps:         { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 0 },
  stepItem:      { alignItems: 'center', gap: 4 },
  stepLine:      { width: 40, height: 2, backgroundColor: 'rgba(255,255,255,0.35)', marginHorizontal: 6, marginBottom: 20 },
  stepDot: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive:   { backgroundColor: '#fff' },
  stepDotDone:     { backgroundColor: 'rgba(255,255,255,0.9)' },
  stepDotInactive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  stepNum:         { fontSize: 12, fontWeight: '800', color: COLOR },
  stepLabel:       { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    minHeight: 520,
  },

  stepTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B', marginBottom: 16 },

  pendingBadge: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FFF7ED', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1, borderColor: '#FED7AA',
  },
  pendingText: { flex: 1, fontSize: 12, color: '#C2410C', fontWeight: '600', lineHeight: 17 },

  form: { gap: 12 },

  row:      { flexDirection: 'row', gap: 10 },
  rowFlex:  { flex: 1 },
  rowFixed: { width: 72 },
  rowUf:    { width: 64 },

  cepWrapper: { position: 'relative' },
  cepLoader:  { position: 'absolute', right: 14, top: 14 },

  backBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, justifyContent: 'center' },
  backBtnText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },

  cancelBtn:     { marginTop: 10, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#CBD5E1' },
});
