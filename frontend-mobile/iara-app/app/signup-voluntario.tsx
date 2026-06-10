import { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
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

import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAppModal } from '../components/AppModal';
import { api } from '../services/api';
import { Colors } from '../constants/theme';

interface EspecDTO { id: string; nome: string; }

export default function SignupVoluntario() {
  const { show, modal } = useAppModal();
  const [nome,          setNome         ] = useState('');
  const [email,         setEmail        ] = useState('');
  const [telefone,      setTelefone     ] = useState('');
  const [documento,     setDocumento    ] = useState('');
  const [senha,         setSenha        ] = useState('');
  const [registro,      setRegistro     ] = useState('');
  const [especialidade, setEspecialidade] = useState<EspecDTO | null>(null);
  const [showEspec,     setShowEspec    ] = useState(false);
  const [loading,       setLoading      ] = useState(false);
  const [especialidades,setEspecialidades] = useState<EspecDTO[]>([]);
  const [loadingEspec,  setLoadingEspec ] = useState(false);

  useEffect(() => {
    setLoadingEspec(true);
    api.get<EspecDTO[]>('/especialidades')
      .then((r) => setEspecialidades(r.data))
      .catch(() => show({ type: 'error', title: 'Erro', message: 'Não foi possível carregar as especialidades.' }))
      .finally(() => setLoadingEspec(false));
  }, []);

  async function handleRegister() {
    if (!nome || !email || !telefone || !documento || !senha || !registro || !especialidade) {
      show({ type: 'warning', title: 'Campos obrigatórios', message: 'Por favor, preencha todos os campos.' });
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('nome',                nome);
      formData.append('email',               email);
      formData.append('telefone',            telefone);
      formData.append('documento',           documento);
      formData.append('senha',               senha);
      formData.append('tenantId',            '00000000-0000-0000-0000-000000000001');
      formData.append('idEspec',             especialidade.id);
      formData.append('docComprovacaoNumero',registro);

      await api.post('/usuarios/cadastro/tecnico', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      show({
        type: 'success',
        title: 'Cadastro Enviado!',
        message: 'Seu cadastro está pendente de aprovação pela Defesa Civil. Você será notificado quando for aprovado.',
        confirmLabel: 'OK',
        onConfirm: () => router.replace('/'),
      });
    } catch (error: any) {
      const msg = error.response?.data?.mensagem ?? 'Não foi possível realizar o cadastro.';
      show({ type: 'error', title: 'Erro no Cadastro', message: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {modal}
      <StatusBar style="light" backgroundColor={Colors.blue.dark} />

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
          {/* ── Área azul — Voluntário ── */}
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="shield-checkmark" size={40} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>Cadastro de Voluntário</Text>
            <Text style={styles.heroSubtitle}>
              Seu cadastro passará por aprovação da Defesa Civil
            </Text>
          </View>

          {/* ── Card branco — formulário ── */}
          <View style={styles.card}>

            {/* Badge de aprovação pendente */}
            <View style={styles.pendingBadge}>
              <Ionicons name="time-outline" size={14} color="#F97316" />
              <Text style={styles.pendingText}>
                Perfil técnico — aprovação necessária após envio
              </Text>
            </View>

            <View style={styles.form}>
              <Input placeholder="Nome Completo" value={nome} onChangeText={setNome} />
              <Input placeholder="E-mail" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
              <Input placeholder="Telefone (com DDD)" keyboardType="phone-pad" value={telefone} onChangeText={setTelefone} />
              <Input placeholder="CPF" keyboardType="numeric" value={documento} onChangeText={setDocumento} />
              <Input placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} />

              {/* Seletor de Especialidade */}
              <TouchableOpacity
                style={[styles.pickerBtn, especialidade && styles.pickerBtnActive]}
                onPress={() => !loadingEspec && setShowEspec(true)}
                activeOpacity={0.7}
              >
                <Text style={especialidade ? styles.pickerTextActive : styles.pickerText}>
                  {loadingEspec
                    ? 'Carregando especialidades...'
                    : especialidade
                      ? especialidade.nome
                      : 'Selecionar Especialidade Técnica'}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={especialidade ? Colors.blue.dark : '#94A3B8'}
                />
              </TouchableOpacity>

              <Input
                placeholder="Número de Registro Profissional (CRM, COREN, CREA...)"
                value={registro}
                onChangeText={setRegistro}
              />

              <Button
                label={loading ? 'Enviando...' : 'Enviar Cadastro'}
                onPress={handleRegister}
              />
            </View>

            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={styles.backBtnText}>Cancelar e voltar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Modal de especialidades ── */}
      <Modal
        animationType="slide"
        transparent
        visible={showEspec}
        onRequestClose={() => setShowEspec(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione sua Especialidade</Text>
              <TouchableOpacity onPress={() => setShowEspec(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={especialidades}
              keyExtractor={(i) => i.id}
              contentContainerStyle={styles.modalList}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => { setEspecialidade(item); setShowEspec(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.modalItemText,
                    especialidade?.id === item.id && styles.modalItemTextActive,
                  ]}>
                    {item.nome}
                  </Text>
                  {especialidade?.id === item.id && (
                    <Ionicons name="checkmark" size={18} color={Colors.blue.dark} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.blue.dark },
  flex:       { flex: 1 },
  scrollView: { backgroundColor: '#fff' },
  scroll:     { flexGrow: 1 },

  hero: {
    backgroundColor: Colors.blue.dark,
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 28,
    gap: 8,
    paddingHorizontal: 24,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle:    { fontSize: 22, fontWeight: '800', color: '#fff' },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 18 },

  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    minHeight: 560,
  },

  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  pendingText: { fontSize: 12, color: '#C2410C', fontWeight: '600', flex: 1 },

  form: { gap: 12 },

  pickerBtn: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.blue.light,
    backgroundColor: Colors.brand.white,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  pickerBtnActive: { borderColor: Colors.blue.dark, backgroundColor: `${Colors.blue.dark}08` },
  pickerText:      { fontSize: 16, color: Colors.neutral.gray, flex: 1 },
  pickerTextActive:{ fontSize: 16, color: Colors.blue.dark, fontWeight: '600', flex: 1 },

  backBtn:     { marginTop: 20, alignItems: 'center' },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.blue.dark },
  modalList:  { paddingBottom: 8 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  modalItemText:       { fontSize: 15, color: '#1E293B' },
  modalItemTextActive: { color: Colors.blue.dark, fontWeight: '700' },
  separator:           { height: 1, backgroundColor: '#F8FAFC' },
});
