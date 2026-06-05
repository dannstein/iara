import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { apiCached, TTL } from '../lib/cache';
import {
  LeafletMap,
  type MapMarker,
  type MapCircle,
  type MapPolygon,
} from '../components/LeafletMap';

// ── Tipos ────────────────────────────────────────────────────

interface EventoDTO {
  id: string;
  titulo: string;
  status: string;
  severidade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  coordenadas: { lat: number; lng: number };
  raioMetros?: number;
  tipoNome: string;
}

interface PcDTO {
  id: string;
  pcNome: string;
  coordenadas: { lat: number; lng: number };
  pcDesc?: string;
}

interface ZonaRiscoDTO {
  id: string;
  nivelRisco: number;
  coordenadas?: { lat: number; lng: number };
  raioMetros?: number;
  geometria?: object;
  isActive: boolean;
}

interface PontoApoioDTO {
  id: string;
  nome: string;
  coordenadas: { lat: number; lng: number };
  enderecoTxt?: string;
  isActive: boolean;
}

// ── Configuração de camadas ───────────────────────────────────

interface LayerConfig { key: string; label: string; color: string }

const DOADOR_LAYERS: LayerConfig[] = [
  { key: 'eventos',       label: 'Eventos Ativos',   color: '#EF4444'        },
  { key: 'pontos-coleta', label: 'Pontos de Coleta',  color: Colors.blue.dark },
  { key: 'zonas-risco',   label: 'Zonas de Risco',   color: '#EAB308'        },
];

const STAFF_LAYERS: LayerConfig[] = [
  { key: 'eventos',       label: 'Eventos Ativos',   color: '#EF4444'        },
  { key: 'pontos-coleta', label: 'Pontos de Coleta',  color: Colors.blue.dark },
  { key: 'zonas-risco',   label: 'Zonas de Risco',   color: '#EAB308'        },
  { key: 'pontos-apoio',  label: 'Pontos de Apoio',  color: '#F97316'        },
];

const DOADOR_ROLES = new Set(['DOADOR', 'USUARIO_SIMPLES']);

// ── Helpers ───────────────────────────────────────────────────

const SEVERITY_COLOR: Record<string, string> = {
  CRITICA: '#EF4444',
  ALTA:    '#F97316',
  MEDIA:   '#EAB308',
  BAIXA:   '#22C55E',
};

const ZONA_COLOR = (nivel: number) =>
  nivel >= 4 ? '#EF4444' : nivel === 3 ? '#F97316' : nivel === 2 ? '#EAB308' : '#22C55E';

// ── Tela ─────────────────────────────────────────────────────

