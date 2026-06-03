import { useState } from 'react';
import { toast } from 'sonner';
import { FormField, Select } from '@/components/ui';
import { useEventos } from '@/hooks/useEventos';
import { useCreateEventZone, usePreviewEventZone } from '@/hooks/useAlertas';
import { apiErrorMessage } from '@/lib/api';
import type { AlertaDTO, AlertaSeveridade, CreateEventZoneAlertInput, GeofenceMode } from '@/types/api';
import { ExpirationFields, FormSection, MessageFields, SeverityField } from './common';
import { PreviewPanel } from '../components/PreviewPanel';
import { HistoricalGeofenceFields } from '../components/HistoricalGeofenceFields';

const MODES: GeofenceMode[] = ['INSIDE', 'NEAR', 'HOME'];
const MODE_LABEL: Record<GeofenceMode, string> = {
  INSIDE: 'Dentro do raio do evento',
  NEAR: 'Próximos do evento (raio expandido)',
  HOME: 'Endereço residencial dentro do raio',
  WORK: 'Endereço de trabalho dentro do raio',
  PASSED_THROUGH: 'Passou pela área',
  FREQUENT: 'Frequente na área',
};

interface Props {
  onSuccess: (alerta: AlertaDTO) => void;
}

export function EventZoneForm({ onSuccess }: Props) {
  const { data: eventos = [] } = useEventos();
  const create = useCreateEventZone();
  const preview = usePreviewEventZone();
  const [idEvento, setIdEvento] = useState('');
  const [todosEventos, setTodosEventos] = useState(false);
  const [severidade, setSeveridade] = useState<AlertaSeveridade>('WARNING');
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [modes, setModes] = useState<GeofenceMode[]>(['INSIDE']);
  const [raioMetros, setRaioMetros] = useState<number | undefined>();
  const [dataExpiracao, setDataExpiracao] = useState<string | undefined>();
  const [autoExpireMinutes, setAutoExpireMinutes] = useState<number | undefined>();
  const [requerAck, setRequerAck] = useState(false);
  const [lastHours, setLastHours] = useState<number | undefined>();
  const [frequentMinDays, setFrequentMinDays] = useState<number | undefined>();
  const [frequentLastDays, setFrequentLastDays] = useState<number | undefined>();

  function toggleMode(m: GeofenceMode) {
    setModes((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));
  }

  function buildPayload(): CreateEventZoneAlertInput | null {
    if (!todosEventos && !idEvento) {
      toast.error('Selecione um evento ou marque "Todos os eventos ativos"');
      return null;
    }
    if (modes.length === 0) {
      toast.error('Selecione ao menos uma opção de geofencing');
      return null;
    }
    return {
      idEvento: todosEventos ? undefined : idEvento,
      todosEventos,
      severidade,
      titulo: titulo || undefined,
      mensagem: mensagem || undefined,
      geofenceModes: modes,
      raioMetros,
      dataExpiracao: dataExpiracao ? new Date(dataExpiracao).toISOString() : undefined,
      autoExpireMinutes,
      requerAck,
      lastHours: modes.includes('PASSED_THROUGH') ? lastHours : undefined,
      frequentMinDays: modes.includes('FREQUENT') ? frequentMinDays : undefined,
      frequentLastDays: modes.includes('FREQUENT') ? frequentLastDays : undefined,
    };
  }

  async function submit(input: CreateEventZoneAlertInput) {
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
        <label className="flex items-center gap-2 text-[13px] text-ink-secondary">
          <input type="checkbox" checked={todosEventos} onChange={(e) => setTodosEventos(e.target.checked)} />
          Todos os eventos ativos do tenant
        </label>
        {!todosEventos && (
          <FormField label="Evento" required>
            <Select value={idEvento} onChange={(e) => setIdEvento(e.target.value)}>
              <option value="">Selecione…</option>
              {ativos.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.titulo} · {e.severidade}
                </option>
              ))}
            </Select>
          </FormField>
        )}
        <FormField label="Geofencing" required>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {MODES.map((m) => (
              <label
                key={m}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-[12px] ${
                  modes.includes(m)
                    ? 'border-brand-light bg-brand-blue-soft text-ink-primary'
                    : 'border-white/10 text-ink-secondary hover:border-white/20'
                }`}
              >
                <input type="checkbox" checked={modes.includes(m)} onChange={() => toggleMode(m)} />
                {MODE_LABEL[m]}
              </label>
            ))}
          </div>
        </FormField>
        <FormField label="Raio (m, opcional)" hint="Sobrescreve o raio do evento.">
          <input
            type="number"
            className="input"
            min={100}
            value={raioMetros ?? ''}
            onChange={(e) => setRaioMetros(e.target.value ? Number(e.target.value) : undefined)}
          />
        </FormField>
        <HistoricalGeofenceFields
          modes={modes}
          toggleMode={toggleMode}
          lastHours={lastHours}
          setLastHours={setLastHours}
          frequentMinDays={frequentMinDays}
          setFrequentMinDays={setFrequentMinDays}
          frequentLastDays={frequentLastDays}
          setFrequentLastDays={setFrequentLastDays}
        />
      </FormSection>

      <FormSection title="Conteúdo">
        <SeverityField value={severidade} onChange={setSeveridade} />
        <MessageFields
          titulo={titulo}
          setTitulo={setTitulo}
          mensagem={mensagem}
          setMensagem={setMensagem}
          categoria="EVENT_ZONE"
          templateContext={{
            eventoTitulo: eventos.find((e) => e.id === idEvento)?.titulo,
            severidade,
          }}
        />
      </FormSection>

      <FormSection title="Expiração / Confirmação">
        <ExpirationFields
          dataExpiracao={dataExpiracao}
          setDataExpiracao={setDataExpiracao}
          autoExpireMinutes={autoExpireMinutes}
          setAutoExpireMinutes={setAutoExpireMinutes}
        />
        <label className="flex items-center gap-2 text-[13px] text-ink-secondary">
          <input type="checkbox" checked={requerAck} onChange={(e) => setRequerAck(e.target.checked)} />
          Exigir confirmação dos destinatários
        </label>
      </FormSection>

      <PreviewPanel
        buildPayload={buildPayload}
        previewMutation={preview}
        onConfirm={submit}
        confirmLabel="Disparar alerta"
      />
    </div>
  );
}
