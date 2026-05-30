import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/theme';

// ── Tipos ────────────────────────────────────────────────────

export interface DemandaChip {
  tipoNome: string;
  prioridade: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA' | 'SUPRIDA';
}

export interface DonationPointCardProps {
  title: string;
  type?: string;
  isVerified?: boolean;
  contato?: string;
  endereco?: string;
  demandas?: DemandaChip[];
  distancia?: string;
  onPressDetails: () => void;
  onPressNavigate?: () => void;
}

const URGENCIA: Record<string, { bg: string; text: string; label: string }> = {
  CRITICA: { bg: '#FEE2E2', text: '#DC2626', label: 'Urgente'    },
  ALTA:    { bg: '#FFEDD5', text: '#C2410C', label: 'Necessário' },
  MEDIA:   { bg: '#FEF9C3', text: '#A16207', label: 'Médio'      },
  BAIXA:   { bg: '#DCFCE7', text: '#166534', label: 'Suficiente' },
  SUPRIDA: { bg: '#F3F4F6', text: '#6B7280', label: 'Suprido'    },
};

// ── Componente ───────────────────────────────────────────────

export function DonationPointCard({
  title,
  type,
  isVerified,
  contato,
  endereco,
  demandas = [],
  distancia,
  onPressDetails,
  onPressNavigate,
}: DonationPointCardProps) {
  const inventario = demandas.filter(
    (d) => d.prioridade === 'CRITICA' || d.prioridade === 'ALTA',
  );

  return (
    <View style={styles.card}>

      {/* ── Cabeçalho: título + badges + distância ── */}
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.badges}>
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
              <Text style={styles.verifiedText}>Verificado</Text>
            </View>
          )}
          {type && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{type}</Text>
            </View>
          )}
        </View>
        {distancia && (
          <Text style={styles.distancia}>{distancia}</Text>
        )}
      </View>

      {/* ── Localização + botão navegar ── */}
      {(endereco || onPressNavigate) && (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.locationText} numberOfLines={1}>{endereco ?? '—'}</Text>
          {onPressNavigate && (
            <TouchableOpacity onPress={onPressNavigate} style={styles.navBtn}>
              <Ionicons name="navigate" size={18} color={Colors.blue.medium} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Contato ── */}
      {contato && (
        <View style={styles.infoLine}>
          <Ionicons name="call-outline" size={14} color="#6B7280" />
          <Text style={styles.infoText}>{contato}</Text>
        </View>
      )}

      {/* ── Aceita (tipos que o ponto recebe) ── */}
      {demandas.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Aceita:</Text>
          <View style={styles.chipsRow}>
            {demandas.slice(0, 5).map((d, i) => (
              <View key={i} style={styles.aceitaChip}>
                <Text style={styles.aceitaChipText}>{d.tipoNome}</Text>
              </View>
            ))}
            {demandas.length > 5 && (
              <View style={styles.aceitaChip}>
                <Text style={styles.aceitaChipText}>+{demandas.length - 5}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* ── Inventário Atual (itens urgentes) ── */}
      {inventario.length > 0 && (
        <View style={styles.section}>
          <View style={styles.inventarioHeader}>
            <Ionicons name="cube-outline" size={13} color="#64748B" />
            <Text style={styles.sectionLabel}>Inventário Atual:</Text>
          </View>
          {inventario.slice(0, 3).map((d, i) => {
            const cfg = URGENCIA[d.prioridade];
            return (
              <View key={i} style={styles.inventarioRow}>
                <Text style={styles.inventarioNome}>{d.tipoNome}</Text>
                <View style={[styles.urgenciaBadge, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.urgenciaText, { color: cfg.text }]}>{cfg.label}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* ── Botão Ver Detalhes ── */}
      <TouchableOpacity style={styles.detailsBtn} onPress={onPressDetails} activeOpacity={0.8}>
        <Text style={styles.detailsBtnText}>Ver Detalhes</Text>
        <Ionicons name="chevron-forward" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ── Estilos ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.brand.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    gap: 10,
  },

  // Cabeçalho
  headerRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title:        { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.blue.dark },
  badges:       { flexDirection: 'row', gap: 6, flexShrink: 0 },
  verifiedBadge:{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#DCFCE7', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 },
  verifiedText: { fontSize: 10, fontWeight: '700', color: '#16A34A' },
  typeBadge:    { backgroundColor: '#FFEDD5', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  typeText:     { fontSize: 10, fontWeight: '600', color: '#C2410C' },
  distancia:    { fontSize: 12, fontWeight: '600', color: Colors.blue.medium, flexShrink: 0 },

  // Localização
  locationRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { flex: 1, fontSize: 12, color: '#6B7280' },
  navBtn:       { padding: 4 },

  // Contato
  infoLine:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText:     { fontSize: 12, color: '#6B7280' },

  // Seções
  section:        { gap: 6 },
  sectionLabel:   { fontSize: 12, fontWeight: '600', color: '#374151' },
  chipsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  aceitaChip:     { backgroundColor: '#F1F5F9', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  aceitaChipText: { fontSize: 12, color: '#475569', fontWeight: '500' },

  // Inventário
  inventarioHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  inventarioRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inventarioNome:   { fontSize: 13, color: '#1E293B', fontWeight: '500' },
  urgenciaBadge:    { borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3 },
  urgenciaText:     { fontSize: 11, fontWeight: '700' },

  // Botão
  detailsBtn:     { backgroundColor: Colors.blue.dark, borderRadius: 12, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  detailsBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
