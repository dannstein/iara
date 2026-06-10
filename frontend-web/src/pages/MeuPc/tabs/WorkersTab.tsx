import { useState } from 'react';
import { toast } from 'sonner';
import {
  Button,
  DataTable,
  EmptyState,
  LoadingBlock,
  Modal,
  type Column,
} from '@/components/ui';
import { useEncerrarHelper, useHelpers, useWorkerAtividade } from '@/hooks/usePcs';
import { apiErrorMessage } from '@/lib/api';
import { formatRelative } from '@/lib/utils';
import type { HelperDTO } from '@/types/api';

export function WorkersTab({ pcId }: { pcId: string }) {
  const helpers = useHelpers(pcId);
  const encerrar = useEncerrarHelper(pcId);
  const [target, setTarget] = useState<HelperDTO | null>(null);

  const columns: Column<HelperDTO>[] = [
    {
      key: 'id',
      label: 'Worker',
      render: (h) => <span className="data-mono text-[11px]">{h.usuarioId.slice(0, 8)}…</span>,
    },
    { key: 'iniciou', label: 'Iniciado por', render: (h) => h.iniciadoPor },
    { key: 'status', label: 'Status', render: (h) => h.status },
    {
      key: 'acoes',
      label: '',
      render: (h) => (
        <div className="flex gap-1.5">
          <Button variant="secondary" onClick={() => setTarget(h)}>
            Ver atividade
          </Button>
          {h.status === 'CONFIRMADO' && (
            <Button
              variant="danger"
              onClick={() =>
                encerrar.mutate(h.id, {
                  onSuccess: () => toast.success('Worker encerrado.'),
                  onError: (e) => toast.error(apiErrorMessage(e)),
                })
              }
            >
              Encerrar
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (helpers.isLoading) return <LoadingBlock />;

  return (
    <>
      <DataTable
        title="Vínculos com workers"
        columns={columns}
        rows={helpers.data ?? []}
        rowKey={(r) => r.id}
        emptyState={
          <EmptyState
            title="Sem workers"
            description="Convide ou aguarde solicitações de workers para seu PC."
          />
        }
      />
      {target && <AtividadeModal pcId={pcId} helper={target} onClose={() => setTarget(null)} />}
    </>
  );
}

function AtividadeModal({
  pcId,
  helper,
  onClose,
}: {
  pcId: string;
  helper: HelperDTO;
  onClose: () => void;
}) {
  const atividade = useWorkerAtividade(pcId, helper.usuarioId);

  return (
    <Modal
      open
      onClose={onClose}
      title="Atividade do worker"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      {atividade.isLoading ? (
        <p className="text-[13px] text-ink-muted">Carregando…</p>
      ) : !atividade.data?.content.length ? (
        <p className="text-[13px] text-ink-muted">Nenhuma ação registrada.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {atividade.data.content.map((a) => (
            <li key={a.id} className="rounded-lg border border-white/5 px-3 py-2">
              <p className="text-[13px] font-medium text-ink-primary">{a.acao}</p>
              <p className="text-[11px] text-ink-muted">{formatRelative(a.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
