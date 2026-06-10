import { useState } from 'react';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import {
  Button,
  Card,
  EmptyState,
  LoadingBlock,
  Modal,
  Select,
} from '@/components/ui';
import {
  useAceitarPcEvento,
  useMotivosRecusa,
  usePcEventos,
  useRecusarPcEvento,
  useWorkforce,
} from '@/hooks/usePcs';
import { useEvento } from '@/hooks/useEventos';
import { apiErrorMessage } from '@/lib/api';
import { formatRelative } from '@/lib/utils';
import type { PcEventoDTO } from '@/types/api';

export function EventosTab({ pcId }: { pcId: string }) {
  const eventos = usePcEventos(pcId);
  const [recusarTarget, setRecusarTarget] = useState<PcEventoDTO | null>(null);
  const [expandedEventoId, setExpandedEventoId] = useState<string | null>(null);

  if (eventos.isLoading) return <LoadingBlock />;
  if (!eventos.data?.length) {
    return <EmptyState title="Nenhum evento ainda" description="Quando um evento for criado próximo, ele aparecerá aqui." />;
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {eventos.data.map((pe) => (
          <PcEventoCard
            key={pe.id}
            pcId={pcId}
            pcEvento={pe}
            expanded={expandedEventoId === pe.eventoId}
            onToggle={() =>
              setExpandedEventoId(expandedEventoId === pe.eventoId ? null : pe.eventoId)
            }
            onRecusar={() => setRecusarTarget(pe)}
          />
        ))}
      </div>

      {recusarTarget && (
        <RecusarModal
          pcId={pcId}
          pcEvento={recusarTarget}
          onClose={() => setRecusarTarget(null)}
        />
      )}
    </>
  );
}

function PcEventoCard({
  pcId,
  pcEvento,
  expanded,
  onToggle,
  onRecusar,
}: {
  pcId: string;
  pcEvento: PcEventoDTO;
  expanded: boolean;
  onToggle: () => void;
  onRecusar: () => void;
}) {
  const evento = useEvento(pcEvento.eventoId);
  const aceitar = useAceitarPcEvento(pcId);
  const workforce = useWorkforce(
    pcEvento.status === 'ACEITO' && expanded ? pcId : undefined,
    pcEvento.eventoId,
  );

  function handleAceitar() {
    aceitar.mutate(pcEvento.eventoId, {
      onSuccess: () => toast.success('Evento aceito. Workers foram notificados.'),
      onError: (e) => toast.error(apiErrorMessage(e)),
    });
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusClass(pcEvento.status)}`}
            >
              {pcEvento.status}
            </span>
            {evento.data && (
              <span className="text-[12px] text-ink-muted">{evento.data.severidade}</span>
            )}
          </div>
          <p className="text-[14px] font-semibold text-ink-primary">
            {evento.data?.titulo ?? 'Evento'}
          </p>
          <p className="text-[12px] text-ink-muted">
            Notificado {formatRelative(pcEvento.dataNotificacao)}
            {pcEvento.dataResposta && <> · Resposta {formatRelative(pcEvento.dataResposta)}</>}
          </p>
        </div>
        <div className="flex gap-2">
          {pcEvento.status === 'NOTIFICADO' && (
            <>
              <Button onClick={handleAceitar} loading={aceitar.isPending}>
                <Check size={14} /> Aceitar
              </Button>
              <Button variant="danger" onClick={onRecusar}>
                <X size={14} /> Recusar
              </Button>
            </>
          )}
          {pcEvento.status === 'ACEITO' && (
            <Button variant="secondary" onClick={onToggle}>
              {expanded ? 'Ocultar' : 'Ver workforce'}
            </Button>
          )}
        </div>
      </div>

      {expanded && pcEvento.status === 'ACEITO' && (
        <div className="mt-4 border-t border-white/5 pt-4">
          <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
            Workforce
          </h4>
          {workforce.isLoading ? (
            <p className="text-[12px] text-ink-muted">Carregando…</p>
          ) : !workforce.data?.length ? (
            <p className="text-[12px] text-ink-muted">Nenhum worker convocado.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {workforce.data.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2"
                >
                  <span className="text-[13px] text-ink-primary">{w.usuarioNome}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${workerStatusClass(w.status)}`}
                  >
                    {w.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}

function RecusarModal({
  pcId,
  pcEvento,
  onClose,
}: {
  pcId: string;
  pcEvento: PcEventoDTO;
  onClose: () => void;
}) {
  const motivos = useMotivosRecusa();
  const recusar = useRecusarPcEvento(pcId);
  const [motivoId, setMotivoId] = useState('');
  const [descricao, setDescricao] = useState('');

  const motivoSelecionado = motivos.data?.find((m) => m.id === motivoId);
  const precisaDescricao = motivoSelecionado?.exigeDescricao;

  function handleConfirmar() {
    if (!motivoId) {
      toast.error('Selecione um motivo.');
      return;
    }
    if (precisaDescricao && !descricao.trim()) {
      toast.error('Descrição obrigatória para este motivo.');
      return;
    }
    recusar.mutate(
      { eventoId: pcEvento.eventoId, idMotivoRecusa: motivoId, descricao: descricao.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Evento recusado.');
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
      title="Recusar evento"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Voltar
          </Button>
          <Button variant="danger" onClick={handleConfirmar} loading={recusar.isPending}>
            Confirmar recusa
          </Button>
        </>
      }
    >
      <label className="form-label mb-1.5 block">Motivo</label>
      <Select value={motivoId} onChange={(e) => setMotivoId(e.target.value)} className="mb-3">
        <option value="">Selecione um motivo…</option>
        {motivos.data?.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </Select>
      {precisaDescricao && (
        <>
          <label className="form-label mb-1.5 block">Descrição</label>
          <textarea
            rows={3}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="input w-full"
            placeholder="Detalhe o motivo da recusa…"
          />
        </>
      )}
    </Modal>
  );
}

function statusClass(s: string) {
  if (s === 'NOTIFICADO') return 'bg-amber-500/15 text-amber-300';
  if (s === 'ACEITO') return 'bg-emerald-500/15 text-emerald-300';
  return 'bg-rose-500/15 text-rose-300';
}
function workerStatusClass(s: string) {
  if (s === 'CONFIRMADA') return 'bg-emerald-500/15 text-emerald-300';
  if (s === 'PENDENTE') return 'bg-amber-500/15 text-amber-300';
  if (s === 'RECUSADA') return 'bg-rose-500/15 text-rose-300';
  return 'bg-white/5 text-ink-muted';
}
