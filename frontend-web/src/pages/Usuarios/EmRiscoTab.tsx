import { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  MapPin,
  Phone,
  RefreshCw,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SectionHeader, StatCard, Skeleton, EmptyState, ErrorState } from '@/components/ui';
import { useUsuariosEmRisco } from '@/hooks/useUsuarios';
import { LocalizacaoModal } from './LocalizacaoModal';
import type {
  UsuarioLocalizacaoDTO,
  ZonaComUsuariosDTO,
  EventoComUsuariosDTO,
} from '@/types/api';

const ROLE_COLOR: Record<string, string> = {
  ADMIN: '#3B82F6',
  GESTOR: '#0F47BC',
  MONITOR: '#8B5CF6',
  COORDENADOR: '#EC4899',
  TECNICO: '#22C55E',
  DOADOR: '#EAB308',
  USUARIO_SIMPLES: '#64748B',
};

const ZONA_TIPO_LABEL: Record<string, string> = {
  ENCHENTE: 'Enchente',
  DESLIZAMENTO: 'Deslizamento',
  INCENDIO: 'Incêndio',
  MULTIPERIGO: 'Multiperigo',
  OUTRO: 'Outro',
};

const ZONA_TIPO_COLOR: Record<string, string> = {
  ENCHENTE: '#3B82F6',
  DESLIZAMENTO: '#F97316',
  INCENDIO: '#EF4444',
  MULTIPERIGO: '#8B5CF6',
  OUTRO: '#64748B',
};

const SEV_COLOR: Record<string, string> = {
  CRITICA: '#EF4444',
  ALTA: '#F97316',
  MEDIA: '#EAB308',
  BAIXA: '#22C55E',
};

type ModalState =
  | { usuario: UsuarioLocalizacaoDTO; context: { type: 'zona'; zona: ZonaComUsuariosDTO } }
  | { usuario: UsuarioLocalizacaoDTO; context: { type: 'evento'; evento: EventoComUsuariosDTO } }
  | null;

