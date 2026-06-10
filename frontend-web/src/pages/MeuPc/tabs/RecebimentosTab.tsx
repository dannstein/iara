import { useState } from 'react';
import { toast } from 'sonner';
import {
  Button,
  DataTable,
  EmptyState,
  Input,
  LoadingBlock,
  Modal,
  type Column,
} from '@/components/ui';
import { useDoacoesPendentesPc, useReceberDoacao } from '@/hooks/usePcs';
import { apiErrorMessage } from '@/lib/api';
import { formatRelative } from '@/lib/utils';
import type { DoacaoDTO } from '@/types/api';

export function RecebimentosTab({ pcId }: { pcId: string }) {
  const doacoes = useDoacoesPendentesPc(pcId);
  const [target, setTarget] = useState<DoacaoDTO | null>(null);

  const columns: Column<DoacaoDTO>[] = [
    {
      key: 'id',
      label: 'Intenção',
      render: (r) => <span className="data-mono text-[11px]">{r.id.slice(0, 8)}…</span>,
    },
    { key: 'qtd', label: 'Quantidade', render: (r) => r.quantidade },
    {
      key: 'expira',
      label: 'Expira',
      render: (r) =>
        r.dataExpiracao ? (
          <span className="text-[12px] text-ink-muted">{formatRelative(r.dataExpiracao)}</span>
        ) : (
          '—'
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <span className="text-[12px]">{r.status}</span>,
    },
    {
      key: 'acoes',
      label: '',
      render: (r) =>
        r.status === 'PENDENTE' ? (
          <Button onClick={() => setTarget(r)}>Marcar recebida</Button>
        ) : (
          <span className="text-[11px] text-ink-muted">—</span>
        ),
    },
  ];

  if (doacoes.isLoading) return <LoadingBlock />;

  return (
    <>
      <DataTable
        title="Intenções pendentes"
        columns={columns}
        rows={doacoes.data ?? []}
        rowKey={(r) => r.id}
        emptyState={
          <EmptyState
            title="Sem intenções"
            description="Quando doadores criarem intenções para suas demandas, elas aparecerão aqui."
          />
        }
      />
      {target && <ReceberModal pcId={pcId} doacao={target} onClose={() => setTarget(null)} />}
    </>
  );
}

function ReceberModal({
  pcId,
  doacao,
  onClose,
}: {
  pcId: string;
  doacao: DoacaoDTO;
  onClose: () => void;
}) {
  const receber = useReceberDoacao(pcId);
  const [qtd, setQtd] = useState(doacao.quantidade - doacao.qtdRecebida);

  function handleConfirmar() {
    receber.mutate(
      { id: doacao.id, qtdRecebida: qtd },
      {
        onSuccess: () => {
          toast.success('Doação registrada. Estoque atualizado.');
          onClose();
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
      },
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Marcar doação recebida"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Voltar
          </Button>
          <Button onClick={handleConfirmar} loading={receber.isPending}>
            Confirmar recebimento
          </Button>
        </>
      }
    >
      <p className="mb-3 text-[13px] text-ink-secondary">
        Intenção de <strong>{doacao.quantidade}</strong> unidades. Já recebidas:{' '}
        <strong>{doacao.qtdRecebida}</strong>.
      </p>
      <label className="form-label mb-1.5 block">Quantidade recebida agora</label>
      <Input
        type="number"
        min={1}
        max={doacao.quantidade - doacao.qtdRecebida}
        value={qtd}
        onChange={(e) => setQtd(Math.max(1, Number(e.target.value)))}
      />
    </Modal>
  );
}
