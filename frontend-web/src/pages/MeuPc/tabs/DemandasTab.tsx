import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import {
  Button,
  DataTable,
  EmptyState,
  Input,
  LoadingBlock,
  Modal,
  Select,
  type Column,
} from '@/components/ui';
import {
  useCriarDemandaPc,
  useDemandas,
  useFecharDemanda,
  usePcEventos,
} from '@/hooks/usePcs';
import { useDemandaTipos } from '@/hooks/useLookups';
import { apiErrorMessage } from '@/lib/api';
import type { DemandaDTO } from '@/types/api';

export function DemandasTab({ pcId }: { pcId: string }) {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [novaOpen, setNovaOpen] = useState(false);
  const demandas = useDemandas(pcId);
  const fechar = useFecharDemanda(pcId);

  const filtered = useMemo(
    () =>
      (demandas.data ?? []).filter((d) => (statusFilter ? d.status === statusFilter : true)),
    [demandas.data, statusFilter],
  );

  const columns: Column<DemandaDTO>[] = [
    { key: 'tipo', label: 'Tipo', render: (r) => r.tipoNome },
    { key: 'prio', label: 'Prioridade', render: (r) => r.prioridade },
    {
      key: 'qtd',
      label: 'Recebida / Solicitada',
      render: (r) => (
        <span className="data-mono">
          {r.qtdRecebida}/{r.qtdSolicitada}
          {r.qtdIntencionada > 0 && (
            <span className="ml-1 text-ink-muted">(+{r.qtdIntencionada} reservada)</span>
          )}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${demandaStatusClass(r.status)}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'acoes',
      label: '',
      render: (r) =>
        r.status !== 'CLOSED' && r.status !== 'FULFILLED' ? (
          <Button
            variant="secondary"
            onClick={() =>
              fechar.mutate(r.id, {
                onSuccess: () => toast.success('Demanda fechada.'),
                onError: (e) => toast.error(apiErrorMessage(e)),
              })
            }
          >
            Fechar
          </Button>
        ) : (
          <span className="text-[11px] text-ink-muted">—</span>
        ),
    },
  ];

  if (demandas.isLoading) return <LoadingBlock />;

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-48">
          <option value="">Todos os status</option>
          <option value="OPEN">Abertas</option>
          <option value="PARTIALLY_FULFILLED">Parcialmente atendidas</option>
          <option value="FULFILLED">Atendidas</option>
          <option value="CLOSED">Fechadas</option>
        </Select>
        <Button onClick={() => setNovaOpen(true)}>
          <Plus size={14} /> Nova demanda
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.id}
        emptyState={
          <EmptyState title="Sem demandas" description="Crie uma nova demanda para um evento aceito." />
        }
      />

      {novaOpen && <NovaDemandaModal pcId={pcId} onClose={() => setNovaOpen(false)} />}
    </>
  );
}

function NovaDemandaModal({ pcId, onClose }: { pcId: string; onClose: () => void }) {
  const eventos = usePcEventos(pcId);
  const tipos = useDemandaTipos();
  const criar = useCriarDemandaPc(pcId);
  const [idEvento, setIdEvento] = useState('');
  const [idTipo, setIdTipo] = useState('');
  const [prioridade, setPrioridade] = useState('MEDIA');
  const [qtdSolicitada, setQtdSolicitada] = useState(1);
  const [descricao, setDescricao] = useState('');

  const eventosAceitos = eventos.data?.filter((e) => e.status === 'ACEITO') ?? [];

  function handleCriar() {
    if (!idEvento || !idTipo) {
      toast.error('Selecione evento e tipo.');
      return;
    }
    criar.mutate(
      {
        idEvento,
        idTipo,
        prioridade,
        qtdSolicitada,
        descricao: descricao.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Demanda criada.');
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
      title="Nova demanda"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Voltar
          </Button>
          <Button onClick={handleCriar} loading={criar.isPending}>
            Criar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className="form-label mb-1.5 block">Evento</label>
          <Select value={idEvento} onChange={(e) => setIdEvento(e.target.value)}>
            <option value="">Selecione um evento aceito…</option>
            {eventosAceitos.map((e) => (
              <option key={e.eventoId} value={e.eventoId}>
                {e.eventoId.slice(0, 8)}…
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="form-label mb-1.5 block">Tipo</label>
          <Select value={idTipo} onChange={(e) => setIdTipo(e.target.value)}>
            <option value="">Selecione…</option>
            {tipos.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label mb-1.5 block">Prioridade</label>
            <Select value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
              <option value="CRITICA">Crítica</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Média</option>
              <option value="BAIXA">Baixa</option>
            </Select>
          </div>
          <div>
            <label className="form-label mb-1.5 block">Qtd solicitada</label>
            <Input
              type="number"
              min={1}
              value={qtdSolicitada}
              onChange={(e) => setQtdSolicitada(Math.max(1, Number(e.target.value)))}
            />
          </div>
        </div>
        <div>
          <label className="form-label mb-1.5 block">Descrição</label>
          <textarea
            className="input w-full"
            rows={2}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

function demandaStatusClass(s: string) {
  if (s === 'OPEN') return 'bg-amber-500/15 text-amber-300';
  if (s === 'PARTIALLY_FULFILLED') return 'bg-blue-500/15 text-blue-300';
  if (s === 'FULFILLED') return 'bg-emerald-500/15 text-emerald-300';
  return 'bg-white/5 text-ink-muted';
}
