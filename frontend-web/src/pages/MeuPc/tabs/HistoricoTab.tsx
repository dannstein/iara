import { useState } from 'react';
import { Button, EmptyState, LoadingBlock } from '@/components/ui';
import { usePcHistorico } from '@/hooks/usePcs';
import { formatRelative } from '@/lib/utils';

export function HistoricoTab({ pcId }: { pcId: string }) {
  const [page, setPage] = useState(0);
  const historico = usePcHistorico(pcId, undefined, page, 50);

  if (historico.isLoading) return <LoadingBlock />;
  if (!historico.data?.content.length) {
    return <EmptyState title="Sem histórico" description="Ações no PC aparecerão aqui." />;
  }

  const { content, totalPages } = historico.data;

  return (
    <>
      <ol className="flex flex-col gap-2">
        {content.map((log) => (
          <li
            key={log.id}
            className="rounded-lg border border-white/5 bg-bg-secondary px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-ink-primary">{log.acao}</p>
              <span className="text-[11px] text-ink-muted">{formatRelative(log.createdAt)}</span>
            </div>
            {log.payload && Object.keys(log.payload).length > 0 && (
              <pre className="data-mono mt-1 overflow-x-auto rounded bg-bg-primary/50 px-2 py-1 text-[11px] text-ink-muted">
                {JSON.stringify(log.payload, null, 0)}
              </pre>
            )}
          </li>
        ))}
      </ol>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[12px] text-ink-muted">
            Página {page + 1} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
