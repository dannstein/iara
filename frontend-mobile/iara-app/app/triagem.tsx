import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/theme';

export default function Triagem() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" backgroundColor={Colors.blue.dark} />

      <ScrollView contentContainerStyle={styles.scroll} style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* ── Área azul — marca ── */}
        <View style={styles.hero}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
          />
          <Text style={styles.brand}>IARA</Text>
          <Text style={styles.tagline}>Defesa Civil Digital</Text>
        </View>

        {/* ── Card branco — opções ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Junte-se ao IARA</Text>
          <Text style={styles.cardSubtitle}>
            Como você deseja contribuir com a nossa rede de apoio?
          </Text>

          <View style={styles.options}>

            {/* Doador */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => router.push('/signup-doador' as never)}
              activeOpacity={0.85}
            >
              <View style={[styles.optionIcon, { backgroundColor: `${Colors.brand.dark_orange}18` }]}>
                <Ionicons name="heart" size={32} color={Colors.brand.dark_orange} />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: Colors.brand.dark_orange }]}>
                  Quero Doar!
                </Text>
                <Text style={styles.optionDesc}>
                  Ajude entregando doações e materiais para quem precisa.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>

            {/* Voluntário */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => router.push('/signup-voluntario' as never)}
              activeOpacity={0.85}
            >
              <View style={[styles.optionIcon, { backgroundColor: `${Colors.blue.dark}18` }]}>
                <Ionicons name="shield-checkmark" size={32} color={Colors.blue.dark} />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: Colors.blue.dark }]}>
                  Quero Atuar!
                </Text>
                <Text style={styles.optionDesc}>
                  Cadastre-se como voluntário técnico para ser convocado em emergências.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>

            {/* Ponto de Coleta */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => router.push('/signup-coordenador' as never)}
              activeOpacity={0.85}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#05966918' }]}>
                <Ionicons name="storefront" size={32} color="#059669" />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: '#059669' }]}>
                  Quero ser um Ponto de Coleta!
                </Text>
                <Text style={styles.optionDesc}>
                  Registre seu espaço como ponto de recebimento e distribuição de doações.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>

          </View>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>Já tenho conta. Fazer login.</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.blue.dark },
  scrollView: { backgroundColor: '#fff' },
  scroll:     { flexGrow: 1 },

  hero: {
    backgroundColor: Colors.blue.dark,
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 36,
    gap: 4,
  },
  logo:    { width: 100, height: 100, resizeMode: 'contain' },
  brand:   { fontSize: 48, fontWeight: '900', color: Colors.brand.orange, letterSpacing: 4, marginTop: 4 },
  tagline: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)', letterSpacing: 1, textTransform: 'uppercase' },

  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    minHeight: 440,
  },
  cardTitle:    { fontSize: 22, fontWeight: '800', color: Colors.blue.dark },
  cardSubtitle: { fontSize: 14, color: '#64748B', marginTop: 6, marginBottom: 24, lineHeight: 20 },

  options: { gap: 14 },

  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText:  { flex: 1, gap: 4 },
  optionTitle: { fontSize: 17, fontWeight: '800' },
  optionDesc:  { fontSize: 12, color: '#64748B', lineHeight: 17 },

  backBtn: { marginTop: 28, alignItems: 'center' },
  backBtnText: { fontSize: 14, fontWeight: '600', color: Colors.blue.medium },
});
