import { useState } from 'react';
import { toast } from 'sonner';
import { FormField, Select } from '@/components/ui';
import { useEventos } from '@/hooks/useEventos';
import { useCreateCollectionPoints, usePreviewCollectionPoints } from '@/hooks/useAlertas';
import { apiErrorMessage } from '@/lib/api';
import type { AlertaDTO, AlertaSeveridade, CreateCollectionPointsInput } from '@/types/api';
import { ExpirationFields, FormSection, MessageFields, SeverityField } from './common';
import { PreviewPanel } from '../components/PreviewPanel';

interface Props {
  onSuccess: (alerta: AlertaDTO) => void;
}

export function CollectionPointsForm({ onSuccess }: Props) {
  const { data: eventos = [] } = useEventos();
  const create = useCreateCollectionPoints();
  const preview = usePreviewCollectionPoints();
  const [idEvento, setIdEvento] = useState('');
  const [escopoTipo, setEscopoTipo] = useState<'EVENTO' | 'RAIO' | 'TENANT'>('EVENTO');
  const [raioMetros, setRaioMetros] = useState<number | undefined>();
  const [severidade, setSeveridade] = useState<AlertaSeveridade>('INFO');
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [dataExpiracao, setDataExpiracao] = useState<string | undefined>();
  const [autoExpireMinutes, setAutoExpireMinutes] = useState<number | undefined>();

  function buildPayload(): CreateCollectionPointsInput | null {
    if (!idEvento) { toast.error('Selecione um evento'); return null; }
    return {
      idEvento,
      escopoTipo,
      raioMetros: escopoTipo === 'RAIO' ? raioMetros : undefined,
      severidade,
      titulo: titulo || undefined,
      mensagem: mensagem || undefined,
      dataExpiracao: dataExpiracao ? new Date(dataExpiracao).toISOString() : undefined,
      autoExpireMinutes,
    };
  }

  async function submit(input: CreateCollectionPointsInput) {
    try {
      const a = await create.mutateAsync(input);
      onSuccess(a);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  const ativos = eventos.filter((e) => e.status === 'ATIVO' || e.status === 'ALERTA_CRITICO');

  return (
    <div className="space-y-4">
      <FormSection title="Alvo">
        <FormField label="Evento" required>
          <Select value={idEvento} onChange={(e) => setIdEvento(e.target.value)}>
            <option value="">Selecione…</option>
            {ativos.map((e) => (
              <option key={e.id} value={e.id}>{e.titulo} · {e.severidade}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Escopo">
          <Select value={escopoTipo} onChange={(e) => setEscopoTipo(e.target.value as 'EVENTO' | 'RAIO' | 'TENANT')}>
            <option value="EVENTO">PCs no raio do evento</option>
            <option value="RAIO">PCs em raio personalizado</option>
            <option value="TENANT">Todos os PCs do tenant</option>
          </Select>
        </FormField>
        {escopoTipo === 'RAIO' && (
          <FormField label="Raio (m)" required>
            <input
              type="number"
              className="input"
              min={100}
              value={raioMetros ?? ''}
              onChange={(e) => setRaioMetros(e.target.value ? Number(e.target.value) : undefined)}
            />
          </FormField>
        )}
      </FormSection>

      <FormSection title="Conteúdo">
        <SeverityField value={severidade} onChange={setSeveridade} />
        <MessageFields
          titulo={titulo}
          setTitulo={setTitulo}
          mensagem={mensagem}
          setMensagem={setMensagem}
          categoria="COLLECTION_POINTS"
          templateContext={{
            eventoTitulo: eventos.find((e) => e.id === idEvento)?.titulo,
          }}
        />
      </FormSection>

      <FormSection title="Expiração">
        <ExpirationFields
          dataExpiracao={dataExpiracao}
          setDataExpiracao={setDataExpiracao}
          autoExpireMinutes={autoExpireMinutes}
          setAutoExpireMinutes={setAutoExpireMinutes}
        />
      </FormSection>

      <PreviewPanel
        buildPayload={buildPayload}
        previewMutation={preview}
        onConfirm={submit}
        confirmLabel="Avisar pontos de coleta"
      />
    </div>
  );
}
