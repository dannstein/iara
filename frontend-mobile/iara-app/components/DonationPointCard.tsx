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
  onPressDetails: () => void;
  onPressNavigate?: () => void;
}

// Chip de prioridade → cor
const PRIORIDADE_COLOR: Record<string, { bg: string; text: string; label: string }> = {
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
  onPressDetails,
  onPressNavigate,
}: DonationPointCardProps) {
  // Mostra no máximo 4 chips, priorizando CRITICA > ALTA > MEDIA > BAIXA
  const topDemandas = [...demandas]
    .sort((a, b) => {
      const order = ['CRITICA', 'ALTA', 'MEDIA', 'BAIXA', 'SUPRIDA'];
      return order.indexOf(a.prioridade) - order.indexOf(b.prioridade);
    })
    .slice(0, 4);

  return (
    <View style={styles.card}>
      {/* Cabeçalho: título + badges */}
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
      </View>

      {/* Contato */}
      <View style={styles.contactRow}>
        <View style={styles.contactInfo}>
          {endereco && (
            <View style={styles.infoLine}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.infoText} numberOfLines={1}>{endereco}</Text>
            </View>
          )}
          {contato && (
            <View style={styles.infoLine}>
              <Ionicons name="call-outline" size={14} color="#6B7280" />
              <Text style={styles.infoText}>{contato}</Text>
            </View>
          )}
        </View>
        {onPressNavigate && (
          <TouchableOpacity style={styles.navBtn} onPress={onPressNavigate}>
            <Ionicons name="navigate-outline" size={22} color={Colors.blue.medium} />
          </TouchableOpacity>
        )}
      </View>

      {/* Chips de demanda */}
      {topDemandas.length > 0 && (
        <View style={styles.demandasSection}>
          <Text style={styles.demandasLabel}>Mais necessário:</Text>
          <View style={styles.chipsRow}>
            {topDemandas.map((d, i) => {
              const cfg = PRIORIDADE_COLOR[d.prioridade] ?? PRIORIDADE_COLOR.BAIXA;
              return (
                <View key={i} style={[styles.chip, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.chipText, { color: cfg.text }]}>{d.tipoNome}</Text>
                  <View style={[styles.chipBadge, { backgroundColor: cfg.text + '22' }]}>
                    <Text style={[styles.chipBadgeText, { color: cfg.text }]}>{cfg.label}</Text>
                  </View>
                </View>
              );
            })}
            {demandas.length > 4 && (
              <View style={[styles.chip, { backgroundColor: '#F3F4F6' }]}>
                <Text style={[styles.chipText, { color: '#6B7280' }]}>+{demandas.length - 4} mais</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Botão Ver Detalhes */}
      <TouchableOpacity style={styles.detailsBtn} onPress={onPressDetails} activeOpacity={0.8}>
        <Text style={styles.detailsBtnText}>Ver detalhes</Text>
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
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.blue.dark,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    flexShrink: 0,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  typeBadge: {
    backgroundColor: '#FFEDD5',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#C2410C',
  },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactInfo: {
    flex: 1,
    gap: 3,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  navBtn: {
    padding: 6,
  },

  demandasSection: {
    gap: 8,
  },
  demandasLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipBadge: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  chipBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  detailsBtn: {
    backgroundColor: Colors.blue.dark,
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  detailsBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
