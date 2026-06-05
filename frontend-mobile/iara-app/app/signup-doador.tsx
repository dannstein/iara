import { useState } from 'react';
import {
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

export default function SignupDoador() {
  const { refresh } = useAuth();
  const { show, modal } = useAppModal();
  const [nome,      setNome     ] = useState('');
  const [email,     setEmail    ] = useState('');
  const [telefone,  setTelefone ] = useState('');
  const [documento, setDocumento] = useState('');
  const [senha,     setSenha    ] = useState('');
  const [loading,   setLoading  ] = useState(false);

  async function handleRegister() {
    if (!nome || !email || !telefone || !documento || !senha) {
      show({ type: 'warning', title: 'Campos obrigatórios', message: 'Por favor, preencha todos os campos.' });
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/usuarios/cadastro/doador', {
        nome, email, telefone, documento, senha,
        tenantId: '00000000-0000-0000-0000-000000000001',
      });

      const { accessToken, role } = response.data;
      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('userData', JSON.stringify(response.data));

      // Atualiza o AuthContext com o novo role ANTES de navegar.
      // Sem isso o contexto fica com o role do usuário anterior (bug crítico).
      await refresh();
      await new Promise<void>((r) => setTimeout(r, 150));

      show({
        type: 'success',
        title: 'Conta criada!',
        message: 'Cadastro realizado com sucesso.',
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {modal}
      <StatusBar style="light" backgroundColor={Colors.brand.dark_orange} />

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
          {/* ── Área laranja — Doador ── */}
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="heart" size={42} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>Cadastro de Doador</Text>
            <Text style={styles.heroSubtitle}>Preencha seus dados para começar a ajudar</Text>
          </View>

          {/* ── Card branco — formulário ── */}
          <View style={styles.card}>
            <View style={styles.form}>
              <Input placeholder="Nome Completo" onChangeText={setNome} />
              <Input placeholder="E-mail" keyboardType="email-address" autoCapitalize="none" onChangeText={setEmail} />
              <Input placeholder="Telefone (com DDD)" keyboardType="phone-pad" onChangeText={setTelefone} />
              <Input placeholder="CPF" keyboardType="numeric" onChangeText={setDocumento} />
              <Input placeholder="Senha" secureTextEntry onChangeText={setSenha} />
              <Button label={loading ? 'Criando conta...' : 'Criar Conta'} onPress={handleRegister} />
            </View>

            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={styles.backBtnText}>Cancelar e voltar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.brand.dark_orange },
  flex:       { flex: 1 },
  scrollView: { backgroundColor: '#fff' },
  scroll:     { flexGrow: 1 },

  hero: {
    backgroundColor: Colors.brand.dark_orange,
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 32,
    gap: 8,
    paddingHorizontal: 24,
  },
  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle:    { fontSize: 24, fontWeight: '800', color: '#fff' },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },

  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 40,
    minHeight: 480,
  },

  form:   { gap: 14 },
  backBtn:{ marginTop: 24, alignItems: 'center' },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
});
