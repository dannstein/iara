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
import * as SecureStore from 'expo-secure-store';

import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAppModal } from '../components/AppModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Colors } from '../constants/theme';

export default function Index() {
  const { refresh } = useAuth();
  const { show, modal } = useAppModal();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSignIn() {
    if (!email || !password) {
      show({ type: 'warning', title: 'Atenção', message: 'Preencha o e-mail e a senha.' });
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/mobile/login', { email, senha: password });
      const { accessToken, role } = response.data;

      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('userData', JSON.stringify(response.data));

      await refresh();
      await new Promise<void>((r) => setTimeout(r, 150));
      router.replace('/(tabs)/home');
    } catch (error: any) {
      const msg = error.response?.data?.mensagem ?? 'Não foi possível conectar ao servidor.';
      show({ type: 'error', title: 'Erro no Login', message: msg });
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
          {/* ── Área azul — marca ── */}
          <View style={styles.hero}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
            />
            <Text style={styles.brand}>IARA</Text>
            <Text style={styles.tagline}>Sistema de Gestão de Desastres</Text>
          </View>

          {/* ── Card branco — formulário ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Acesse sua conta</Text>
            <Text style={styles.cardSubtitle}>Entre com suas credenciais para continuar</Text>

            <View style={styles.form}>
              <Input
                placeholder="E-mail"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={setEmail}
              />
              <Input
                placeholder="Senha"
                secureTextEntry
                onChangeText={setPassword}
              />
              <Button
                label={loading ? 'Entrando...' : 'Entrar'}
                onPress={handleSignIn}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Não tem uma conta? </Text>
              <TouchableOpacity onPress={() => router.push('/triagem' as never)} activeOpacity={0.7}>
                <Text style={styles.footerLink}>Cadastre-se aqui.</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.blue.dark },
  flex:       { flex: 1 },
  scrollView: { backgroundColor: '#fff' },
  scroll:     { flexGrow: 1 },

  // Área azul
  hero: {
    backgroundColor: Colors.blue.dark,
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 40,
    gap: 4,
  },
  logo: {
    width: 110,
    height: 110,
    resizeMode: 'contain',
  },
  brand: {
    fontSize: 52,
    fontWeight: '900',
    color: Colors.brand.orange,
    letterSpacing: 4,
    marginTop: 4,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Card branco
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
    minHeight: 420,
  },
  cardTitle:    { fontSize: 24, fontWeight: '800', color: Colors.blue.dark },
  cardSubtitle: { fontSize: 14, color: '#64748B', marginTop: 4, marginBottom: 8 },

  form: { marginTop: 24, gap: 14 },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: { fontSize: 14, color: '#64748B' },
  footerLink: { fontSize: 14, fontWeight: '700', color: Colors.blue.medium },
});