export default function MapaFullscreen() {
  const { accessToken, role } = useAuth();
  const isDoador = DOADOR_ROLES.has(role ?? '');
  const layers   = isDoador ? DOADOR_LAYERS : STAFF_LAYERS;

  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    () => new Set(layers.map((l) => l.key)),
  );
  const [showLayers, setShowLayers] = useState(false);

  const [eventos,     setEventos    ] = useState<EventoDTO[]>([]);
  const [pcs,         setPcs        ] = useState<PcDTO[]>([]);
  const [zonas,       setZonas      ] = useState<ZonaRiscoDTO[]>([]);
  const [pontosApoio, setPontosApoio] = useState<PontoApoioDTO[]>([]);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${accessToken}` }),
    [accessToken],
  );

  useEffect(() => {
    if (!accessToken) return;

    apiCached<PcDTO[]>('/pontos-coleta?is_active=true', headers, TTL.pontos)
      .then(setPcs).catch(() => {});

    apiCached<ZonaRiscoDTO[]>('/zonas-risco', headers, TTL.zonas)
      .then((data) => setZonas(data.filter((z) => z.isActive))).catch(() => {});

    apiCached<EventoDTO[]>('/eventos', headers, TTL.eventos)
      .then((data) =>
        setEventos(data.filter((e) => e.status !== 'ENCERRADO' && e.status !== 'CANCELADO')),
      ).catch(() => {});

    if (!isDoador) {
      apiCached<PontoApoioDTO[]>('/pontos-apoio', headers, TTL.pontos)
        .then((data) => setPontosApoio(data.filter((p) => p.isActive))).catch(() => {});
    }
  }, [accessToken, headers, isDoador]);

  const toggleFilter = useCallback((key: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleMarkerPress = useCallback((data: { route: string; id: string }) => {
    router.push({ pathname: data.route, params: { id: data.id } } as never);
  }, []);

  const markers: MapMarker[] = useMemo(() => [
    ...(activeFilters.has('pontos-coleta') ? pcs.map((pc) => ({
      lat: pc.coordenadas.lat, lng: pc.coordenadas.lng,
      color: Colors.blue.dark, title: pc.pcNome, description: pc.pcDesc,
      id: pc.id, route: '/ponto-coleta-detalhe',
    })) : []),
    ...(activeFilters.has('eventos') ? eventos.map((ev) => ({
      lat: ev.coordenadas.lat, lng: ev.coordenadas.lng,
      color: SEVERITY_COLOR[ev.severidade] ?? '#64748B',
      title: ev.titulo, description: ev.tipoNome,
      id: ev.id, route: '/evento-detalhe',
    })) : []),
    ...(activeFilters.has('pontos-apoio') ? pontosApoio.map((p) => ({
      lat: p.coordenadas.lat, lng: p.coordenadas.lng,
      color: '#F97316', title: p.nome, description: p.enderecoTxt,
      id: p.id, route: '/ponto-apoio-detalhe',
    })) : []),
  ], [pcs, eventos, pontosApoio, activeFilters]);

  const circles: MapCircle[] = useMemo(() => [
    ...(activeFilters.has('zonas-risco')
      ? zonas.filter((z) => !!z.coordenadas && !!z.raioMetros).map((z) => ({
          lat: z.coordenadas!.lat, lng: z.coordenadas!.lng,
          radius: z.raioMetros!, color: ZONA_COLOR(z.nivelRisco),
        }))
      : []),
    ...(activeFilters.has('eventos')
      ? eventos.filter((ev) => !!ev.raioMetros).map((ev) => ({
          lat: ev.coordenadas.lat, lng: ev.coordenadas.lng,
          radius: ev.raioMetros!, color: SEVERITY_COLOR[ev.severidade] ?? '#64748B',
        }))
      : []),
  ], [zonas, eventos, activeFilters]);

  const polygons: MapPolygon[] = useMemo(() =>
    activeFilters.has('zonas-risco')
      ? zonas.filter((z) => !!z.geometria && !z.raioMetros).map((z) => ({
          geojson: z.geometria!, color: ZONA_COLOR(z.nivelRisco),
        }))
      : [],
    [zonas, activeFilters],
  );

  const hiddenCount = layers.filter((l) => !activeFilters.has(l.key)).length;

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" translucent />

      <LeafletMap
        style={styles.map}
        markers={markers}
        circles={circles}
        polygons={polygons}
        onMarkerPress={handleMarkerPress}
      />

      {/* Overlay: botão fechar + título + botão camadas */}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View pointerEvents="box-none">
          <View style={styles.header} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={[styles.layerBtn, hiddenCount > 0 && styles.layerBtnDimmed]}
              onPress={() => setShowLayers(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="layers-outline" size={16} color={hiddenCount > 0 ? '#F97316' : '#fff'} />
              {hiddenCount > 0 && (
                <View style={styles.layerBadge}>
                  <Text style={styles.layerBadgeText}>{hiddenCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Legenda */}
        <View style={styles.legendContainer} pointerEvents="none">
          <LegendItem color={Colors.blue.dark} label="Ponto de coleta" />
          {!isDoador && <LegendItem color="#F97316" label="Ponto de apoio" />}
          {Object.entries(SEVERITY_COLOR).map(([key, color]) => (
            <LegendItem
              key={key}
              color={color}
              label={
                key === 'CRITICA' ? 'Evento crítico' :
                key === 'ALTA'    ? 'Evento alto'    :
                key === 'MEDIA'   ? 'Evento médio'   : 'Evento baixo'
              }
            />
          ))}
        </View>
      </SafeAreaView>

      {/* Modal de camadas */}
      <Modal
        visible={showLayers}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLayers(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowLayers(false)}>
          <View style={styles.layerCard} onStartShouldSetResponder={() => true}>
            <View style={styles.layerCardHeader}>
              <Ionicons name="layers-outline" size={18} color={Colors.blue.dark} />
              <Text style={styles.layerCardTitle}>Camadas do Mapa</Text>
              <TouchableOpacity onPress={() => setShowLayers(false)} hitSlop={12}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {layers.map((layer, i) => {
              const active = activeFilters.has(layer.key);
              return (
                <TouchableOpacity
                  key={layer.key}
                  style={[styles.layerItem, i < layers.length - 1 && styles.layerItemBorder]}
                  onPress={() => toggleFilter(layer.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.layerSwatch, { backgroundColor: layer.color }]} />
                  <Text style={[styles.layerLabel, !active && styles.layerLabelOff]}>
                    {layer.label}
                  </Text>
                  <View style={[styles.checkbox, active && styles.checkboxActive]}>
                    {active && <Ionicons name="checkmark" size={13} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}

            <View style={styles.layerActions}>
              <TouchableOpacity
                onPress={() => setActiveFilters(new Set(layers.map((l) => l.key)))}
              >
                <Text style={styles.layerAction}>Mostrar todas</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveFilters(new Set())}>
                <Text style={[styles.layerAction, { color: '#EF4444' }]}>Ocultar todas</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

// ── Estilos ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  map:       { flex: 1 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
  layerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
  layerBtnDimmed: { backgroundColor: 'rgba(249,115,22,0.85)' },
  layerBadge: {
    position: 'absolute', top: -3, right: -3,
    backgroundColor: '#fff', borderRadius: 7,
    width: 14, height: 14, alignItems: 'center', justifyContent: 'center',
  },
  layerBadgeText: { fontSize: 9, fontWeight: '800', color: '#F97316' },

  legendContainer: {
    margin: 16, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    gap: 4,
  },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot:   { width: 10, height: 10, borderRadius: 5 },
  legendText:  { fontSize: 12, color: '#1E293B', fontWeight: '500' },

  // Modal camadas
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  layerCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  layerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  layerCardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1E293B' },
  layerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  layerItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  layerSwatch:     { width: 12, height: 12, borderRadius: 6 },
  layerLabel:      { flex: 1, fontSize: 14, color: '#1E293B', fontWeight: '500' },
  layerLabelOff:   { color: '#94A3B8' },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: '#CBD5E1',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  checkboxActive: {
    backgroundColor: Colors.blue.dark,
    borderColor: Colors.blue.dark,
  },
  layerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  layerAction: { fontSize: 12, fontWeight: '600', color: Colors.blue.medium },
});
