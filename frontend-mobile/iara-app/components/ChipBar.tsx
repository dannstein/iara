import { ScrollView, StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { Colors } from '../constants/theme';

export interface ChipOption {
  key: string;
  label: string;
}

interface ChipBarProps {
  options: ChipOption[];
  // ── Modo single-select (usado em eventos, detalhes) ─────────
  selected?: string;
  onChange?: (key: string) => void;
  // ── Modo multi-select (usado no mapa da home) ───────────────
  selectedKeys?: string[];
  onToggle?: (key: string) => void;
  /** Estilo do View externo (ex.: paddingVertical) */
  style?: ViewStyle;
}

export function ChipBar({
  options,
  selected,
  onChange,
  selectedKeys,
  onToggle,
  style,
}: ChipBarProps) {
  const isActive = (key: string) =>
    selectedKeys ? selectedKeys.includes(key) : selected === key;

  const handlePress = (key: string) => {
    if (onToggle) onToggle(key);
    else onChange?.(key);
  };

  return (
    <View style={style}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.chip, isActive(opt.key) && styles.chipActive]}
            onPress={() => handlePress(opt.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, isActive(opt.key) && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8, paddingRight: 20 },
  chip:           { backgroundColor: '#F1F5F9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  chipActive:     { backgroundColor: Colors.blue.dark },
  chipText:       { fontSize: 13, fontWeight: '600', color: '#64748B' },
  chipTextActive: { color: '#fff' },
});