export function EmRiscoTab() {
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useUsuariosEmRisco();
  const [expandedZonas, setExpandedZonas] = useState<Set<string>>(new Set());
  const [expandedEventos, setExpandedEventos] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<ModalState>(null);

  function toggleZona(id: string) {
    setExpandedZonas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleEvento(id: string) {
    setExpandedEventos((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const lastUpdate = dataUpdatedAt
    ? formatDistanceToNow(new Date(dataUpdatedAt), { addSuffix: true, locale: ptBR })
    : null;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  const zonas = data?.zonas ?? [];
  const eventos = data?.eventos ?? [];
  const total = data?.totalUsuariosEmRisco ?? 0;
  const totalEmZonas = zonas.reduce((s, z) => s + z.totalUsuarios, 0);
  const totalEmEventos = eventos.reduce((s, e) => s + e.totalUsuarios, 0);

  const isEmpty = total === 0;

  return (
    <div>
      <SectionHeader
        eyebrow="Monitoramento"
        title="Usuários em Área de Risco"
        action={
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/4 px-3 py-1.5 text-[12px] font-medium text-[#94A3B8] transition-colors hover:bg-white/8 hover:text-white"
          >
            <RefreshCw size={12} />
            {lastUpdate ? `Atualizado ${lastUpdate}` : 'Atualizar'}
          </button>
        }
      />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard
          eyebrow="Total"
          title="Usuários em risco"
          value={total}
          icon={<ShieldAlert size={20} />}
          variant={total > 0 ? 'critica' : 'default'}
        />
        <StatCard
          eyebrow="Zonas de Risco"
          title="Em zonas ativas"
          value={totalEmZonas}
          icon={<AlertTriangle size={20} />}
          variant={totalEmZonas > 0 ? 'alta' : 'default'}
        />
        <StatCard
          eyebrow="Eventos Ativos"
          title="No raio de evento"
          value={totalEmEventos}
          icon={<Users size={20} />}
          variant={totalEmEventos > 0 ? 'media' : 'default'}
        />
      </div>

      {isEmpty && (
        <EmptyState
          icon={<ShieldAlert size={40} />}
          title="Nenhum usuário em área de risco"
          description="Não há usuários com localização registrada dentro de zonas de risco ativas ou no raio de eventos ativos."
        />
      )}

      {/* Zonas de Risco */}
      {zonas.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="w-[3px] h-5 rounded-full bg-[#EF4444]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">
              Zonas de Risco
            </span>
            <span className="ml-1 rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30">
              {zonas.length} zona{zonas.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2">
            {zonas.map((zona) => {
              const expanded = expandedZonas.has(zona.zonaId);
              const color = ZONA_TIPO_COLOR[zona.zonaTipo] ?? '#64748B';
              return (
                <div
                  key={zona.zonaId}
                  className="overflow-hidden rounded-xl border bg-[#111827] transition-all duration-200"
                  style={{ borderColor: `${color}30` }}
                >
                  {/* Header */}
                  <button
                    onClick={() => toggleZona(zona.zonaId)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.025]"
                  >
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${color}18`, color }}
                    >
                      <AlertTriangle size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{ background: `${color}18`, color }}
                        >
                          {ZONA_TIPO_LABEL[zona.zonaTipo] ?? zona.zonaTipo}
                        </span>
                        <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wide">
                          Nível {zona.nivelRisco}
                        </span>
                      </div>
                      <p className="text-[14px] font-semibold text-[#F0F4F8] truncate">{zona.zonaNome}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span
                        className="rounded-full px-2.5 py-1 text-[12px] font-semibold"
                        style={{ background: `${color}18`, color }}
                      >
                        {zona.totalUsuarios} usuário{zona.totalUsuarios !== 1 ? 's' : ''}
                      </span>
                      {expanded ? (
                        <ChevronDown size={16} className="text-[#64748B]" />
                      ) : (
                        <ChevronRight size={16} className="text-[#64748B]" />
                      )}
                    </div>
                  </button>

                  {/* User list */}
                  {expanded && (
                    <div className="border-t border-white/5 px-4 py-3 space-y-2 animate-[iara-fadeIn_0.2s_ease]">
                      {zona.usuarios.map((u) => (
                        <UsuarioRow
                          key={u.id}
                          usuario={u}
                          onMapa={() =>
                            setModal({ usuario: u, context: { type: 'zona', zona } })
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Eventos */}
      {eventos.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="w-[3px] h-5 rounded-full bg-[#3B82F6]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">
              Eventos Ativos
            </span>
            <span className="ml-1 rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
              {eventos.length} evento{eventos.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2">
            {eventos.map((evento) => {
              const expanded = expandedEventos.has(evento.eventoId);
              const color = SEV_COLOR[evento.severidade] ?? '#64748B';
              return (
                <div
                  key={evento.eventoId}
                  className="overflow-hidden rounded-xl border bg-[#111827] transition-all duration-200"
                  style={{ borderColor: `${color}30` }}
                >
                  {/* Header */}
                  <button
                    onClick={() => toggleEvento(evento.eventoId)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.025]"
                  >
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${color}18`, color }}
                    >
                      <AlertTriangle size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{ background: `${color}18`, color }}
                        >
                          {evento.severidade}
                        </span>
                        <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wide">
                          {evento.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[14px] font-semibold text-[#F0F4F8] truncate">{evento.eventoTitulo}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[11px] text-[#64748B]">
                        {(evento.raioMetros / 1000).toFixed(1)} km raio
                      </span>
                      <span
                        className="rounded-full px-2.5 py-1 text-[12px] font-semibold"
                        style={{ background: `${color}18`, color }}
                      >
                        {evento.totalUsuarios} usuário{evento.totalUsuarios !== 1 ? 's' : ''}
                      </span>
                      {expanded ? (
                        <ChevronDown size={16} className="text-[#64748B]" />
                      ) : (
                        <ChevronRight size={16} className="text-[#64748B]" />
                      )}
                    </div>
                  </button>

                  {/* User list */}
                  {expanded && (
                    <div className="border-t border-white/5 px-4 py-3 space-y-2 animate-[iara-fadeIn_0.2s_ease]">
                      {evento.usuarios.map((u) => (
                        <UsuarioRow
                          key={u.id}
                          usuario={u}
                          onMapa={() =>
                            setModal({ usuario: u, context: { type: 'evento', evento } })
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Map modal */}
      {modal && (
        <LocalizacaoModal
          usuario={modal.usuario}
          context={modal.context}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function UsuarioRow({
  usuario,
  onMapa,
}: {
  usuario: UsuarioLocalizacaoDTO;
  onMapa: () => void;
}) {
  const color = ROLE_COLOR[usuario.role] ?? '#64748B';
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
        style={{ background: `${color}22`, color }}
      >
        {usuario.nome.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[#F0F4F8] truncate">{usuario.nome}</p>
        <div className="flex items-center gap-2">
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ background: `${color}18`, color }}
          >
            {usuario.role}
          </span>
          {usuario.telefone && (
            <span className="flex items-center gap-1 text-[11px] text-[#64748B]">
              <Phone size={10} />
              {usuario.telefone}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onMapa}
        className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-[rgba(15,71,188,0.3)] bg-[rgba(15,71,188,0.1)] px-2.5 py-1.5 text-[11px] font-semibold text-[#3B82F6] transition-colors hover:bg-[rgba(15,71,188,0.2)]"
      >
        <MapPin size={11} />
        Ver no mapa
      </button>
    </div>
  );
}
