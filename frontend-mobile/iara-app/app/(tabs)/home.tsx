import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { LeafletMap, type MapMarker, type MapCircle, type MapPolygon } from '../../components/LeafletMap';
import { ChipBar, type ChipOption } from '../../components/ChipBar';
import { DonateButton } from '../../components/DonateButton';
import { apiCached, TTL } from '../../lib/cache';

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

// ── Constantes ───────────────────────────────────────────────

const DOADOR_ROLES = new Set(['DOADOR', 'USUARIO_SIMPLES']);

const SEVERITY_COLOR: Record<string, string> = {
  CRITICA: '#EF4444',
  ALTA:    '#F97316',
  MEDIA:   '#EAB308',
  BAIXA:   '#22C55E',
};

const ZONA_COLOR = (nivel: number) =>
  nivel >= 4 ? '#EF4444' : nivel === 3 ? '#F97316' : nivel === 2 ? '#EAB308' : '#22C55E';

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

// ── Tela ─────────────────────────────────────────────────────

export default function Home() {
  const { role, email, accessToken } = useAuth();
  const isDoador = DOADOR_ROLES.has(role ?? '');
  const chips    = isDoador ? DOADOR_CHIPS : STAFF_CHIPS;

  // Todos os filtros ativos por padrão
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    () => new Set(chips.map((c) => c.key)),
  );

  const [pcs,         setPcs        ] = useState<PcDTO[]>([]);
  const [zonas,       setZonas      ] = useState<ZonaRiscoDTO[]>([]);
  const [eventos,     setEventos    ] = useState<EventoDTO[]>([]);
  const [pontosApoio, setPontosApoio] = useState<PontoApoioDTO[]>([]);

  const headers = useMemo(() => ({ Authorization: `Bearer ${accessToken}` }), [accessToken]);

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

  // ── Camadas do mapa (filtradas pelos chips ativos) ────────

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

  const displayName = email ? email.split('@')[0] : 'usuário';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={Colors.neutral.gray} />

      {/* Top bar: saudação + botão fullscreen */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greetingLabel}>Bem-vindo,</Text>
          <Text style={styles.greetingName} numberOfLines={1}>{displayName}</Text>
        </View>
        <TouchableOpacity
          style={styles.expandBtn}
          onPress={() => router.push('/mapa-fullscreen' as never)}
          activeOpacity={0.7}
        >
          <Ionicons name="expand-outline" size={20} color={Colors.blue.medium} />
        </TouchableOpacity>
      </View>

      {/* Chips de filtro das camadas */}
      <ChipBar
        options={chips}
        selectedKeys={[...activeFilters]}
        onToggle={toggleFilter}
        style={styles.filterBar}
      />

      {/* Botão de doação — visível apenas para Doador */}
      {isDoador && <DonateButton style={styles.donateBtn} />}

      {/* Mapa ocupa o restante da tela */}
      <View style={styles.mapWrapper}>
        <LeafletMap
          style={styles.map}
          markers={markers}
          circles={circles}
          polygons={polygons}
          onMarkerPress={handleMarkerPress}
        />
      </View>
    </SafeAreaView>
  );
}

// ── Estilos ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.neutral.gray },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  greetingLabel: { fontSize: 13, color: '#64748B' },
  greetingName:  { fontSize: 20, fontWeight: '800', color: Colors.blue.dark, textTransform: 'capitalize', maxWidth: 260 },

  expandBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
  },

  filterBar: { paddingVertical: 8 },

  donateBtn: { marginBottom: 10 },

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
});
