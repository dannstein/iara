import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldAlert, Plus, Link2, X, Power, MapPin, Map } from 'lucide-react';
import {
  SectionHeader,
  Skeleton,
  EmptyState,
  ErrorState,
  Button,
  Modal,
} from '@/components/ui';
import { NovaZonaRiscoModal } from './NovaZonaRiscoModal';
import { SearchInput } from '@/components/SearchInput';
import {
  useZonasRisco,
  useVincularApoio,
  useDesvincularApoio,
  useDesativarZona,
} from '@/hooks/useZonasRisco';
import { usePontosApoio } from '@/hooks/usePontosApoio';
import { useAuthStore, hasRole } from '@/store/authStore';
import { apiErrorMessage } from '@/lib/api';
import { cn, distanceMeters } from '@/lib/utils';
import type { ZonaRiscoDTO } from '@/types/api';

const nivelColor = (n: number) =>
  n >= 5 ? '#EF4444' : n === 4 ? '#F97316' : n === 3 ? '#F97316' : n === 2 ? '#EAB308' : '#22C55E';

export function ZonasRiscoPage() {
  const { data, isLoading, isError, refetch } = useZonasRisco();
  const [novoOpen, setNovoOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [vincularZona, setVincularZona] = useState<ZonaRiscoDTO | null>(null);
  const canManage = hasRole(useAuthStore((s) => s.user?.role), 'GESTOR');
  const desvincular = useDesvincularApoio();
  const desativar = useDesativarZona();

  // SEM_APOIO primeiro; depois por nível de risco desc. Filtra por busca de nome.
  const zonas = useMemo(() => {
    const list = (data ?? []).filter((z) => z.nome.toLowerCase().includes(search.toLowerCase()));
    list.sort((a, b) => {
      if (a.situacaoApoio !== b.situacaoApoio) return a.situacaoApoio === 'SEM_APOIO' ? -1 : 1;
      return b.nivelRisco - a.nivelRisco;
    });
    return list;
  }, [data, search]);

  return (
    <div>
      <SectionHeader
        eyebrow="Mapeamento"
        title="Zonas de Risco"
        action={
          canManage && (
            <Button onClick={() => setNovoOpen(true)}>
              <Plus size={15} /> Nova Zona
            </Button>
          )
        }
      />

      <NovaZonaRiscoModal open={novoOpen} onClose={() => setNovoOpen(false)} />
      <VincularApoioModal zona={vincularZona} onClose={() => setVincularZona(null)} />

      <div className="mb-5 max-w-xs">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar zona…" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState action={<Button variant="secondary" onClick={() => refetch()}>Tentar novamente</Button>} />
      ) : zonas.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert size={40} strokeWidth={1.5} />}
          title="Nenhuma zona de risco"
          description="Mapeie zonas de risco e vincule pontos de apoio próximos."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {zonas.map((z) => {
            const semApoio = z.situacaoApoio === 'SEM_APOIO';
            return (
              <div
                key={z.id}
                className={cn(
                  'flex flex-col gap-3 rounded-xl border bg-bg-secondary p-4',
                  semApoio ? 'border-yellow-500/60 shadow-[0_0_0_1px_rgba(234,179,8,0.25)]' : 'border-white/[0.08]',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                        style={{ background: `${nivelColor(z.nivelRisco)}22`, color: nivelColor(z.nivelRisco) }}
                      >
                        Nível {z.nivelRisco}
                      </span>
                      <span className="text-[11px] text-ink-secondary">{z.tipo}</span>
                    </div>
                    <h3 className="truncate text-[14px] font-semibold text-ink-primary">{z.nome}</h3>
                  </div>
                  {semApoio ? (
                    <span className="flex-shrink-0 rounded border border-yellow-500/40 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-yellow-400">
                      Sem apoio
                    </span>
                  ) : (
                    <span className="flex-shrink-0 rounded border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-green-400">
                      Com apoio
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                  <MapPin size={11} />
                  {z.raioMetros ? `${(z.raioMetros / 1000).toFixed(1)} km de raio` : 'sem raio'}
                </div>

                {/* Apoios vinculados */}
                <div className="flex flex-col gap-1">
                  {z.apoios.length === 0 ? (
                    <p className="text-[12px] text-ink-muted">Nenhum ponto de apoio vinculado.</p>
                  ) : (
                    z.apoios.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between rounded bg-white/[0.03] px-2 py-1.5 text-[12px]"
                      >
                        <span className="text-ink-secondary">{a.nome}</span>
                        {canManage && (
                          <button
                            onClick={() =>
                              desvincular.mutate(
                                { zonaId: z.id, idApoio: a.id },
                                { onError: (e) => toast.error(apiErrorMessage(e)) },
                              )
                            }
                            className="text-ink-muted hover:text-severity-critica"
                            aria-label="Remover apoio"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-auto flex flex-col gap-2 border-t border-white/5 pt-3">
                  <Link to={`/mapa?zona=${z.id}`} className="w-full">
                    <Button variant="secondary" className="w-full justify-center">
                      <Map size={14} /> Ver no mapa
                    </Button>
                  </Link>
                  {canManage && (
                    <div className="flex gap-2">
                      <Button variant="secondary" className="flex-1 justify-center" onClick={() => setVincularZona(z)}>
                        <Link2 size={14} /> Vincular apoio
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() =>
                          desativar.mutate(z.id, {
                            onSuccess: () => toast.success('Zona desativada; apoios liberados.'),
                            onError: (e) => toast.error(apiErrorMessage(e)),
                          })
                        }
                      >
                        <Power size={14} /> Desativar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function VincularApoioModal({ zona, onClose }: { zona: ZonaRiscoDTO | null; onClose: () => void }) {
  const livres = usePontosApoio(true);
  const vincular = useVincularApoio();
  const raio = zona?.raioMetros ?? 5000;

  const candidatos = (livres.data ?? [])
    .map((p) => ({
      ...p,
      dist: zona?.coordenadas ? distanceMeters(zona.coordenadas, p.coordenadas) : null,
    }))
    .filter((p) => p.dist == null || p.dist <= raio)
    .sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0));

  function add(id: string) {
    if (!zona) return;
    vincular.mutate(
      { zonaId: zona.id, idApoio: id },
      {
        onSuccess: () => toast.success('Ponto de apoio vinculado.'),
        onError: (e) => toast.error(apiErrorMessage(e)),
      },
    );
  }

  return (
    <Modal
      open={!!zona}
      onClose={onClose}
      title="Vincular ponto de apoio"
      eyebrow={zona?.nome}
      icon={<Link2 size={16} />}
    >
      <p className="mb-3 text-[12px] text-ink-muted">
        Apenas pontos de apoio livres dentro do raio da zona ({(raio / 1000).toFixed(1)} km).
      </p>
      {livres.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : candidatos.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-ink-muted">
          Nenhum ponto de apoio livre próximo. Cadastre um na página de Pontos de Apoio.
        </p>
      ) : (
        <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
          {candidatos.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded bg-white/[0.03] px-3 py-2">
              <div>
                <p className="text-[13px] text-ink-primary">{p.nome}</p>
                {p.dist != null && <p className="text-[11px] text-ink-muted">{(p.dist / 1000).toFixed(1)} km</p>}
              </div>
              <Button onClick={() => add(p.id)} loading={vincular.isPending}>
                <Plus size={14} /> Vincular
              </Button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
