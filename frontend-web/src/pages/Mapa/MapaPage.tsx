import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Popup,
  GeoJSON,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type { GeoJsonObject } from 'geojson';
import { Layers, X, MapPin } from 'lucide-react';
import { SeverityBadge, StatusBadge, Button } from '@/components/ui';
import { useEventos } from '@/hooks/useEventos';
import { usePontosColeta } from '@/hooks/usePontosColeta';
import { useAbrigos } from '@/hooks/useAbrigos';
import { useAlertasMapLayer } from '@/hooks/useAlertas';
import { useZonasRisco } from '@/hooks/useLookups';
import { severidadeConfig, formatRelative } from '@/lib/utils';
import type { EventoDTO } from '@/types/api';

const TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_CENTER: [number, number] = [-23.0264, -45.5556]; // Taubaté/SP (fallback)
const DEFAULT_ZOOM = 11;

interface LayerToggle {
  id: string;
  label: string;
  default: boolean;
}
const LAYERS: LayerToggle[] = [
  { id: 'eventos', label: 'Eventos Ativos', default: true },
  { id: 'pcs', label: 'Pontos de Coleta', default: true },
  { id: 'abrigos', label: 'Abrigos', default: true },
  { id: 'zonas_risco', label: 'Zonas de Risco', default: true },
  { id: 'alertas', label: 'Alertas Ativos', default: true },
];

const POI_COLORS = { pc: '#3B82F6', abrigo: '#8B5CF6' };

/** Ajusta o enquadramento do mapa para conter todos os pontos visíveis. */
function FitBounds({ points, focus }: { points: [number, number][]; focus: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (focus) {
      map.setView(focus, 14, { animate: true });
      return;
    }
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds.pad(0.25), { animate: true });
  }, [points, focus, map]);
  return null;
}

