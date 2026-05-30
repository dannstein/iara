import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

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

// ── Tipos ─────────────────────────────────────────────────────

interface UsuarioDTO {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  role: string;
  tenantId: string;
  cadastroSts: string;
  estaDisponivel?: boolean;
}

interface TenantDTO {
  id: string;
  nome: string;
  tipo: string;
  uf: string;
}

// ── Tela ──────────────────────────────────────────────────────

export default function Profile() {
  const { accessToken, role, tenantId } = useAuth();

  const [usuario, setUsuario] = useState<UsuarioDTO | null>(null);
  const [tenant,  setTenant ] = useState<TenantDTO  | null>(null);
  const [loading, setLoading] = useState(true);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${accessToken}` }),
    [accessToken],
  );

  useEffect(() => {
    if (!accessToken) return;

    api.get<UsuarioDTO>('/usuarios/me', { headers })
      .then((res) => setUsuario(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    if (tenantId) {
      // GESTOR+ recebe o nome; DOADOR recebe 403 — silenciamos o erro
      api.get<TenantDTO>(`/tenants/${tenantId}`, { headers })
        .then((res) => setTenant(res.data))
        .catch(() => {});
    }
  }, [accessToken, headers, tenantId]);

  async function handleLogout() {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('userData');
          router.replace('/');
        },
      },
    ]);
  }

  const nome       = usuario?.nome  ?? '';
  const email      = usuario?.email ?? '';
  const initial    = nome  ? nome[0].toUpperCase()
                   : email ? email[0].toUpperCase()
                   : '?';
  const roleKey    = role ?? '';
  const roleLabel  = ROLE_LABEL[roleKey] ?? roleKey;
  const roleColor  = ROLE_COLOR[roleKey] ?? '#64748B';
  const tenantLabel = tenant
    ? `${tenant.nome} · ${tenant.tipo} · ${tenant.uf}`
    : tenantId || '—';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={Colors.neutral.gray} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Avatar + nome + badge de cargo */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: roleColor }]}>
            {loading
              ? <ActivityIndicator color="#fff" size="large" />
              : <Text style={styles.avatarText}>{initial}</Text>
            }
          </View>

          <Text style={styles.nome} numberOfLines={1}>
            {loading ? '…' : nome || '—'}
          </Text>

          <View style={[
            styles.roleBadge,
            { backgroundColor: `${roleColor}20`, borderColor: `${roleColor}55` },
          ]}>
            <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
          </View>
        </View>

        {/* Card de informações */}
        <View style={styles.card}>
          <InfoRow
            icon="mail-outline"
            label="E-mail"
            value={loading ? '…' : email || '—'}
          />
          <Divider />
          <InfoRow
            icon="shield-checkmark-outline"
            label="Cargo"
            value={roleLabel}
            valueColor={roleColor}
          />
          <Divider />
          <InfoRow
            icon="location-outline"
            label="Região"
            value={loading ? '…' : tenantLabel}
          />
        </View>

        {/* Botão de logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Componentes auxiliares ────────────────────────────────────

function InfoRow({
  icon, label, value, valueColor,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as never} size={18} color="#94A3B8" style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text
          style={[styles.infoValue, valueColor ? { color: valueColor, fontWeight: '600' } : null]}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

// ── Estilos ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.neutral.gray },
  scroll:   { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 48 },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    elevation: 5, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18, shadowRadius: 8,
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: '#fff' },
  nome: {
    fontSize: 20, fontWeight: '700',
    color: '#1E293B', marginBottom: 8, textAlign: 'center',
  },
  roleBadge: {
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 4,
  },
  roleText: { fontSize: 13, fontWeight: '600' },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    paddingVertical: 4, marginBottom: 24,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  infoIcon:    { marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: 11, color: '#94A3B8', fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2,
  },
  infoValue: { fontSize: 14, color: '#1E293B', fontWeight: '500' },
  divider:  { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    borderRadius: 12, paddingVertical: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1, borderColor: '#FECACA',
  },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
});
