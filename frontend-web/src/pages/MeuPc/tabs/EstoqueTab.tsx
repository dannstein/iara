import { useState } from 'react';
import { toast } from 'sonner';
import { Card, Button, EmptyState, Input, LoadingBlock, Modal, Select } from '@/components/ui';
import {
  useAjustarEstoque,
  useCapacidades,
  useDistribuir,
  useEstoque,
  useUpsertCapacidade,
} from '@/hooks/usePcs';
import { apiErrorMessage } from '@/lib/api';
import type { EstoqueDTO } from '@/types/api';

type Modo = 'distribuir' | 'ajustar' | 'capacidade';

export function EstoqueTab({ pcId }: { pcId: string }) {
  const estoque = useEstoque(pcId);
  const capacidades = useCapacidades(pcId);
  const [modo, setModo] = useState<Modo | null>(null);
  const [target, setTarget] = useState<EstoqueDTO | null>(null);

  if (estoque.isLoading) return <LoadingBlock />;
  if (!estoque.data?.length) {
    return <EmptyState title="Estoque vazio" description="Quando receber doações, o estoque aparecerá aqui." />;
  }

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {estoque.data.map((item) => {
          const cap = capacidades.data?.find((c) => c.idTipo === item.idTipo);
          return (
            <Card key={item.id} className="p-4">
              <p className="eyebrow">{item.tipoNome}</p>
              <p className="data-mono mt-1 text-[24px] font-bold text-ink-primary">
                {item.quantidade}
              </p>
              {cap && (
                <p className="mt-1 text-[11px] text-ink-muted">
                  Capacidade máx: {cap.qtdMaxima}
                </p>
              )}
              <div className="mt-3 flex gap-1.5">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setTarget(item);
                    setModo('distribuir');
                  }}
                >
                  Distribuir
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setTarget(item);
                    setModo('ajustar');
                  }}
                >
                  Ajustar
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setTarget(item);
                    setModo('capacidade');
                  }}
                >
                  Capacidade
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {modo && target && (
        <EstoqueActionModal
          pcId={pcId}
          modo={modo}
          item={target}
          capacidadeAtual={capacidades.data?.find((c) => c.idTipo === target.idTipo)?.qtdMaxima}
          onClose={() => {
            setModo(null);
            setTarget(null);
          }}
        />
      )}
    </>
  );
}

function EstoqueActionModal({
  pcId,
  modo,
  item,
  capacidadeAtual,
  onClose,
}: {
  pcId: string;
  modo: Modo;
  item: EstoqueDTO;
  capacidadeAtual?: number;
  onClose: () => void;
}) {
  const distribuir = useDistribuir(pcId);
  const ajustar = useAjustarEstoque(pcId);
  const upsertCap = useUpsertCapacidade(pcId);

  const [quantidade, setQuantidade] = useState(1);
  const [delta, setDelta] = useState(0);
  const [signal, setSignal] = useState<'pos' | 'neg'>('pos');
  const [observacao, setObservacao] = useState('');
  const [qtdMaxima, setQtdMaxima] = useState(capacidadeAtual ?? 100);

  function confirmar() {
    if (modo === 'distribuir') {
      distribuir.mutate(
        { idTipo: item.idTipo, quantidade, observacao: observacao.trim() || undefined },
        {
          onSuccess: () => {
            toast.success('Distribuição registrada.');
            onClose();
          },
          onError: (e) => toast.error(apiErrorMessage(e)),
        },
      );
    } else if (modo === 'ajustar') {
      const signed = signal === 'neg' ? -Math.abs(delta) : Math.abs(delta);
      ajustar.mutate(
        { idTipo: item.idTipo, delta: signed, observacao: observacao.trim() || undefined },
        {
          onSuccess: () => {
            toast.success('Estoque ajustado.');
            onClose();
          },
          onError: (e) => toast.error(apiErrorMessage(e)),
        },
      );
    } else {
      upsertCap.mutate(
        { tipoId: item.idTipo, qtdMaxima },
        {
          onSuccess: () => {
            toast.success('Capacidade atualizada.');
            onClose();
          },
          onError: (e) => toast.error(apiErrorMessage(e)),
        },
      );
    }
  }

  const title =
    modo === 'distribuir'
      ? `Distribuir ${item.tipoNome}`
      : modo === 'ajustar'
        ? `Ajustar ${item.tipoNome}`
        : `Capacidade de ${item.tipoNome}`;

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Voltar
          </Button>
          <Button
            onClick={confirmar}
            loading={distribuir.isPending || ajustar.isPending || upsertCap.isPending}
          >
            Confirmar
          </Button>
        </>
      }
    >
      {modo === 'distribuir' && (
        <>
          <p className="mb-3 text-[13px] text-ink-secondary">
            Estoque atual: <strong>{item.quantidade}</strong>.
          </p>
          <label className="form-label mb-1.5 block">Quantidade a distribuir</label>
          <Input
            type="number"
            min={1}
            max={item.quantidade}
            value={quantidade}
            onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
          />
        </>
      )}
      {modo === 'ajustar' && (
        <>
          <p className="mb-3 text-[13px] text-ink-secondary">
            Use para entrada manual (positivo) ou saída sem registro de doação (negativo).
          </p>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="form-label mb-1.5 block">Sinal</label>
              <Select value={signal} onChange={(e) => setSignal(e.target.value as 'pos' | 'neg')}>
                <option value="pos">+ Entrada</option>
                <option value="neg">− Saída</option>
              </Select>
            </div>
            <div>
              <label className="form-label mb-1.5 block">Quantidade</label>
              <Input
                type="number"
                min={1}
                value={delta}
                onChange={(e) => setDelta(Math.max(0, Number(e.target.value)))}
              />
            </div>
          </div>
        </>
      )}
      {modo === 'capacidade' && (
        <>
          <p className="mb-3 text-[13px] text-ink-secondary">
            Define a capacidade máxima para novas demandas deste tipo.
          </p>
          <label className="form-label mb-1.5 block">Quantidade máxima</label>
          <Input
            type="number"
            min={1}
            value={qtdMaxima}
            onChange={(e) => setQtdMaxima(Math.max(1, Number(e.target.value)))}
          />
        </>
      )}
      {(modo === 'distribuir' || modo === 'ajustar') && (
        <>
          <label className="form-label mb-1.5 mt-3 block">Observação (opcional)</label>
          <textarea
            rows={2}
            className="input w-full"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
        </>
      )}
    </Modal>
  );
}
