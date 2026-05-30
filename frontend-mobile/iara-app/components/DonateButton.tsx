import { StyleSheet, Text, TouchableOpacity, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/theme';

interface DonateButtonProps {
  style?: ViewStyle;
}

export function DonateButton({ style }: DonateButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.btn, style]}
      onPress={() => router.push('/pontos-coleta' as never)}
      activeOpacity={0.82}
    >
      <Ionicons name="heart-outline" size={18} color="#fff" />
      <Text style={styles.label}>Nova Doação</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.brand.dark_orange,
    borderRadius: 14,
    paddingVertical: 13,
    marginHorizontal: 12,
    elevation: 3,
    shadowColor: Colors.brand.dark_orange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
  },
  label: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
