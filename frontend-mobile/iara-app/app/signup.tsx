import { useState } from 'react';
import {
  Image,
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
import { router } from 'expo-router';

import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAppModal } from '../components/AppModal';
import { Colors } from '../constants/theme';

export default function Signup() {
  const { show, modal } = useAppModal();
  const [nome,           setNome          ] = useState('');
  const [email,          setEmail         ] = useState('');
  const [telefone,       setTelefone      ] = useState('');
  const [senha,          setSenha         ] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading,        setLoading       ] = useState(false);

  async function handleSignUp() {
    if (!nome || !email || !senha || !confirmarSenha) {
      show({ type: 'warning', title: 'Atenção', message: 'Preencha todos os campos obrigatórios.' });
      return;
    }
    if (senha !== confirmarSenha) {
      show({ type: 'error', title: 'Senhas diferentes', message: 'A senha e a confirmação não coincidem.' });
      return;
    }

    setLoading(true);
    try {
      // TODO: implementar chamada ao endpoint de cadastro conforme handout_doc.md
      // Exemplo: await api.post('/auth/mobile/register', { nome, email, telefone, senha });
      show({ type: 'info', title: 'Em breve', message: 'Cadastro ainda não implementado na API.' });
    } catch (error: any) {
      const msg = error.response?.data?.mensagem ?? 'Não foi possível criar a conta.';
      show({ type: 'error', title: 'Erro no cadastro', message: msg });
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Área azul — marca (compacta) ── */}
          <View style={styles.hero}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
            />
            <Text style={styles.brand}>IARA</Text>
          </View>

          {/* ── Card branco — formulário ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Crie sua conta</Text>
            <Text style={styles.cardSubtitle}>Preencha os dados para se cadastrar</Text>

            <View style={styles.form}>
              <Input
                placeholder="Nome completo"
                autoCapitalize="words"
                onChangeText={setNome}
              />
              <Input
                placeholder="E-mail"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={setEmail}
              />
              <Input
                placeholder="Telefone (opcional)"
                keyboardType="phone-pad"
                onChangeText={setTelefone}
              />
              <Input
                placeholder="Senha"
                secureTextEntry
                onChangeText={setSenha}
              />
              <Input
                placeholder="Confirmar senha"
                secureTextEntry
                onChangeText={setConfirmarSenha}
              />
              <Button
                label={loading ? 'Cadastrando...' : 'Cadastrar'}
                onPress={handleSignUp}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                <Text style={styles.footerLink}>Entre aqui.</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.blue.dark },
  flex:  { flex: 1 },
  scroll:{ flexGrow: 1 },

  // Área azul — mais compacta que o login (tem mais campos)
  hero: {
    backgroundColor: Colors.blue.dark,
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 28,
    gap: 2,
  },
  logo: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
  },
  brand: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brand.orange,
    letterSpacing: 4,
    marginTop: 2,
  },

  // Card branco
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 40,
    minHeight: 520,
  },
  cardTitle:    { fontSize: 24, fontWeight: '800', color: Colors.blue.dark },
  cardSubtitle: { fontSize: 14, color: '#64748B', marginTop: 4, marginBottom: 4 },

  form: { marginTop: 20, gap: 12 },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: { fontSize: 14, color: '#64748B' },
  footerLink: { fontSize: 14, fontWeight: '700', color: Colors.blue.medium },
});
