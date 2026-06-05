import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useIsOffline } from '../lib/offlineState';

export function OfflineSnackbar() {
  const isOffline = useIsOffline();
  const insets   = useSafeAreaInsets();

  if (!isOffline) return null;

  return (
    // Wrapper absoluto largura total — centraliza a pílula, mesmo padrão da AlertaFloatingBubble
    <View style={[styles.wrapper, { bottom: insets.bottom + 90 }]} pointerEvents="none">
      <View style={styles.pill}>
        <Ionicons name="cloud-offline-outline" size={14} color="#fff" />
        <Text style={styles.text}>Sem conexão · Dados podem estar desatualizados</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 998,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});
