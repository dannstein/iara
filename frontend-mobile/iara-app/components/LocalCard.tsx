import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

// ── Tipos ────────────────────────────────────────────────────

export interface InventarioItem {
  tipoNome: string;
  prioridade: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA' | 'SUPRIDA';
}

export interface LocalCardProps {
  nome: string;
  tipo?: string;
  isVerified?: boolean;
  endereco?: string;
  contato?: string;
  coordenadas?: { lat: number; lng: number };
  inventario?: InventarioItem[];
  onPressDetails: () => void;
}

// ── Helpers ──────────────────────────────────────────────────

const PRIORIDADE_CFG: Record<string, { bg: string; text: string; label: string }> = {
  CRITICA: { bg: '#FEE2E2', text: '#DC2626', label: 'Urgente'    },
  ALTA:    { bg: '#FFEDD5', text: '#C2410C', label: 'Necessário' },
  MEDIA:   { bg: '#FEF9C3', text: '#A16207', label: 'Médio'      },
  BAIXA:   { bg: '#DCFCE7', text: '#166534', label: 'Suficiente' },
  SUPRIDA: { bg: '#F3F4F6', text: '#6B7280', label: 'Suprido'    },
};

function openRoute(coordenadas?: { lat: number; lng: number }) {
  if (!coordenadas) return;
  Linking.openURL(`https://maps.google.com/?q=${coordenadas.lat},${coordenadas.lng}`);
}

// ── Componente ───────────────────────────────────────────────

export function LocalCard({
  nome,
  tipo,
  isVerified,
  endereco,
  contato,
  coordenadas,
  inventario = [],
  onPressDetails,
}: LocalCardProps) {
  // Mostra até 3 itens no preview; resto como "+N"
  const preview  = inventario.slice(0, 3);
  const overflow = inventario.length - preview.length;

  return (
    <View style={styles.card}>

      {/* ── Cabeçalho: badges + nome ── */}
      <View style={styles.header}>
        <View style={styles.badges}>
          {tipo && (
            <View style={styles.tipoBadge}>
              <Text style={styles.tipoBadgeText}>{tipo}</Text>
            </View>
          )}
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={11} color="#16A34A" />
              <Text style={styles.verifiedText}>Verificado</Text>
            </View>
          )}
        </View>
        <Text style={styles.nome} numberOfLines={2}>{nome}</Text>
      </View>

      {/* ── Informações ── */}
      {(endereco || contato) && (
        <View style={styles.infoSection}>
          {endereco && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color="#94A3B8" />
              <Text style={styles.infoText} numberOfLines={2}>{endereco}</Text>
            </View>
          )}
          {contato && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={14} color="#94A3B8" />
              <Text style={styles.infoText}>{contato}</Text>
            </View>
          )}
        </View>
      )}

      {/* ── Prévia do inventário ── */}
      {preview.length > 0 && (
        <View style={styles.inventarioSection}>
          <Text style={styles.inventarioLabel}>Inventário atual:</Text>
          <View style={styles.inventarioRow}>
            {preview.map((item, i) => {
              const cfg = PRIORIDADE_CFG[item.prioridade] ?? PRIORIDADE_CFG.SUPRIDA;
              return (
                <View key={i} style={[styles.invChip, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.invChipText, { color: cfg.text }]} numberOfLines={1}>
                    {item.tipoNome}
                  </Text>
                </View>
              );
            })}
            {overflow > 0 && (
              <View style={styles.invChipMore}>
                <Text style={styles.invChipMoreText}>+{overflow}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* ── Ações ── */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.routeBtn, !coordenadas && styles.routeBtnDisabled]}
          onPress={() => openRoute(coordenadas)}
          activeOpacity={0.8}
          disabled={!coordenadas}
        >
          <Ionicons name="navigate-outline" size={15} color={coordenadas ? Colors.blue.medium : '#CBD5E1'} />
          <Text style={[styles.routeBtnText, !coordenadas && styles.routeBtnTextDisabled]}>
            Obter Rota
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.detailsBtn} onPress={onPressDetails} activeOpacity={0.8}>
          <Text style={styles.detailsBtnText}>Ver Detalhes</Text>
          <Ionicons name="chevron-forward" size={15} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Estilos ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },

  // Cabeçalho
  header: { gap: 6 },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tipoBadge: {
    backgroundColor: '#FFEDD5', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  tipoBadgeText: { fontSize: 10, fontWeight: '700', color: '#C2410C' },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#DCFCE7', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  verifiedText: { fontSize: 10, fontWeight: '700', color: '#16A34A' },
  nome: { fontSize: 16, fontWeight: '800', color: Colors.blue.dark, lineHeight: 22 },

  // Informações
  infoSection: { gap: 5 },
  infoRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  infoText:    { flex: 1, fontSize: 13, color: '#374151', lineHeight: 18 },

  // Inventário
  inventarioSection: { gap: 6 },
  inventarioLabel:   { fontSize: 11, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  inventarioRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  invChip: {
    borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, maxWidth: 140,
  },
  invChipText:     { fontSize: 11, fontWeight: '700' },
  invChipMore:     { backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  invChipMoreText: { fontSize: 11, fontWeight: '700', color: '#64748B' },

  // Ações
  actions: { flexDirection: 'row', gap: 8 },
  routeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 12, paddingVertical: 11,
    borderWidth: 1.5, borderColor: Colors.blue.medium,
  },
  routeBtnDisabled: { borderColor: '#E2E8F0' },
  routeBtnText:     { fontSize: 13, fontWeight: '700', color: Colors.blue.medium },
  routeBtnTextDisabled: { color: '#CBD5E1' },
  detailsBtn: {
    flex: 1.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 12, paddingVertical: 11,
    backgroundColor: Colors.blue.dark,
  },
  detailsBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
