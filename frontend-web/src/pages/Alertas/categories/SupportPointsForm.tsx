import { useState } from 'react';
import { toast } from 'sonner';
import { FormField, Select } from '@/components/ui';
import { useZonasRisco } from '@/hooks/useZonasRisco';
import { useCreateSupportPoints, usePreviewSupportPoints } from '@/hooks/useAlertas';
import { apiErrorMessage } from '@/lib/api';
import type { AlertaDTO, AlertaSeveridade, CreateSupportPointsInput } from '@/types/api';
import { ExpirationFields, FormSection, MessageFields, SeverityField } from './common';
import { PreviewPanel } from '../components/PreviewPanel';

interface Props {
  onSuccess: (alerta: AlertaDTO) => void;
}

export function SupportPointsForm({ onSuccess }: Props) {
  const { data: zonas = [] } = useZonasRisco();
  const create = useCreateSupportPoints();
  const preview = usePreviewSupportPoints();
  const [idZonaRisco, setIdZonaRisco] = useState('');
  const [escopoTipo, setEscopoTipo] = useState<'ZONA' | 'RAIO' | 'TENANT'>('ZONA');
  const [raioMetros, setRaioMetros] = useState<number | undefined>();
  const [severidade, setSeveridade] = useState<AlertaSeveridade>('WARNING');
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [dataExpiracao, setDataExpiracao] = useState<string | undefined>();
  const [autoExpireMinutes, setAutoExpireMinutes] = useState<number | undefined>();

  function buildPayload(): CreateSupportPointsInput | null {
    if (!idZonaRisco) { toast.error('Selecione uma zona de risco'); return null; }
    return {
      idZonaRisco,
      escopoTipo,
      raioMetros: escopoTipo === 'RAIO' ? raioMetros : undefined,
      severidade,
      titulo: titulo || undefined,
      mensagem: mensagem || undefined,
      dataExpiracao: dataExpiracao ? new Date(dataExpiracao).toISOString() : undefined,
      autoExpireMinutes,
    };
  }

  async function submit(input: CreateSupportPointsInput) {
    try {
      const a = await create.mutateAsync(input);
      onSuccess(a);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <FormSection title="Alvo">
        <FormField label="Zona de risco" required>
          <Select value={idZonaRisco} onChange={(e) => setIdZonaRisco(e.target.value)}>
            <option value="">Selecione…</option>
            {zonas.map((z) => (
              <option key={z.id} value={z.id}>{z.nome} ({z.tipo})</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Escopo">
          <Select value={escopoTipo} onChange={(e) => setEscopoTipo(e.target.value as 'ZONA' | 'RAIO' | 'TENANT')}>
            <option value="ZONA">Pontos de apoio da zona</option>
            <option value="RAIO">Pontos no raio personalizado</option>
            <option value="TENANT">Todos os pontos de apoio do tenant</option>
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
          categoria="SUPPORT_POINTS"
          templateContext={{
            zonaNome: zonas.find((z) => z.id === idZonaRisco)?.nome,
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
        confirmLabel="Avisar pontos de apoio"
      />
    </div>
  );
}
