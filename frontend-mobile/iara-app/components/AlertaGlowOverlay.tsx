import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { usePathname } from 'expo-router';
import { useAlerta, SEVERITY_COLOR, type AlertaSeveridade } from '../context/AlertaContext';

const GLOW_SEVERIDADES = new Set<AlertaSeveridade>(['WARNING', 'DANGER', 'CRITICAL', 'EMERGENCY']);

// Espessura do glow proporcional ao nível de severidade
const THICKNESS: Record<AlertaSeveridade, number> = {
  WARNING:     22,
  DANGER:      38,
  CRITICAL:    58,
  EMERGENCY:   78,
  SOLICITATION: 0,
  INFO:         0,
  OPERATIONAL:  0,
};

export function AlertaGlowOverlay() {
  const { pendingPopup, floatingAlert } = useAlerta();
  const pathname = usePathname();

  // O alerta ativo para o glow: popup tem prioridade, senão usa o flutuante
  const activeAlert = pendingPopup ?? floatingAlert;

  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!activeAlert || !GLOW_SEVERIDADES.has(activeAlert.severidade)) {
      opacity.value = withTiming(0, { duration: 400 });
      return;
    }

    if (pendingPopup) {
      // Popup visível: pulsação mais intensa
      opacity.value = withRepeat(
        withTiming(0.8, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      // Só balão flutuante: brilho suave e constante
      opacity.value = withTiming(0.28, { duration: 600 });
    }
  }, [pendingPopup, floatingAlert]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!activeAlert) return null;
  if (!GLOW_SEVERIDADES.has(activeAlert.severidade)) return null;
  const ROTAS_EXCLUIDAS = ['/', '/signup', '/mapa-fullscreen'];
  if (ROTAS_EXCLUIDAS.includes(pathname)) return null;

  const color     = SEVERITY_COLOR[activeAlert.severidade];
  const thickness = THICKNESS[activeAlert.severidade];
  const t         = 'transparent';

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container, animStyle]} pointerEvents="none">
      <LinearGradient colors={[color, t]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: thickness }} />
      <LinearGradient colors={[t, color]}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: thickness }} />
      <LinearGradient colors={[color, t]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
        style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: thickness }} />
      <LinearGradient colors={[t, color]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: thickness }} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { zIndex: 999 },
});
