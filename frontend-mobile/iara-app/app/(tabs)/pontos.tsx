import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/theme';

// ── Locais disponíveis ────────────────────────────────────────

const LOCAIS = [
  { route: '/pontos-coleta', title: 'Pontos de Coleta', description: 'Onde entregar doações e materiais',     icon: 'archive-outline'  as const, color: Colors.blue.dark        },
  { route: '/abrigos',       title: 'Abrigos',          description: 'Locais de acolhimento temporário',      icon: 'home-outline'      as const, color: '#8B5CF6'               },
  { route: '/hospitais',     title: 'Hospitais',         description: 'Unidades de saúde e leitos',            icon: 'medkit-outline'    as const, color: '#EF4444'               },
  { route: '/pontos-apoio',  title: 'Pontos de Apoio',  description: 'Infraestrutura da Defesa Civil',         icon: 'location-outline'  as const, color: Colors.brand.orange     },
  { route: '/fixados',       title: 'Fixados',           description: 'Seus locais salvos para acesso rápido', icon: 'bookmark-outline'  as const, color: Colors.brand.dark_orange },
] as const;

// ── Tela ─────────────────────────────────────────────────────

export default function Locais() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={Colors.neutral.gray} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Cabeçalho ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Locais</Text>
          <Text style={styles.headerSub}>Encontre pontos próximos de você</Text>
        </View>

        {/* ── Grid de locais ── */}
        <View style={styles.section}>
          <View style={styles.grid}>
            {LOCAIS.map((local) => (
              <TouchableOpacity
                key={local.route}
                style={styles.card}
                onPress={() => router.push(local.route as never)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconBox, { backgroundColor: `${local.color}18` }]}>
                  <Ionicons name={local.icon} size={28} color={local.color} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{local.title}</Text>
                  <Text style={styles.cardDesc}>{local.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Estilos ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.neutral.gray },
  scroll:   { paddingBottom: 100 },

  header:      { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.blue.dark },
  headerSub:   { fontSize: 13, color: '#64748B', marginTop: 2 },

  section: { paddingHorizontal: 16, paddingTop: 12 },

  grid: { gap: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  iconBox:   { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardText:  { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 3 },
  cardDesc:  { fontSize: 12, color: '#64748B', lineHeight: 17 },
});
