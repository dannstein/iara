import type { AckSummaryDTO } from '@/types/api';

interface Props {
  summary: AckSummaryDTO | null | undefined;
  total: number;
  /** Mínimo de aceites configurado no alerta; se preenchido, mostra a meta. */
  ackMinimo?: number | null;
}

/** Barra empilhada: ACKNOWLEDGED + ACCEPTED (verde), REFUSED (laranja), FAILED (vermelho), restante (cinza). */
export function AckProgressBar({ summary, total, ackMinimo }: Props) {
  if (!summary || total <= 0) {
    return (
      <div className="rounded-md bg-white/[0.04] px-3 py-2 text-[11px] text-ink-muted">
        Sem destinatários
      </div>
    );
  }
  const ack = summary.acknowledged + summary.accepted;
  const refused = summary.refused;
  const failed = summary.failed;
  const unavailable = summary.unavailable;
  const responded = ack + refused + unavailable;
  const pendentes = Math.max(0, total - responded - failed);

  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  return (
    <div className="space-y-1.5">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/[0.04]">
        <div style={{ width: `${pct(ack)}%`, background: '#22C55E' }} />
        <div style={{ width: `${pct(refused)}%`, background: '#F97316' }} />
        <div style={{ width: `${pct(unavailable)}%`, background: '#EAB308' }} />
        <div style={{ width: `${pct(failed)}%`, background: '#EF4444' }} />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-secondary">
        <span className="flex items-center gap-1.5"><Dot color="#22C55E" /> {ack} ack/aceitos</span>
        {refused > 0 && <span className="flex items-center gap-1.5"><Dot color="#F97316" /> {refused} recusados</span>}
        {unavailable > 0 && <span className="flex items-center gap-1.5"><Dot color="#EAB308" /> {unavailable} indisponíveis</span>}
        {failed > 0 && <span className="flex items-center gap-1.5"><Dot color="#EF4444" /> {failed} falhas</span>}
        {pendentes > 0 && <span className="flex items-center gap-1.5"><Dot color="#64748B" /> {pendentes} pendentes</span>}
        {ackMinimo != null && ackMinimo > 0 && (
          <span
            className={`ml-auto font-mono ${ack >= ackMinimo ? 'text-green-400' : 'text-yellow-400'}`}
          >
            Meta: {ack}/{ackMinimo}
          </span>
        )}
      </div>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />;
}
