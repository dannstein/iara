import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import {
  useAlerta,
  SEVERITY_COLOR,
  SEVERITY_LABEL,
  CATEGORIA_LABEL,
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

export function AlertaPopup() {
  const { pendingPopup, dismissPopup } = useAlerta();
  const pathname = usePathname();

  if (!pendingPopup) return null;
  const ROTAS_EXCLUIDAS = ['/', '/signup', '/mapa-fullscreen'];
  if (ROTAS_EXCLUIDAS.includes(pathname)) return null;

  const color = SEVERITY_COLOR[pendingPopup.severidade];
  const icon  = SEV_ICON[pendingPopup.severidade];
  const label = SEVERITY_LABEL[pendingPopup.severidade];
  const cat   = CATEGORIA_LABEL[pendingPopup.categoria];
  const title = pendingPopup.titulo ?? cat;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissPopup}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header colorido */}
          <View style={[styles.cardHeader, { backgroundColor: color }]}>
            <Ionicons name={icon as never} size={28} color="#fff" />
            <Text style={styles.severityLabel}>{label}</Text>
          </View>

          {/* Corpo */}
          <View style={styles.cardBody}>
            {/* Badge categoria */}
            <View style={[styles.catBadge, { backgroundColor: `${color}18`, borderColor: `${color}55` }]}>
              <Text style={[styles.catText, { color }]}>{cat}</Text>
            </View>

            <Text style={styles.title} numberOfLines={3}>{title}</Text>
            <Text style={styles.message}>{pendingPopup.mensagem}</Text>
          </View>

          {/* Rodapé */}
          <TouchableOpacity
            style={[styles.okBtn, { backgroundColor: color }]}
            onPress={dismissPopup}
            activeOpacity={0.85}
          >
            <Text style={styles.okText}>OK, entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  severityLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  cardBody: {
    padding: 20,
    gap: 10,
  },
  catBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  catText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 24,
  },
  message: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 21,
  },
  okBtn: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  okText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
