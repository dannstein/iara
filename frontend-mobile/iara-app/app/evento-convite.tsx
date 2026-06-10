import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// ── Constantes ────────────────────────────────────────────────

const SEVERIDADE_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  CRITICA: { color: '#DC2626', bg: '#FEE2E2', label: 'Crítico' },
  ALTA:    { color: '#C2410C', bg: '#FFEDD5', label: 'Alto'    },
  MEDIA:   { color: '#A16207', bg: '#FEF9C3', label: 'Médio'   },
  BAIXA:   { color: '#166534', bg: '#DCFCE7', label: 'Baixo'   },
};

// ── Tela ─────────────────────────────────────────────────────

export default function EventoConvite() {
  const { eventoId, titulo, tipoNome, severidade, pcId } =
    useLocalSearchParams<{
      eventoId:   string;
      titulo:     string;
      tipoNome:   string;
      severidade: string;
      pcId:       string;
      pcEventoId: string;
    }>();

  const { accessToken, role } = useAuth();

  const [agreed,  setAgreed ] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState<string | null>(null);

  // Apenas coordenadores acessam esta tela
  if (role && role !== 'COORDENADOR') {
    router.back();
    return null;
  }

  const sev = SEVERIDADE_STYLE[severidade ?? ''] ?? SEVERIDADE_STYLE.MEDIA;

  async function handleAceitar() {
    if (!agreed || loading) return;
    setLoading(true);
    setError(null);
    try {
      await api.patch(
        `/pontos-coleta/${pcId}/eventos/${eventoId}/aceitar`,
        null,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      router.back();
    } catch (err: any) {
      setError(err?.response?.data?.mensagem ?? 'Não foi possível aceitar o convite.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#fff" />

      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={Colors.blue.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Responder ao Convite</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Card — Informações do evento */}
        <View style={styles.card}>
          <View style={[styles.typeBadge, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="alert-circle-outline" size={14} color={Colors.blue.dark} />
            <Text style={[styles.typeBadgeText, { color: Colors.blue.dark }]}>{tipoNome}</Text>
          </View>
          <Text style={styles.eventoTitulo}>{titulo}</Text>
          <View style={[styles.sevBadge, { backgroundColor: sev.bg }]}>
            <Text style={[styles.sevText, { color: sev.color }]}>{sev.label}</Text>
          </View>
        </View>

        {/* Card — Conscientização */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Antes de aceitar, confirme:</Text>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#22C55E" />
            <Text style={styles.checkText}>
              Você está disponível para receber e encaminhar as doações?
            </Text>
          </View>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#22C55E" />
            <Text style={styles.checkText}>
              Seu ponto de coleta está com espaço adequado para armazenar as doações?
            </Text>
          </View>
        </View>

        {/* Checkbox de responsabilidade */}
        <TouchableOpacity
          style={styles.checkboxCard}
          onPress={() => setAgreed((v) => !v)}
          activeOpacity={0.75}
        >
          <Ionicons
            name={agreed ? 'checkbox' : 'checkbox-outline'}
            size={24}
            color={agreed ? Colors.blue.dark : '#94A3B8'}
          />
          <Text style={styles.checkboxText}>
            Estou ciente que sou responsável por administrar o ponto de coleta e as doações que
            receber para encaminhar para os necessitados do{' '}
            <Text style={styles.checkboxTextBold}>{tipoNome}</Text>
          </Text>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={15} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Rodapé fixo */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.aceitarBtn, (!agreed || loading) && styles.aceitarBtnDisabled]}
          onPress={handleAceitar}
          activeOpacity={0.8}
          disabled={!agreed || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.aceitarText}>Aceitar Vinculação</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn:     { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.blue.dark },

  scroll:  { flex: 1 },
  content: { padding: 16, gap: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },

  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typeBadgeText: { fontSize: 12, fontWeight: '700' },

  eventoTitulo: { fontSize: 20, fontWeight: '800', color: '#1E293B' },

  sevBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sevText: { fontSize: 12, fontWeight: '700' },

  sectionLabel: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 4 },

  checkItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkText: { flex: 1, fontSize: 14, color: '#475569', lineHeight: 20 },

  checkboxCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  checkboxText:     { flex: 1, fontSize: 13, color: '#475569', lineHeight: 20 },
  checkboxTextBold: { fontWeight: '700', color: '#1E293B' },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 13, color: '#DC2626' },

  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#64748B' },

  aceitarBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: Colors.blue.dark,
  },
  aceitarBtnDisabled: { backgroundColor: '#94A3B8' },
  aceitarText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
