import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Network from 'expo-network';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { AlertaProvider } from '../context/AlertaContext';
import { AlertaGlowOverlay } from '../components/AlertaGlowOverlay';
import { AlertaPopup } from '../components/AlertaPopup';
import { AlertaFloatingBubble } from '../components/AlertaFloatingBubble';
import { OfflineSnackbar } from '../components/OfflineSnackbar';
import { setOffline } from '../lib/offlineState';
import { Colors } from '../constants/theme';

// TODO: notificações nativas — reativar quando o sistema de push estiver pronto.
// Descomentar os imports abaixo e restaurar NotificationSetup + setupNotificationChannel().
/*
import { LogBox } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  setupNotificationChannel,
  requestNotificationPermission,
  getExpoPushToken,
} from '../lib/notifications';
import { api } from '../services/api';

LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);
setupNotificationChannel();

function NotificationSetup() {
  const { accessToken } = useAuth();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    if (!accessToken) return;

    (async () => {
      const granted = await requestNotificationPermission();
      if (!granted) return;
      const token = await getExpoPushToken();
      if (!token) return;
      api.put('/usuarios/me', { expoPushToken: token }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => {});
    })();

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const alertaId = response.notification.request.content.data?.alertaId as string | undefined;
        if (alertaId) {
          router.push({ pathname: '/alerta-detalhe', params: { id: alertaId } } as never);
        }
      },
    );

    return () => { responseListener.current?.remove(); };
  }, [accessToken]);

  return null;
}
*/

// ── NetworkMonitor ────────────────────────────────────────────
// Listener ativo dentro do ciclo React — o bridge nativo já está
// pronto aqui, ao contrário de chamadas no nível do módulo.

function NetworkMonitor() {
  useEffect(() => {
    Network.getNetworkStateAsync().then(({ isConnected }) => {
      setOffline(isConnected === false);
    });

    const sub = Network.addNetworkStateListener(({ isConnected }) => {
      setOffline(isConnected === false);
    });

    return () => sub.remove();
  }, []);

  return null;
}

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
      <AlertaProvider>
        <NetworkMonitor />
        <AuthGate>
          {/* TODO: notificações nativas — descomentar quando push estiver pronto:
          <NotificationSetup /> */}
          <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="signup" />
              <Stack.Screen name="triagem" />
              <Stack.Screen name="signup-doador" />
              <Stack.Screen name="signup-voluntario" />
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
              {/* Alertas */}
              <Stack.Screen name="alertas" />
              <Stack.Screen name="alerta-detalhe" />
            </Stack>

            {/* Overlays globais de alertas in-app — sempre ativos */}
            <AlertaGlowOverlay />
            <AlertaPopup />
            <AlertaFloatingBubble />
            <OfflineSnackbar />
          </View>
        </AuthGate>
      </AlertaProvider>
    </AuthProvider>
  );
}
