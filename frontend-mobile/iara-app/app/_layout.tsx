import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { Colors } from '../constants/theme';

// ── AuthGate ─────────────────────────────────────────────────
// Bloqueia o Stack até o auth terminar de carregar. Garante que
// o tab navigator e o MapView sejam montados uma única vez com
// o role já conhecido — evita o crash Android "addViewAt".

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.blue.dark,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

// ── Root Layout ───────────────────────────────────────────────

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="mapa-fullscreen" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
          {/* Sub-telas de Locais */}
          <Stack.Screen name="pontos-coleta" />
          <Stack.Screen name="abrigos" />
          <Stack.Screen name="hospitais" />
          <Stack.Screen name="pontos-apoio" />
          <Stack.Screen name="ponto-apoio-detalhe" />
          {/* Detalhe do ponto de coleta + histórico */}
          <Stack.Screen name="ponto-coleta-detalhe" />
          <Stack.Screen name="mural-necessidades" />
          <Stack.Screen name="evento-detalhe" />
          <Stack.Screen name="historico-doacoes" />
          <Stack.Screen name="solicitacoes" />
          <Stack.Screen name="fixados" />
        </Stack>
      </AuthGate>
    </AuthProvider>
  );
}
