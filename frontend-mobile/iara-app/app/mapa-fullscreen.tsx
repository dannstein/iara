import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import { ChipBar, type ChipOption } from '../components/ChipBar';

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

const DOADOR_ROLES = new Set(['DOADOR', 'USUARIO_SIMPLES']);

const DOADOR_CHIPS: ChipOption[] = [
  { key: 'eventos',       label: 'Eventos'           },
  { key: 'pontos-coleta', label: 'Pontos de Coleta'  },
  { key: 'zonas-risco',   label: 'Zonas de Risco'    },
];

const STAFF_CHIPS: ChipOption[] = [
  { key: 'eventos',       label: 'Eventos'           },
  { key: 'pontos-coleta', label: 'Pontos de Coleta'  },
  { key: 'zonas-risco',   label: 'Zonas de Risco'    },
  { key: 'pontos-apoio',  label: 'Pontos de Apoio'   },
];

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
// O mapa fullscreen exibe as MESMAS camadas que o mini mapa da home.
// A única diferença é o tamanho (tela cheia).
//
// Camadas para todos os roles:
//   • Eventos ativos — markers (epicentro) + circles (raio)
//   • Zonas de risco — circles (ponto+raio) ou polygons (GeoJSON)
//   • Pontos de coleta ativos — markers azuis

export default function MapaFullscreen() {
  const { accessToken, role } = useAuth();
  const isDoador = DOADOR_ROLES.has(role ?? '');
  const chips    = isDoador ? DOADOR_CHIPS : STAFF_CHIPS;

  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    () => new Set(chips.map((c) => c.key)),
  );

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

      {/* Overlay: botão fechar + título + chips */}
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
            <View style={styles.titlePill}>
              <Text style={styles.titleText}>Mapa de Ocorrências</Text>
            </View>
          </View>

          {/* Chips de filtro */}
          <View style={styles.chipsWrapper} pointerEvents="box-none">
            <ChipBar
              options={chips}
              selectedKeys={[...activeFilters]}
              onToggle={toggleFilter}
            />
          </View>
        </View>

        {/* Legenda */}
        <View style={styles.legendContainer} pointerEvents="none">
          <LegendItem color={Colors.blue.dark} label="Ponto de coleta" />
          <LegendItem color="#F97316" label="Ponto de apoio" />
          {!isDoador && Object.entries(SEVERITY_COLOR).map(([key, color]) => (
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
  chipsWrapper: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 24,
    marginHorizontal: 12,
    paddingVertical: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
  titlePill: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  titleText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  legendContainer: {
    margin: 16, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    gap: 4,
  },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot:   { width: 10, height: 10, borderRadius: 5 },
  legendText:  { fontSize: 12, color: '#1E293B', fontWeight: '500' },
});