export function MapaPage() {
  const [params] = useSearchParams();
  const focusEventId = params.get('evento');
  const focusZonaId = params.get('zona');

  const [active, setActive] = useState<Record<string, boolean>>(
    Object.fromEntries(LAYERS.map((l) => [l.id, l.default])),
  );
  const [selectedEvento, setSelectedEvento] = useState<EventoDTO | null>(null);
  const [layersOpen, setLayersOpen] = useState(true);

  const eventos = useEventos();
  const pcs = usePontosColeta({ is_active: true });
  const abrigos = useAbrigos({ is_active: true });
  const zonas = useZonasRisco();
  const alertas = useAlertasMapLayer();

  // Eventos "ativos" para o mapa: tudo que não está encerrado/cancelado.
  const eventosVisiveis = useMemo(
    () => (eventos.data ?? []).filter((e) => e.status !== 'ENCERRADO' && e.status !== 'CANCELADO'),
    [eventos.data],
  );

  const focusCoord = useMemo<[number, number] | null>(() => {
    if (focusEventId) {
      const ev = eventos.data?.find((e) => e.id === focusEventId);
      if (ev) return [ev.coordenadas.lat, ev.coordenadas.lng];
    }
    if (focusZonaId) {
      const z = zonas.data?.find((x) => x.id === focusZonaId);
      if (z?.coordenadas) return [z.coordenadas.lat, z.coordenadas.lng];
    }
    return null;
  }, [focusEventId, focusZonaId, eventos.data, zonas.data]);

  // Todos os pontos visíveis → usados para enquadrar o mapa.
  const allPoints = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = [];
    if (active.eventos) eventosVisiveis.forEach((e) => pts.push([e.coordenadas.lat, e.coordenadas.lng]));
    if (active.pcs) pcs.data?.forEach((p) => pts.push([p.coordenadas.lat, p.coordenadas.lng]));
    if (active.abrigos) abrigos.data?.forEach((a) => pts.push([a.coordenadas.lat, a.coordenadas.lng]));
    return pts;
  }, [active, eventosVisiveis, pcs.data, abrigos.data]);

  return (
    <div className="relative h-full w-full">
      <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="h-full w-full" zoomControl>
        <TileLayer url={TILE_URL} attribution="&copy; OpenStreetMap" />
        <FitBounds points={allPoints} focus={focusCoord} />

        {/* Zonas de risco — círculo (ponto+raio) colorido por nível; fallback p/ polígono */}
        {active.zonas_risco &&
          zonas.data?.map((z) => {
            const hex = z.nivelRisco >= 4 ? '#EF4444' : z.nivelRisco === 3 ? '#F97316' : z.nivelRisco === 2 ? '#EAB308' : '#22C55E';
            const style = { color: hex, weight: 1, fillColor: hex, fillOpacity: 0.12 };
            const popup = (
              <Popup>
                <strong>{z.nome}</strong>
                <br />
                {z.tipo} · nível {z.nivelRisco} · {z.situacaoApoio === 'SEM_APOIO' ? 'sem apoio' : 'com apoio'}
              </Popup>
            );
            if (z.coordenadas && z.raioMetros) {
              return (
                <Circle key={z.id} center={[z.coordenadas.lat, z.coordenadas.lng]} radius={z.raioMetros} pathOptions={style}>
                  {popup}
                </Circle>
              );
            }
            return z.geometria ? (
              <GeoJSON key={z.id} data={z.geometria as unknown as GeoJsonObject} style={style}>
                {popup}
              </GeoJSON>
            ) : null;
          })}

        {/* Áreas de alerta */}
        {active.alertas &&
          alertas.data?.map(
            (a) =>
              a.areaAlerta && (
                <GeoJSON
                  key={a.id}
                  data={a.areaAlerta as unknown as GeoJsonObject}
                  style={{ color: '#F97316', weight: 1, dashArray: '4', fillColor: '#F97316', fillOpacity: 0.08 }}
                >
                  <Popup>{a.mensagem}</Popup>
                </GeoJSON>
              ),
          )}

        {/* Eventos — área afetada (polígono areaRisco OU círculo do raio) + ponto central */}
        {active.eventos &&
          eventosVisiveis.map((ev) => {
            const hex = severidadeConfig[ev.severidade].hex;
            const center: [number, number] = [ev.coordenadas.lat, ev.coordenadas.lng];
            const zoneStyle = { color: hex, weight: 2, fillColor: hex, fillOpacity: 0.15 };
            const open = () => setSelectedEvento(ev);
            return (
              <div key={ev.id}>
                {ev.areaRisco ? (
                  <GeoJSON
                    data={ev.areaRisco as unknown as GeoJsonObject}
                    style={zoneStyle}
                    eventHandlers={{ click: open }}
                  >
                    <Popup>
                      <strong>{ev.titulo}</strong>
                      <br />
                      {ev.tipoNome}
                    </Popup>
                  </GeoJSON>
                ) : (
                  ev.raioMetros && (
                    <Circle
                      center={center}
                      radius={ev.raioMetros}
                      pathOptions={zoneStyle}
                      eventHandlers={{ click: open }}
                    >
                      <Popup>
                        <strong>{ev.titulo}</strong>
                        <br />
                        {ev.tipoNome} · {(ev.raioMetros / 1000).toFixed(1)} km de raio
                      </Popup>
                    </Circle>
                  )
                )}
                {/* Epicentro do evento */}
                <CircleMarker
                  center={center}
                  radius={6}
                  pathOptions={{ color: hex, fillColor: hex, fillOpacity: 0.9, weight: 2 }}
                  eventHandlers={{ click: open }}
                />
              </div>
            );
          })}

        {/* PCs */}
        {active.pcs &&
          pcs.data?.map((pc) => (
            <CircleMarker
              key={pc.id}
              center={[pc.coordenadas.lat, pc.coordenadas.lng]}
              radius={7}
              pathOptions={{ color: POI_COLORS.pc, fillColor: POI_COLORS.pc, fillOpacity: 0.8, weight: 2 }}
            >
              <Popup>{pc.pcNome}</Popup>
            </CircleMarker>
          ))}

        {/* Abrigos */}
        {active.abrigos &&
          abrigos.data?.map((ab) => (
            <CircleMarker
              key={ab.id}
              center={[ab.coordenadas.lat, ab.coordenadas.lng]}
              radius={7}
              pathOptions={{ color: POI_COLORS.abrigo, fillColor: POI_COLORS.abrigo, fillOpacity: 0.8, weight: 2 }}
            >
              <Popup>
                {ab.nome} — {ab.ocupacaoAtual}/{ab.capacidadeTotal}
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>

      {/* Toggle de camadas */}
      <div className="absolute right-4 top-4 z-[500]">
        <button
          onClick={() => setLayersOpen((o) => !o)}
          className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-bg-elevated px-3 text-[12px] font-medium text-ink-secondary shadow-md hover:text-ink-primary"
        >
          <Layers size={15} /> Camadas
        </button>
        {layersOpen && (
          <div className="mt-2 w-56 rounded-xl border border-white/10 bg-bg-elevated p-3 shadow-lg">
            {LAYERS.map((l) => (
              <label
                key={l.id}
                className="flex cursor-pointer items-center justify-between py-1.5 text-[12px] text-ink-secondary"
              >
                <span className="flex items-center gap-2">
                  <LayerSwatch id={l.id} />
                  {l.label}
                </span>
                <input
                  type="checkbox"
                  checked={active[l.id]}
                  onChange={(e) => setActive((s) => ({ ...s, [l.id]: e.target.checked }))}
                  className="h-3.5 w-3.5 accent-brand-dark"
                />
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Painel lateral de detalhe do evento */}
      {selectedEvento && (
        <div className="absolute bottom-0 right-0 top-0 z-[500] w-[380px] animate-slide-in overflow-y-auto border-l border-white/10 bg-bg-primary p-6 shadow-2xl">
          <button
            onClick={() => setSelectedEvento(null)}
            className="btn-icon absolute right-4 top-4"
            aria-label="Fechar painel"
          >
            <X size={14} />
          </button>
          <div className="mb-3 mt-1 flex flex-wrap gap-2">
            <SeverityBadge severity={selectedEvento.severidade} />
            <StatusBadge status={selectedEvento.status} />
          </div>
          <h2 className="text-[18px] font-bold text-ink-primary">{selectedEvento.titulo}</h2>
          <p className="mt-1 text-[12px] text-ink-muted">
            {selectedEvento.tipoNome} · {formatRelative(selectedEvento.dataSolicitacao)}
          </p>
          {selectedEvento.descricao && (
            <p className="mt-4 text-[13px] leading-relaxed text-ink-secondary">{selectedEvento.descricao}</p>
          )}
          <div className="mt-4 flex flex-col gap-1.5 text-[12px] text-ink-muted">
            <span className="flex items-center gap-1.5">
              <MapPin size={13} />
              <span className="data-mono">
                {selectedEvento.coordenadas.lat.toFixed(4)}, {selectedEvento.coordenadas.lng.toFixed(4)}
              </span>
            </span>
            {selectedEvento.raioMetros && (
              <span>Raio afetado: {(selectedEvento.raioMetros / 1000).toFixed(1)} km</span>
            )}
          </div>
          <Link to={`/eventos/${selectedEvento.id}`} className="mt-6 block">
            <Button className="w-full">Abrir detalhes do evento</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function LayerSwatch({ id }: { id: string }) {
  const color =
    id === 'eventos'
      ? '#EF4444'
      : id === 'pcs'
        ? POI_COLORS.pc
        : id === 'abrigos'
          ? POI_COLORS.abrigo
          : id === 'zonas_risco'
            ? '#EF4444'
            : '#F97316';
  return <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />;
}
