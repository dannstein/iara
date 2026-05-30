// src/components/CustomTabBar.tsx
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/theme';

export function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.container}>
      {state.routes.filter((route: any) => descriptors[route.key].options.href !== null).map((route: any) => {
        const { options } = descriptors[route.key];
        const label = options.title !== undefined ? options.title : route.name;

        const isFocused = state.routes[state.index]?.key === route.key;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // --- AQUI VOCÊ MUDA OS ÍCONES ---
        let iconName: keyof typeof Ionicons.glyphMap = 'alert-circle';
        
        if (route.name === 'home') {
            iconName = isFocused ? 'home' : 'home-outline';
        } else if (route.name === 'events') {
            iconName = isFocused ? 'thunderstorm' : 'thunderstorm-outline'; 
        } else if (route.name === 'report') {
            iconName = isFocused ? 'warning' : 'warning-outline'; 
        } else if (route.name === 'pontos') {
            iconName = isFocused ? 'map' : 'map-outline';
        } else if (route.name === 'profile') {
            iconName = isFocused ? 'person' : 'person-outline';
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={iconName} 
              size={isFocused ? 28 : 24} // Destaque dinâmico de tamanho
              color={isFocused ? Colors.brand.orange : Colors.brand.white} 
            />
            <Text style={[
                styles.label, 
                { color: isFocused ? Colors.brand.orange : Colors.brand.white }
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.blue.bar, 
    paddingBottom: 12, 
    paddingTop: 16,
    
    // --- O NOVO VISUAL DA BARRA ---
    borderTopWidth: 0, // Remove a bordinha indesejada

    
    // Sombra para destacar a barra do fundo das telas
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabItem: {
    flex: 1, 
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 10, 
    fontWeight: '600',
  }
});