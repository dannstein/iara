import { MapContainer, TileLayer, CircleMarker, Circle, Popup, GeoJSON } from 'react-leaflet';
import type { GeoJsonObject } from 'geojson';
import { X, MapPin } from 'lucide-react';
import type { UsuarioLocalizacaoDTO, ZonaComUsuariosDTO, EventoComUsuariosDTO } from '@/types/api';

const TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const ROLE_COLOR: Record<string, string> = {
  ADMIN: '#3B82F6',
  GESTOR: '#0F47BC',
  MONITOR: '#8B5CF6',
  COORDENADOR: '#EC4899',
  TECNICO: '#22C55E',
  DOADOR: '#EAB308',
  USUARIO_SIMPLES: '#64748B',
};

type Context =
  | { type: 'zona'; zona: ZonaComUsuariosDTO }
  | { type: 'evento'; evento: EventoComUsuariosDTO };

interface Props {
  usuario: UsuarioLocalizacaoDTO;
  context: Context;
  onClose: () => void;
}

export function LocalizacaoModal({ usuario, context, onClose }: Props) {
  const { lat, lng } = usuario.localizacao;

  const contextLabel =
    context.type === 'zona'
      ? `${context.zona.zonaNome} — Zona de Risco Nível ${context.zona.nivelRisco}`
      : `${context.evento.eventoTitulo} (${context.evento.severidade})`;

  const overlayColor =
    context.type === 'zona'
      ? { ENCHENTE: '#3B82F6', DESLIZAMENTO: '#F97316', INCENDIO: '#EF4444', MULTIPERIGO: '#8B5CF6', OUTRO: '#64748B' }[
          context.zona.zonaTipo
        ] ?? '#64748B'
      : { CRITICA: '#EF4444', ALTA: '#F97316', MEDIA: '#EAB308', BAIXA: '#22C55E' }[context.evento.severidade] ??
        '#64748B';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgba(7,11,20,0.85)] backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-[0_24px_64px_rgba(0,0,0,0.6)] animate-[iara-fadeIn_0.25s_ease]">
        <div className="h-px bg-gradient-to-r from-transparent via-[#0F47BC]/60 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(15,71,188,0.1)] text-[#3B82F6]">
              <MapPin size={16} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">
                Localização do usuário
              </p>
              <h2 className="text-[15px] font-semibold text-[#F0F4F8]">{usuario.nome}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/6 bg-white/4 text-[#64748B] transition-colors hover:bg-white/8 hover:text-[#94A3B8]"
          >
            <X size={14} />
          </button>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 border-b border-white/5 px-6 py-3">
          <span
            className="rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
            style={{
              background: `${ROLE_COLOR[usuario.role] ?? '#64748B'}22`,
              color: ROLE_COLOR[usuario.role] ?? '#64748B',
            }}
          >
            {usuario.role}
          </span>
          <span className="text-[12px] text-[#64748B]">em</span>
          <span className="text-[12px] font-medium text-[#94A3B8]">{contextLabel}</span>
        </div>

        {/* Map */}
        <div style={{ height: 420 }}>
          <MapContainer
            center={[lat, lng]}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer url={TILE_URL} />

            {/* Zona de risco overlay */}
            {context.type === 'zona' && (
              <ZonaOverlay zona={context.zona} color={overlayColor} />
            )}

            {/* Evento radius overlay */}
            {context.type === 'evento' && (
              <Circle
                center={[context.evento.coordenadas.lat, context.evento.coordenadas.lng]}
                radius={context.evento.raioMetros}
                pathOptions={{ color: overlayColor, fillColor: overlayColor, fillOpacity: 0.08, weight: 2, dashArray: '6 4' }}
              />
            )}

            {/* User marker */}
            <CircleMarker
              center={[lat, lng]}
              radius={10}
              pathOptions={{ color: ROLE_COLOR[usuario.role] ?? '#94A3B8', fillColor: ROLE_COLOR[usuario.role] ?? '#94A3B8', fillOpacity: 0.9, weight: 2 }}
            >
              <Popup>
                <div style={{ minWidth: 140 }}>
                  <strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>{usuario.nome}</strong>
                  <br />
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{usuario.role}</span>
                  {usuario.telefone && (
                    <>
                      <br />
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{usuario.telefone}</span>
                    </>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          </MapContainer>
        </div>

        {/* Coords footer */}
        <div className="border-t border-white/5 px-6 py-3">
          <span className="font-mono text-[11px] text-[#3B82F6]">
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </span>
          <span className="ml-3 text-[11px] text-[#64748B]">última localização conhecida</span>
        </div>
      </div>
    </div>
  );
}

function ZonaOverlay({ zona, color }: { zona: ZonaComUsuariosDTO; color: string }) {
  if (!zona.geometria) return null;
  return (
    <GeoJSON
      key={zona.zonaId}
      data={zona.geometria as GeoJsonObject}
      style={{ color, fillColor: color, fillOpacity: 0.1, weight: 2, dashArray: '6 4' }}
    />
  );
}
