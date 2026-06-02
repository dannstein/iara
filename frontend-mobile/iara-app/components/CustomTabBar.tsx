import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/theme';

// Tab bar height (not counting FAB protrusion above)
const BAR_HEIGHT   = 62;
const ICON_SIZE    = 22;   // same for all normal tabs — only color changes on focus
const FAB_SIZE     = 54;
const LABEL_SIZE   = 10;
const PADDING_BOT  = 10;

// Math: with justifyContent:'flex-end' and paddingBottom:PADDING_BOT
//   text bottom is at PADDING_BOT from container bottom for EVERY tab.
//   FAB circle: PADDING_BOT + labelH(≈14) + gap(4) = 28px from bottom
//               → circle top = 28 + FAB_SIZE = 82px, container is BAR_HEIGHT=62
//               → protrudes 82 - 62 = 20px above bar ✓

export function CustomTabBar({ state, descriptors, navigation }: any) {
  const visibleRoutes = state.routes.filter(
    (route: any) => descriptors[route.key].options.href !== null,
  );

  return (
    <View style={styles.container}>
      {visibleRoutes.map((route: any) => {
        const { options } = descriptors[route.key];
        const label     = options.title ?? route.name;
        const isFocused = state.routes[state.index]?.key === route.key;
        const tint      = isFocused ? Colors.brand.orange : Colors.brand.white;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        // ── FAB central para "report" ─────────────────────────
        if (route.name === 'report') {
          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={styles.tabItem} activeOpacity={0.85}>
              <View style={[styles.fabCircle, isFocused && styles.fabCircleActive]}>
                <Ionicons name="warning" size={24} color="#fff" />
              </View>
              <Text style={[styles.label, { color: tint }]}>{label}</Text>
            </TouchableOpacity>
          );
        }

        // ── Tabs normais ──────────────────────────────────────
        let iconName: keyof typeof Ionicons.glyphMap;
        switch (route.name) {
          case 'home':   iconName = isFocused ? 'home'        : 'home-outline';        break;
          case 'events': iconName = isFocused ? 'thunderstorm': 'thunderstorm-outline'; break;
          case 'pontos': iconName = isFocused ? 'map'         : 'map-outline';          break;
          case 'menu':   iconName = isFocused ? 'menu'        : 'menu-outline';         break;
          default:       iconName = 'alert-circle-outline';
        }

        return (
          <TouchableOpacity key={route.key} onPress={onPress} style={styles.tabItem} activeOpacity={0.7}>
            <Ionicons name={iconName} size={ICON_SIZE} color={tint} />
            <Text style={[styles.label, { color: tint }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: BAR_HEIGHT,
    backgroundColor: Colors.blue.bar,
    overflow: 'visible',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },

  // Todos os tabs usam o mesmo wrapper — flex-end garante que o texto
  // de todos fique na mesma posição vertical (PADDING_BOT do fundo).
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: PADDING_BOT,
    gap: 4,
  },

  label: {
    fontSize: LABEL_SIZE,
    fontWeight: '600',
  },

  // FAB: dimensões fixas, borda da cor da barra para o efeito "saindo"
  fabCircle: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: Colors.brand.dark_orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.blue.bar,
    elevation: 10,
    shadowColor: Colors.brand.dark_orange,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabCircleActive: {
    backgroundColor: Colors.brand.orange,
  },
});
