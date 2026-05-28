import { useNavigate } from 'react-router-dom';
import { MapPin, FlaskConical } from 'lucide-react';
import { SeverityBadge, StatusBadge, SeverityBar } from '@/components/ui';
import { cn, formatRelative } from '@/lib/utils';
import type { EventoDTO } from '@/types/api';

const hoverBySeverity: Record<string, string> = {
  CRITICA: 'border-red-500/25 hover:border-red-500/50 hover:shadow-[0_8px_24px_rgba(239,68,68,0.15)]',
  ALTA: 'border-orange-500/25 hover:border-orange-500/50',
  MEDIA: 'border-yellow-500/25 hover:border-yellow-500/50',
  BAIXA: 'border-white/[0.08] hover:border-white/[0.16]',
};

export function EventoCard({ evento }: { evento: EventoDTO }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/eventos/${evento.id}`)}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-xl bg-bg-secondary border transition-all duration-200 hover:-translate-y-0.5',
        hoverBySeverity[evento.severidade] ?? hoverBySeverity.BAIXA,
      )}
    >
      <SeverityBar severity={evento.severidade} />
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <SeverityBadge severity={evento.severidade} />
              <StatusBadge status={evento.status} />
              {evento.isSimulado && (
                <span className="rounded border border-purple-500/25 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-400">
                  <FlaskConical size={9} className="mr-0.5 inline" />
                  Simulado
                </span>
              )}
            </div>
            <h3 className="truncate text-[14px] font-semibold text-ink-primary">{evento.titulo}</h3>
          </div>
          <span className="flex-shrink-0 text-[11px] text-ink-muted" title={evento.dataSolicitacao}>
            {formatRelative(evento.dataSolicitacao)}
          </span>
        </div>

        <div className="mb-3 flex items-center gap-1.5">
          <span className="text-[12px] text-ink-secondary">{evento.tipoNome}</span>
          {evento.cobradeCod && <span className="data-mono ml-1">{evento.cobradeCod}</span>}
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-3">
          <span className="flex items-center gap-1 text-[11px] text-ink-muted">
            <MapPin size={11} />
            {evento.raioMetros ? `${(evento.raioMetros / 1000).toFixed(1)} km de raio` : 'sem raio'}
          </span>
          <span className="text-[11px] text-ink-muted">▲ {evento.upvotes}</span>
        </div>
      </div>
    </div>
  );
}
