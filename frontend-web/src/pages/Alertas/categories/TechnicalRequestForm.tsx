import { useState } from 'react';
import { toast } from 'sonner';
import { FormField, Select } from '@/components/ui';
import { useEventos } from '@/hooks/useEventos';
import { useCreateTechnicalRequest, usePreviewTechnicalRequest } from '@/hooks/useAlertas';
import { apiErrorMessage } from '@/lib/api';
import type { AlertaDTO, CreateTechnicalRequestInput } from '@/types/api';
import { ExpirationFields, FormSection, MessageFields } from './common';
import { PreviewPanel } from '../components/PreviewPanel';

interface Props {
  onSuccess: (alerta: AlertaDTO) => void;
}

export function TechnicalRequestForm({ onSuccess }: Props) {
  const { data: eventos = [] } = useEventos();
  const create = useCreateTechnicalRequest();
  const preview = usePreviewTechnicalRequest();
  const [idEvento, setIdEvento] = useState('');
  const [raioMetros, setRaioMetros] = useState<number | undefined>();
  const [tenantWide, setTenantWide] = useState(false);
  const [ackMinimo, setAckMinimo] = useState<number | undefined>();
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [dataExpiracao, setDataExpiracao] = useState<string | undefined>();
  const [autoExpireMinutes, setAutoExpireMinutes] = useState<number | undefined>();

  // 2B: expansão automática de raio
  const [expansionEnabled, setExpansionEnabled] = useState(false);
  const [expansionRadiiCsv, setExpansionRadiiCsv] = useState('5000,10000,20000');
  const [expansionWindowMinutes, setExpansionWindowMinutes] = useState<number>(5);

  function parseRadiiCsv(): number[] | undefined {
    if (!expansionEnabled) return undefined;
    return expansionRadiiCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n) && n > 0);
  }

  function buildPayload(): CreateTechnicalRequestInput | null {
    if (!idEvento) { toast.error('Selecione um evento'); return null; }
    const radii = parseRadiiCsv();
    if (expansionEnabled) {
      if (!ackMinimo || ackMinimo <= 0) {
        toast.error('Expansão automática exige um mínimo de aceites'); return null;
      }
      if (!radii || radii.length < 2) {
        toast.error('Informe pelo menos 2 passos de raio (ex: 5000, 10000)'); return null;
      }
      const sorted = [...radii].sort((a, b) => a - b);
      if (JSON.stringify(sorted) !== JSON.stringify(radii)) {
        toast.error('Os raios devem estar em ordem crescente'); return null;
      }
    }
    return {
      idEvento,
      raioMetros: tenantWide ? undefined : raioMetros,
      tenantWide,
      ackMinimo,
      titulo: titulo || undefined,
      mensagem: mensagem || undefined,
      dataExpiracao: dataExpiracao ? new Date(dataExpiracao).toISOString() : undefined,
      autoExpireMinutes,
      expansionRadiiMetros: expansionEnabled ? radii : undefined,
      expansionWindowMinutes: expansionEnabled ? expansionWindowMinutes : undefined,
    };
  }

  async function submit(input: CreateTechnicalRequestInput) {
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
      <FormSection title="Evento e abrangência">
        <FormField label="Evento" required hint="O técnico precisa saber onde se apresentar.">
          <Select value={idEvento} onChange={(e) => setIdEvento(e.target.value)}>
            <option value="">Selecione…</option>
            {ativos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.titulo} · {e.severidade}
              </option>
            ))}
          </Select>
        </FormField>
        <label className="flex items-center gap-2 text-[13px] text-ink-secondary">
          <input type="checkbox" checked={tenantWide} onChange={(e) => setTenantWide(e.target.checked)} />
          Estender a TODOS os técnicos do tenant (ignora raio)
        </label>
        {!tenantWide && (
          <FormField label="Raio (m, opcional)" hint="Sobrescreve o raio do evento. Útil para ampliar a chamada.">
            <input
              type="number"
              className="input"
              min={100}
              value={raioMetros ?? ''}
              onChange={(e) => setRaioMetros(e.target.value ? Number(e.target.value) : undefined)}
            />
          </FormField>
        )}
        <FormField label="Mínimo de aceites" hint="Quando alcançado, a meta é considerada atendida.">
          <input
            type="number"
            className="input"
            min={1}
            value={ackMinimo ?? ''}
            onChange={(e) => setAckMinimo(e.target.value ? Number(e.target.value) : undefined)}
          />
        </FormField>
      </FormSection>

      <FormSection title="Expansão automática de raio">
        <p className="text-[12px] text-ink-secondary">
          Se o número de aceites ficar abaixo do mínimo após a janela configurada, o sistema
          expande automaticamente o raio para o próximo passo e dispara para os novos técnicos
          alcançados. Continua expandindo até atingir o mínimo ou esgotar os passos.
        </p>
        <label className="flex items-center gap-2 text-[13px] text-ink-secondary">
          <input
            type="checkbox"
            checked={expansionEnabled}
            onChange={(e) => setExpansionEnabled(e.target.checked)}
          />
          Ativar expansão automática
        </label>
        {expansionEnabled && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              label="Passos de raio (metros, ordem crescente)"
              required
              hint="Ex: 5000, 10000, 20000"
            >
              <input
                className="input"
                value={expansionRadiiCsv}
                onChange={(e) => setExpansionRadiiCsv(e.target.value)}
                placeholder="5000, 10000, 20000"
              />
            </FormField>
            <FormField label="Janela entre expansões (min)" required>
              <input
                type="number"
                className="input"
                min={1}
                value={expansionWindowMinutes}
                onChange={(e) => setExpansionWindowMinutes(Number(e.target.value) || 5)}
              />
            </FormField>
          </div>
        )}
      </FormSection>

      <FormSection title="Conteúdo">
        <MessageFields
          titulo={titulo}
          setTitulo={setTitulo}
          mensagem={mensagem}
          setMensagem={setMensagem}
          categoria="TECHNICAL_REQUEST"
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
        confirmLabel="Convocar técnicos"
      />
    </div>
  );
}
