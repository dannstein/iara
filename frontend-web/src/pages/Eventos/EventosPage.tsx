import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, LayoutGrid, List, Plus } from 'lucide-react';
import {
  SectionHeader,
  Select,
  Skeleton,
  EmptyState,
  ErrorState,
  Button,
} from '@/components/ui';
import { EventoCard } from '@/components/EventoCard';
import { SearchInput } from '@/components/SearchInput';
import { NovoEventoModal } from './NovoEventoModal';
import { useEventos, type EventosFilter } from '@/hooks/useEventos';
import { useDesastreTipos } from '@/hooks/useLookups';
import { useAuthStore, hasRole } from '@/store/authStore';
import type { EventoStatus, Severidade } from '@/types/api';

const STATUS: EventoStatus[] = ['SOLICITADO', 'ATIVO', 'ALERTA_CRITICO', 'ENCERRADO', 'CANCELADO'];
const SEVERIDADES: Severidade[] = ['CRITICA', 'ALTA', 'MEDIA', 'BAIXA'];

export function EventosPage() {
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [novoOpen, setNovoOpen] = useState(false);
  const [search, setSearch] = useState('');
  const tipos = useDesastreTipos();
  const role = useAuthStore((s) => s.user?.role);
  const canCreate = hasRole(role, 'GESTOR');

  const filter: EventosFilter = {
    status: (params.get('status') as EventoStatus) || undefined,
    severidade: (params.get('severidade') as Severidade) || undefined,
    tipo: params.get('tipo') || undefined,
    is_simulado: params.get('is_simulado') === 'true' ? true : undefined,
  };

  const { data, isLoading, isError, refetch } = useEventos(filter);
  const eventos = (data ?? []).filter((e) => e.titulo.toLowerCase().includes(search.toLowerCase()));

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Operações"
        title="Eventos"
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-white/10 p-0.5">
              <button
                onClick={() => setView('grid')}
                className={`flex h-7 w-7 items-center justify-center rounded ${view === 'grid' ? 'bg-white/10 text-white' : 'text-ink-muted'}`}
                aria-label="Visão em grade"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setView('list')}
                className={`flex h-7 w-7 items-center justify-center rounded ${view === 'list' ? 'bg-white/10 text-white' : 'text-ink-muted'}`}
                aria-label="Visão em lista"
              >
                <List size={14} />
              </button>
            </div>
            {canCreate && (
              <Button onClick={() => setNovoOpen(true)}>
                <Plus size={15} /> Novo Evento
              </Button>
            )}
          </div>
        }
      />

      <NovoEventoModal open={novoOpen} onClose={() => setNovoOpen(false)} />

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por título…" className="min-w-[200px]" />
        <Select
          className="w-auto min-w-[150px]"
          value={filter.status ?? ''}
          onChange={(e) => setParam('status', e.target.value)}
        >
          <option value="">Todos os status</option>
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </Select>
        <Select
          className="w-auto min-w-[150px]"
          value={filter.severidade ?? ''}
          onChange={(e) => setParam('severidade', e.target.value)}
        >
          <option value="">Toda severidade</option>
          {SEVERIDADES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select
          className="w-auto min-w-[170px]"
          value={filter.tipo ?? ''}
          onChange={(e) => setParam('tipo', e.target.value)}
        >
          <option value="">Todos os tipos</option>
          {tipos.data?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </Select>
        <Select
          className="w-auto min-w-[140px]"
          value={params.get('is_simulado') ?? ''}
          onChange={(e) => setParam('is_simulado', e.target.value)}
        >
          <option value="">Reais + simulados</option>
          <option value="true">Somente simulados</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState action={<Button variant="secondary" onClick={() => refetch()}>Tentar novamente</Button>} />
      ) : eventos.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle size={40} strokeWidth={1.5} />}
          title="Nenhum evento encontrado"
          description="Ajuste os filtros ou aguarde novos eventos serem registrados."
        />
      ) : (
        <div
          className={
            view === 'grid'
              ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'
              : 'flex flex-col gap-3'
          }
        >
          {eventos.map((ev) => (
            <EventoCard key={ev.id} evento={ev} />
          ))}
        </div>
      )}
    </div>
  );
}
