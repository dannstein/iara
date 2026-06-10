import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useAlerta } from '../../context/AlertaContext';
import { LeafletMap, type MapMarker, type MapCircle, type MapPolygon } from '../../components/LeafletMap';
import { DonateButton } from '../../components/DonateButton';
import { apiCached } from '../../lib/cache';
import { api } from '../../services/api';

// ── Tipos ────────────────────────────────────────────────────

interface EventoDTO {
  id: string;
  tenantId: string;
  titulo: string;
  status: 'SOLICITADO' | 'ATIVO' | 'ALERTA_CRITICO' | 'ENCERRADO' | 'CANCELADO';
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
  isActive: boolean;
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

interface LayerConfig {
  key:   string;
  label: string;
  color: string;
}

const DOADOR_LAYERS: LayerConfig[] = [
  { key: 'eventos',       label: 'Eventos Ativos',  color: '#EF4444'        },
  { key: 'pontos-coleta', label: 'Pontos de Coleta', color: Colors.blue.dark },
  { key: 'zonas-risco',   label: 'Zonas de Risco',  color: '#EAB308'        },
];

const STAFF_LAYERS: LayerConfig[] = [
  { key: 'eventos',       label: 'Eventos Ativos',  color: '#EF4444'        },
  { key: 'pontos-coleta', label: 'Pontos de Coleta', color: Colors.blue.dark },
  { key: 'zonas-risco',   label: 'Zonas de Risco',  color: '#EAB308'        },
  { key: 'pontos-apoio',  label: 'Pontos de Apoio', color: '#F97316'        },
];

const DOADOR_ROLES = new Set(['DOADOR', 'USUARIO_SIMPLES']);

const SEVERITY_COLOR: Record<string, string> = {
  CRITICA: '#EF4444',
  ALTA:    '#F97316',
  MEDIA:   '#EAB308',
  BAIXA:   '#22C55E',
};

const ZONA_COLOR = (nivel: number) =>
  nivel >= 4 ? '#EF4444' : nivel === 3 ? '#F97316' : nivel === 2 ? '#EAB308' : '#22C55E';

// ── Tela ─────────────────────────────────────────────────────

export default function Home() {
  const { role, nome, email, accessToken } = useAuth();
  const { notificationCount, lastAlertAt, refresh: refreshAlertas } = useAlerta();
  const isDoador = DOADOR_ROLES.has(role ?? '');
  const layers   = isDoador ? DOADOR_LAYERS : STAFF_LAYERS;

  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    () => new Set(layers.map((l) => l.key)),
  );
  const [showLayers, setShowLayers] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();

  const [pcs,         setPcs        ] = useState<PcDTO[]>([]);
  const [zonas,       setZonas      ] = useState<ZonaRiscoDTO[]>([]);
  const [eventos,     setEventos    ] = useState<EventoDTO[]>([]);
  const [pontosApoio, setPontosApoio] = useState<PontoApoioDTO[]>([]);

  const headers = useMemo(() => ({ Authorization: `Bearer ${accessToken}` }), [accessToken]);

