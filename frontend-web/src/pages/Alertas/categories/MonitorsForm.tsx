import { useState } from 'react';
import { toast } from 'sonner';
import { FormField, Select } from '@/components/ui';
import { useEventos } from '@/hooks/useEventos';
import { useZonasRisco } from '@/hooks/useZonasRisco';
import { useCreateMonitorsAlert, usePreviewMonitors } from '@/hooks/useAlertas';
import { apiErrorMessage } from '@/lib/api';
import type { AlertaDTO, AlertaSeveridade, CreateMonitorsInput } from '@/types/api';
import { ExpirationFields, FormSection, MessageFields, SeverityField } from './common';
import { PreviewPanel } from '../components/PreviewPanel';

interface Props {
  onSuccess: (alerta: AlertaDTO) => void;
}

export function MonitorsForm({ onSuccess }: Props) {
  const { data: eventos = [] } = useEventos();
  const { data: zonas = [] } = useZonasRisco();
  const create = useCreateMonitorsAlert();
  const preview = usePreviewMonitors();

  const [escopoTipo, setEscopoTipo] = useState<'RAIO' | 'TENANT'>('TENANT');
  const [referencia, setReferencia] = useState<'EVENTO' | 'ZONA'>('EVENTO');
  const [idEvento, setIdEvento] = useState('');
  const [idZonaRisco, setIdZonaRisco] = useState('');
  const [raioMetros, setRaioMetros] = useState<number | undefined>();
  const [severidade, setSeveridade] = useState<AlertaSeveridade>('OPERATIONAL');
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [dataExpiracao, setDataExpiracao] = useState<string | undefined>();
  const [autoExpireMinutes, setAutoExpireMinutes] = useState<number | undefined>();

  function buildPayload(): CreateMonitorsInput | null {
    if (escopoTipo === 'RAIO' && referencia === 'EVENTO' && !idEvento) {
      toast.error('Selecione o evento de referência'); return null;
    }
    if (escopoTipo === 'RAIO' && referencia === 'ZONA' && !idZonaRisco) {
      toast.error('Selecione a zona de referência'); return null;
    }
    return {
      escopoTipo,
      idEvento: escopoTipo === 'RAIO' && referencia === 'EVENTO' ? idEvento : undefined,
      idZonaRisco: escopoTipo === 'RAIO' && referencia === 'ZONA' ? idZonaRisco : undefined,
      raioMetros: escopoTipo === 'RAIO' ? raioMetros : undefined,
      severidade,
      titulo: titulo || undefined,
      mensagem: mensagem || undefined,
      dataExpiracao: dataExpiracao ? new Date(dataExpiracao).toISOString() : undefined,
      autoExpireMinutes,
    };
  }

  async function submit(input: CreateMonitorsInput) {
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
        <FormField label="Escopo">
          <Select value={escopoTipo} onChange={(e) => setEscopoTipo(e.target.value as 'RAIO' | 'TENANT')}>
            <option value="TENANT">Todos os monitores do tenant</option>
            <option value="RAIO">Monitores no raio</option>
          </Select>
        </FormField>
        {escopoTipo === 'RAIO' && (
          <>
            <FormField label="Referência">
              <Select value={referencia} onChange={(e) => setReferencia(e.target.value as 'EVENTO' | 'ZONA')}>
                <option value="EVENTO">Evento</option>
                <option value="ZONA">Zona de risco</option>
              </Select>
            </FormField>
            {referencia === 'EVENTO' ? (
              <FormField label="Evento" required>
                <Select value={idEvento} onChange={(e) => setIdEvento(e.target.value)}>
                  <option value="">Selecione…</option>
                  {ativos.map((e) => (
                    <option key={e.id} value={e.id}>{e.titulo} · {e.severidade}</option>
                  ))}
                </Select>
              </FormField>
            ) : (
              <FormField label="Zona de risco" required>
                <Select value={idZonaRisco} onChange={(e) => setIdZonaRisco(e.target.value)}>
                  <option value="">Selecione…</option>
                  {zonas.map((z) => (
                    <option key={z.id} value={z.id}>{z.nome} ({z.tipo})</option>
                  ))}
                </Select>
              </FormField>
            )}
            <FormField label="Raio (m, opcional)">
              <input
                type="number"
                className="input"
                min={100}
                value={raioMetros ?? ''}
                onChange={(e) => setRaioMetros(e.target.value ? Number(e.target.value) : undefined)}
              />
            </FormField>
          </>
        )}
      </FormSection>

      <FormSection title="Conteúdo">
        <SeverityField value={severidade} onChange={setSeveridade} />
        <MessageFields
          titulo={titulo}
          setTitulo={setTitulo}
          mensagem={mensagem}
          setMensagem={setMensagem}
          categoria="MONITORS"
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
        confirmLabel="Avisar monitores"
      />
    </div>
  );
}
