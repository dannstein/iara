// ── Notificações nativas desativadas ─────────────────────────────────────────
// expo-notifications foi desinstalado para evitar a notificação automática que
// o Expo Go gera ao detectar o pacote instalado (DevicePushTokenAutoRegistration).
// O sistema de alertas in-app (glow, popup, balão flutuante) cobre o foreground.
//
// Para reativar no futuro:
//   1. npx expo install expo-notifications
//   2. Restaurar plugin em app.json (ver comentário lá)
//   3. Descomentar código em _layout.tsx (TODO: notificações nativas)
//   4. Descomentar import e chamada em AlertaContext.tsx (TODO: notificações nativas)
//   5. Descomentar bloco abaixo

/*
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

export async function setupNotificationChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('alertas-iara', {
    name:             'Alertas IARA',
    importance:       Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    sound:            'default',
    enableLights:     true,
    lightColor:       '#FF5001',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const { status: asked } = await Notifications.requestPermissionsAsync();
  return asked === 'granted';
}

export async function getExpoPushToken(): Promise<string | null> {
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
}

export async function scheduleAlertNotification(
  title: string,
  body: string,
  alertaId: string,
  severidade: string,
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data:  { alertaId },
      sound: 'default',
      badge: 1,
      ...(Platform.OS === 'android' && { channelId: 'alertas-iara' }),
    },
    trigger: null,
  });
}
*/

// Stubs vazios — mantêm os imports existentes funcionando sem o pacote instalado.
export async function setupNotificationChannel() {}
export async function requestNotificationPermission(): Promise<boolean> { return false; }
export async function getExpoPushToken(): Promise<string | null> { return null; }
export async function scheduleAlertNotification(
  _title: string, _body: string, _alertaId: string, _severidade: string,
) {}
