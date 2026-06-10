import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import {
  useAlerta,
  SEVERITY_COLOR,
  SEVERITY_LABEL,
  type AlertaSeveridade,
} from '../context/AlertaContext';

const SEV_ICON: Record<AlertaSeveridade, string> = {
  EMERGENCY:   'warning',
  CRITICAL:    'alert-circle',
  DANGER:      'flame',
  WARNING:     'alert',
  SOLICITATION:'information-circle',
  INFO:        'information-circle-outline',
  OPERATIONAL: 'construct-outline',
};

export function AlertaFloatingBubble() {
  const { floatingAlert, notificationCount, showAlertPopup, pendingPopup } = useAlerta();
  const pathname = usePathname();

  if (!floatingAlert) return null;
  if (pendingPopup) return null;
  const ROTAS_EXCLUIDAS = ['/', '/signup', '/mapa-fullscreen'];
  if (ROTAS_EXCLUIDAS.includes(pathname)) return null;

  const color  = SEVERITY_COLOR[floatingAlert.severidade];
  const icon   = SEV_ICON[floatingAlert.severidade];
  const label  = SEVERITY_LABEL[floatingAlert.severidade];

  return (
    // Wrapper absoluto largura total — permite centralizar a pílula
    <View style={styles.wrapper} pointerEvents="box-none">
      <TouchableOpacity
        style={[styles.pill, { backgroundColor: color }]}
        onPress={() => showAlertPopup(floatingAlert)}
        activeOpacity={0.8}
      >
        <Ionicons name={icon as never} size={16} color="#fff" />
        <Text style={styles.label}>{label}</Text>

        {notificationCount > 1 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {notificationCount > 9 ? '9+' : notificationCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
});