  // Localização do usuário: centraliza o mapa e sincroniza com o backend
  // para que o geofencing de alertas funcione corretamente.
  useEffect(() => {
    if (!accessToken) return;
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') return;
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        .then((pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          api.put('/usuarios/me', { localizacao: loc }, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }).catch(() => {});
        })
        .catch(() => {});
    }).catch(() => {});
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      if (!accessToken) return;

      refreshAlertas();

      apiCached<PcDTO[]>('/pontos-coleta?is_active=true', headers)
        .then(setPcs).catch(() => {});

      apiCached<ZonaRiscoDTO[]>('/zonas-risco', headers)
        .then((d) => setZonas(d.filter((z) => z.isActive))).catch(() => {});

      apiCached<EventoDTO[]>('/eventos', headers)
        .then((d) => setEventos(d.filter((e) => e.status !== 'ENCERRADO' && e.status !== 'CANCELADO')))
        .catch(() => {});

      if (!isDoador) {
        apiCached<PontoApoioDTO[]>('/pontos-apoio', headers)
          .then((d) => setPontosApoio(d.filter((p) => p.isActive))).catch(() => {});
      }
    }, [accessToken, headers, isDoador, refreshAlertas]),
  );

  // Smart refresh: re-busca eventos e zonas quando qualquer push do backend chega
  useEffect(() => {
    if (!lastAlertAt || !accessToken) return;
    apiCached<EventoDTO[]>('/eventos', headers)
      .then((d) => setEventos(d.filter((e) => e.status !== 'ENCERRADO' && e.status !== 'CANCELADO')))
      .catch(() => {});
    apiCached<ZonaRiscoDTO[]>('/zonas-risco', headers)
      .then((d) => setZonas(d.filter((z) => z.isActive))).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAlertAt]);

  const toggleFilter = useCallback((key: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const handleMarkerPress = useCallback((data: { route: string; id: string }) => {
    router.push({ pathname: data.route, params: { id: data.id } } as never);
  }, []);

  // ── Camadas filtradas ────────────────────────────────────────

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

  const displayName = nome || (email ? email.split('@')[0] : 'usuário');
  const activeCount = layers.filter((l) => !activeFilters.has(l.key)).length; // ocultos

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={Colors.neutral.gray} />

      {/* ── Saudação ── */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greetingLabel}>Bem-vindo,</Text>
          <Text style={styles.greetingName} numberOfLines={1}>{displayName}</Text>
        </View>
        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => router.push('/alertas' as never)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={notificationCount > 0 ? 'notifications' : 'notifications-outline'}
            size={22}
            color={notificationCount > 0 ? Colors.brand.dark_orange : Colors.blue.dark}
          />
          {notificationCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>
                {notificationCount > 9 ? '9+' : notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Botão de doação (Doador only) ── */}
      {isDoador && <DonateButton style={styles.donateBtn} />}

      {/* ── Cabeçalho do mapa ── */}
      <View style={styles.mapHeader}>
        <Text style={styles.mapTitle}>Mapa da Região</Text>
        <View style={styles.mapHeaderBtns}>
          <TouchableOpacity
            style={[styles.layerBtn, activeCount > 0 && styles.layerBtnDimmed]}
            onPress={() => setShowLayers(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="layers-outline" size={16} color={Colors.blue.medium} />
            <Text style={styles.layerBtnText}>
              Camadas{activeCount > 0 ? ` (${activeCount} oculta${activeCount > 1 ? 's' : ''})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.expandBtn}
            onPress={() => router.push('/mapa-fullscreen' as never)}
            activeOpacity={0.7}
          >
            <Ionicons name="expand-outline" size={18} color={Colors.blue.medium} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Mapa ── */}
      <View style={styles.mapWrapper}>
        <LeafletMap
          style={styles.map}
          markers={markers}
          circles={circles}
          polygons={polygons}
          center={userLocation}
          onMarkerPress={handleMarkerPress}
        />
      </View>

      {/* ── Modal de camadas ── */}
      <Modal
        visible={showLayers}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLayers(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowLayers(false)}>
          {/* Card — stopPropagation via onStartShouldSetResponder */}
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
                  {/* Swatch colorido */}
                  <View style={[styles.layerSwatch, { backgroundColor: layer.color }]} />
                  <Text style={[styles.layerLabel, !active && styles.layerLabelOff]}>
                    {layer.label}
                  </Text>
                  {/* Checkbox */}
                  <View style={[styles.checkbox, active && styles.checkboxActive]}>
                    {active && <Ionicons name="checkmark" size={13} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Ações rápidas */}
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
    </SafeAreaView>
  );
}

// ── Estilos ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.neutral.gray },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  greetingLabel: { fontSize: 13, color: '#64748B' },
  greetingName:  { fontSize: 20, fontWeight: '800', color: Colors.blue.dark, textTransform: 'capitalize' },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E2E8F0', elevation: 1,
    marginLeft: 8,
  },
  bellBadge: {
    position: 'absolute', top: -3, right: -3,
    backgroundColor: Colors.brand.dark_orange,
    borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  donateBtn: { marginHorizontal: 12, marginBottom: 8 },

  // Cabeçalho do mapa
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  mapTitle:      { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  mapHeaderBtns: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  layerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: '#E2E8F0', elevation: 1,
  },
  layerBtnDimmed: { borderColor: '#F97316', backgroundColor: '#FFF7ED' },
  layerBtnText:   { fontSize: 12, fontWeight: '600', color: Colors.blue.medium },
  expandBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E2E8F0', elevation: 1,
  },

  // Mapa
  mapWrapper: {
    flex: 1,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
  },
  map: { flex: 1 },

  // Modal de camadas
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
