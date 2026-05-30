import { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

// ── Tipos ────────────────────────────────────────────────────

export type AppModalType = 'info' | 'success' | 'error' | 'warning' | 'confirm';

export interface AppModalConfig {
  type: AppModalType;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
}

// ── Paleta por tipo ───────────────────────────────────────────

const TYPE_STYLE: Record<AppModalType, { color: string; icon: string }> = {
  info:    { color: Colors.blue.dark,       icon: 'information-circle' },
  success: { color: '#22C55E',              icon: 'checkmark-circle'   },
  error:   { color: '#EF4444',              icon: 'close-circle'       },
  warning: { color: Colors.brand.orange,    icon: 'warning'            },
  confirm: { color: Colors.blue.dark,       icon: 'help-circle'        },
};

// ── Componente ────────────────────────────────────────────────

interface AppModalProps extends AppModalConfig {
  visible: boolean;
  onDismiss: () => void;
}

function AppModal({
  visible,
  type,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel  = 'Cancelar',
  onConfirm,
  onDismiss,
}: AppModalProps) {
  const { color, icon } = TYPE_STYLE[type];
  const isConfirm = type === 'confirm';

  async function handleConfirm() {
    onDismiss();
    if (onConfirm) await onConfirm();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Ícone */}
          <View style={[styles.iconCircle, { backgroundColor: `${color}18` }]}>
            <Ionicons name={icon as never} size={34} color={color} />
          </View>

          {/* Textos */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Botões */}
          {isConfirm ? (
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onDismiss}
                activeOpacity={0.75}
              >
                <Text style={styles.cancelText}>{cancelLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: color }]}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.okBtn, { backgroundColor: color }]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.okText}>{confirmLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Hook ──────────────────────────────────────────────────────

interface ModalState extends AppModalConfig {
  visible: boolean;
}

export function useAppModal() {
  const [state, setState] = useState<ModalState | null>(null);

  function show(config: AppModalConfig) {
    setState({ ...config, visible: true });
  }

  function dismiss() {
    setState(null);
  }

  const modal = state ? (
    <AppModal {...state} onDismiss={dismiss} />
  ) : null;

  return { show, modal };
}

// ── Estilos ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,40,100,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },

  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 6,
  },

  btnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  okBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  okText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
