import { useCallback, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '../constants/theme';
import {
  getPinned,
  togglePin,
  type PinnedLocation,
  type LocalTipo,
} from '../lib/pinnedLocations';

// ── Config por tipo ───────────────────────────────────────────

const TIPO_CFG: Record<LocalTipo, { label: string; icon: string; color: string }> = {
  'ponto-coleta': { label: 'Ponto de Coleta', icon: 'archive-outline',  color: Colors.blue.dark    },
  'abrigo':       { label: 'Abrigo',          icon: 'home-outline',     color: '#8B5CF6'            },
  'hospital':     { label: 'Hospital',         icon: 'medkit-outline',   color: '#EF4444'            },
  'ponto-apoio':  { label: 'Ponto de Apoio',  icon: 'location-outline', color: Colors.brand.orange  },
};

// ── Navegação para o detalhe ──────────────────────────────────

function navigateTo(loc: PinnedLocation) {
  switch (loc.tipo) {
    case 'ponto-coleta':
      router.push({ pathname: '/ponto-coleta-detalhe', params: { id: loc.id } } as never);
      break;
    case 'ponto-apoio':
      router.push({ pathname: '/ponto-apoio-detalhe', params: { id: loc.id } } as never);
      break;
    case 'abrigo':
      router.push('/abrigos' as never);
      break;
    case 'hospital':
      router.push('/hospitais' as never);
      break;
  }
}

// ── Tela ─────────────────────────────────────────────────────

export default function FixadosScreen() {
  const [pinned, setPinned] = useState<PinnedLocation[]>([]);

  useFocusEffect(
    useCallback(() => {
      getPinned().then(setPinned);
    }, []),
  );

  async function handleUnpin(loc: PinnedLocation) {
    await togglePin(loc);
    setPinned((prev) => prev.filter((p) => !(p.id === loc.id && p.tipo === loc.tipo)));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={Colors.neutral.gray} />

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.blue.dark} />
        </TouchableOpacity>
        <View style={styles.topBarText}>
          <Text style={styles.title}>Fixados</Text>
          <Text style={styles.subtitle}>Seus locais salvos</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{pinned.length}</Text>
        </View>
      </View>

      <FlatList
        data={pinned}
        keyExtractor={(i) => `${i.tipo}-${i.id}`}
        contentContainerStyle={pinned.length === 0 ? styles.centerFlex : styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={52} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Nenhum local fixado</Text>
            <Text style={styles.emptyDesc}>
              Abra o detalhe de qualquer local e toque no{' '}
              <Text style={{ color: Colors.brand.dark_orange }}>📌</Text>{' '}
              para fixá-lo aqui.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = TIPO_CFG[item.tipo];
          return (
            <View style={styles.card}>

              {/* Cabeçalho: ícone + info + desfixar */}
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: `${cfg.color}18` }]}>
                  <Ionicons name={cfg.icon as never} size={24} color={cfg.color} />
                </View>

                <View style={styles.cardInfo}>
                  <View style={[styles.tipoBadge, { backgroundColor: `${cfg.color}18` }]}>
                    <Text style={[styles.tipoBadgeText, { color: cfg.color }]}>
                      {cfg.label}
                    </Text>
                  </View>
                  <Text style={styles.cardNome} numberOfLines={2}>{item.nome}</Text>
                  {item.endereco && (
                    <View style={styles.enderecoRow}>
                      <Ionicons name="location-outline" size={12} color="#94A3B8" />
                      <Text style={styles.enderecoText} numberOfLines={1}>{item.endereco}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.unpinBtn}
                  onPress={() => handleUnpin(item)}
                  hitSlop={12}
                  activeOpacity={0.7}
                >
                  <Ionicons name="bookmark" size={22} color={Colors.brand.dark_orange} />
                </TouchableOpacity>
              </View>

              {/* Divisor */}
              <View style={styles.divider} />

              {/* Botão de abrir */}
              <TouchableOpacity
                style={styles.openBtn}
                onPress={() => navigateTo(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.openBtnText}>Ver Detalhes</Text>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

// ── Estilos ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.neutral.gray },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backBtn:     { padding: 4 },
  topBarText:  { flex: 1 },
  title:       { fontSize: 18, fontWeight: '800', color: Colors.blue.dark },
  subtitle:    { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  countBadge:  {
    backgroundColor: Colors.brand.dark_orange,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countText:   { color: '#fff', fontSize: 12, fontWeight: '700' },

  list:        { paddingHorizontal: 16, paddingBottom: 100 },
  centerFlex:  { flex: 1 },
  emptyState:  { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 12 },
  emptyTitle:  { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  emptyDesc:   { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: Colors.brand.dark_orange,
    gap: 10,
  },

  cardHeader:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox:      { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardInfo:     { flex: 1, gap: 4 },
  tipoBadge:    { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  tipoBadgeText:{ fontSize: 10, fontWeight: '700' },
  cardNome:     { fontSize: 15, fontWeight: '700', color: '#1E293B', lineHeight: 20 },
  enderecoRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  enderecoText: { flex: 1, fontSize: 11, color: '#94A3B8' },
  unpinBtn:     { padding: 4 },

  divider: { height: 1, backgroundColor: '#F1F5F9' },

  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.blue.dark,
    borderRadius: 12,
    paddingVertical: 11,
  },
  openBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
