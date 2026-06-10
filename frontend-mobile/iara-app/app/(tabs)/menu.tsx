import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

// ── Labels de cargo ───────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  DOADOR:          'Doador',
  USUARIO_SIMPLES: 'Usuário',
  COORDENADOR:     'Coordenador',
  TECNICO:         'Técnico',
  MONITOR:         'Monitor',
  GESTOR:          'Gestor',
  ADMIN:           'Administrador',
};

const ROLE_COLOR: Record<string, string> = {
  DOADOR:          '#22C55E',
  USUARIO_SIMPLES: '#64748B',
  COORDENADOR:     '#8B5CF6',
  TECNICO:         '#3B82F6',
  MONITOR:         '#06B6D4',
  GESTOR:          '#F97316',
  ADMIN:           '#EF4444',
};

// ── Item de navegação ─────────────────────────────────────────

interface MenuItem {
  icon: string;
  color: string;
  label: string;
  description: string;
  onPress: () => void;
}

// ── Tela ─────────────────────────────────────────────────────

export default function Menu() {
  const { nome, email, role } = useAuth();

  const displayName = nome || (email ? email.split('@')[0] : 'usuário');
  const roleKey     = role ?? '';
  const roleLabel   = ROLE_LABEL[roleKey] ?? roleKey;
  const roleColor   = ROLE_COLOR[roleKey] ?? '#64748B';
  const initial     = displayName[0]?.toUpperCase() ?? '?';

  const items: MenuItem[] = [
    {
      icon:        'person-circle-outline',
      color:       Colors.blue.dark,
      label:       'Meu Perfil',
      description: 'Informações da conta e logout',
      onPress:     () => router.push('/profile' as never),
    },
    {
      icon:        'shield-checkmark-outline',
      color:       Colors.brand.dark_orange,
      label:       'Solicitações de Serviço',
      description: 'Relatos preventivos enviados à defesa civil',
      onPress:     () => router.push('/solicitacoes' as never),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={Colors.neutral.gray} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu</Text>
      </View>

      {/* Card do usuário */}
      <View style={styles.userCard}>
        <View style={[styles.avatar, { backgroundColor: roleColor }]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
          <View style={[styles.roleBadge, { backgroundColor: `${roleColor}20`, borderColor: `${roleColor}55` }]}>
            <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
          </View>
        </View>
      </View>

      {/* Itens de navegação */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NAVEGAÇÃO</Text>
        {items.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.menuItem, i < items.length - 1 && styles.menuItemBorder]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={item.icon as never} size={22} color={item.color} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuDesc}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ── Estilos ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.neutral.gray },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.blue.dark },

  // Card usuário
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:  { fontSize: 22, fontWeight: '700', color: '#fff' },
  userInfo:    { flex: 1, gap: 6 },
  userName:    { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  roleBadge:   { alignSelf: 'flex-start', borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
  roleText:    { fontSize: 12, fontWeight: '600' },

  // Seção
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },

  // Item
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  menuText:  { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  menuDesc:  { fontSize: 12, color: '#94A3B8', lineHeight: 16 },
});
