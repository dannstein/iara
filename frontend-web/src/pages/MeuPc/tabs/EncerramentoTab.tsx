import { useMemo, useState } from 'react';
import { Card, EmptyState, LoadingBlock, Select } from '@/components/ui';
import { useInventoryTransacoes, usePcEventos } from '@/hooks/usePcs';
import { useEvento } from '@/hooks/useEventos';
import type { InventoryTransactionDTO } from '@/types/api';

interface Resumo {
  idTipo: string;
  recebido: number;
  distribuido: number;
  emEstoque: number;
}

export function EncerramentoTab({ pcId }: { pcId: string }) {
  const eventos = usePcEventos(pcId);
  const eventosAceitos = eventos.data?.filter((e) => e.status === 'ACEITO') ?? [];
  const [eventoId, setEventoId] = useState<string>('');

  const transacoes = useInventoryTransacoes(pcId, eventoId || undefined);

  const resumos = useMemo(() => calcularResumos(transacoes.data ?? []), [transacoes.data]);

  if (eventos.isLoading) return <LoadingBlock />;

  if (!eventosAceitos.length) {
    return (
      <EmptyState
        title="Sem eventos aceitos"
        description="O relatório de encerramento fica disponível enquanto o PC estiver operando em algum evento."
      />
    );
  }

  return (
    <>
      <div className="mb-4">
        <label className="form-label mb-1.5 block">Evento</label>
        <Select value={eventoId} onChange={(e) => setEventoId(e.target.value)} className="w-72">
          <option value="">Todos os eventos aceitos</option>
          {eventosAceitos.map((e) => (
            <option key={e.eventoId} value={e.eventoId}>
              {e.eventoId.slice(0, 8)}…
            </option>
          ))}
        </Select>
      </div>

      {eventoId && <EventoBanner eventoId={eventoId} />}

      {transacoes.isLoading ? (
        <LoadingBlock />
      ) : resumos.length === 0 ? (
        <EmptyState title="Sem movimentações" description="Nenhuma transação de inventário registrada." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {resumos.map((r) => (
            <Card key={r.idTipo} className="p-4">
              <p className="data-mono mb-2 text-[11px] text-ink-muted">{r.idTipo.slice(0, 8)}…</p>
              <Row label="Recebido" value={r.recebido} />
              <Row label="Distribuído" value={r.distribuido} />
              <Row label="Em estoque" value={r.emEstoque} highlight />
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function EventoBanner({ eventoId }: { eventoId: string }) {
  const evento = useEvento(eventoId);
  if (!evento.data) return null;
  return (
    <Card className="mb-4 p-4">
      <p className="eyebrow">Evento</p>
      <p className="text-[14px] font-semibold text-ink-primary">{evento.data.titulo}</p>
      <p className="text-[12px] text-ink-muted">
        {evento.data.severidade} · {evento.data.status}
      </p>
    </Card>
  );
}

function Row({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-1.5 last:border-0">
      <span className="text-[12px] text-ink-muted">{label}</span>
      <span
        className={`data-mono text-[14px] font-semibold ${highlight ? 'text-brand-light' : 'text-ink-primary'}`}
      >
        {value}
      </span>
    </div>
  );
}

function calcularResumos(transacoes: InventoryTransactionDTO[]): Resumo[] {
  const byTipo = new Map<string, Resumo>();
  for (const t of transacoes) {
    const r = byTipo.get(t.idTipo) ?? { idTipo: t.idTipo, recebido: 0, distribuido: 0, emEstoque: 0 };
    if (t.operacao === 'RECEIVED') r.recebido += t.quantidade;
    if (t.operacao === 'DISTRIBUTED') r.distribuido += t.quantidade;
    r.emEstoque = r.recebido - r.distribuido;
    byTipo.set(t.idTipo, r);
  }
  return Array.from(byTipo.values()).sort((a, b) => b.emEstoque - a.emEstoque);
}
