import { MapContainer, TileLayer, Circle, GeoJSON, CircleMarker } from 'react-leaflet';
import type { GeoJsonObject } from 'geojson';
import type { AlertaDTO } from '@/types/api';
import { SEVERITY } from './severity';

const TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_CENTER: [number, number] = [-23.0264, -45.5556];

interface Props {
  alerta: AlertaDTO;
  height?: number;
}

/** Mini-mapa que mostra a cobertura do alerta (ponto+raio, área GeoJSON ou apenas marcador). */
export function AlertCoverageMap({ alerta, height = 240 }: Props) {
  const color = SEVERITY[alerta.severidade].color;
  const center: [number, number] = alerta.coordenadas
    ? [alerta.coordenadas.lat, alerta.coordenadas.lng]
    : DEFAULT_CENTER;

  const hasGeometry = !!alerta.areaAlerta;
  const hasRadius = !!alerta.raioMetros && !!alerta.coordenadas;

  if (!hasGeometry && !hasRadius && !alerta.coordenadas) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded-lg border border-white/5 bg-bg-primary text-[12px] text-ink-muted"
      >
        Alerta sem cobertura geográfica
      </div>
    );
  }

  const zoom = hasRadius && alerta.raioMetros! > 10_000 ? 9 : hasRadius ? 12 : 13;

  return (
    <div style={{ height }} className="overflow-hidden rounded-lg border border-white/5">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer url={TILE_URL} attribution="© OpenStreetMap" />
        {hasGeometry && (
          <GeoJSON
            data={alerta.areaAlerta as GeoJsonObject}
            style={{ color, fillColor: color, fillOpacity: 0.15, weight: 2, dashArray: '6 4' }}
          />
        )}
        {hasRadius && (
          <Circle
            center={center}
            radius={alerta.raioMetros!}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.08,
              weight: 2,
              dashArray: '6 4',
            }}
          />
        )}
        {alerta.coordenadas && (
          <CircleMarker
            center={center}
            radius={8}
            pathOptions={{ color, fillColor: color, fillOpacity: 1, weight: 2 }}
          />
        )}
      </MapContainer>
    </div>
  );
}
