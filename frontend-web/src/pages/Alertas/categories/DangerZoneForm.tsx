import { useState } from 'react';
import { toast } from 'sonner';
import { FormField, Select } from '@/components/ui';
import { useZonasRisco } from '@/hooks/useZonasRisco';
import { useCreateDangerZone, usePreviewDangerZone } from '@/hooks/useAlertas';
import { apiErrorMessage } from '@/lib/api';
import type { AlertaDTO, AlertaSeveridade, CreateDangerZoneAlertInput, GeofenceMode } from '@/types/api';
import { ExpirationFields, FormSection, MessageFields, SeverityField } from './common';
import { PreviewPanel } from '../components/PreviewPanel';

const MODES: GeofenceMode[] = ['INSIDE', 'NEAR', 'HOME'];
const MODE_LABEL: Record<GeofenceMode, string> = {
  INSIDE: 'Dentro da zona',
  NEAR: 'Próximos da zona (raio)',
  HOME: 'Endereço residencial na zona/raio',
  WORK: 'Endereço de trabalho na zona/raio',
};

interface Props {
  onSuccess: (alerta: AlertaDTO) => void;
}

export function DangerZoneForm({ onSuccess }: Props) {
  const { data: zonas = [] } = useZonasRisco();
  const create = useCreateDangerZone();
  const preview = usePreviewDangerZone();
  const [idZonaRisco, setIdZonaRisco] = useState<string>('');
  const [todasZonas, setTodasZonas] = useState(false);
  const [severidade, setSeveridade] = useState<AlertaSeveridade>('DANGER');
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [modes, setModes] = useState<GeofenceMode[]>(['INSIDE', 'NEAR']);
  const [raioMetros, setRaioMetros] = useState<number | undefined>();
  const [dataExpiracao, setDataExpiracao] = useState<string | undefined>();
  const [autoExpireMinutes, setAutoExpireMinutes] = useState<number | undefined>();
  const [requerAck, setRequerAck] = useState(false);

  function toggleMode(m: GeofenceMode) {
    setModes((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  function buildPayload(): CreateDangerZoneAlertInput | null {
    if (!todasZonas && !idZonaRisco) {
      toast.error('Selecione uma zona ou marque "Todas as zonas"');
      return null;
    }
    if (modes.length === 0) {
      toast.error('Selecione ao menos uma opção de geofencing');
      return null;
    }
    return {
      idZonaRisco: todasZonas ? undefined : idZonaRisco,
      todasZonas,
      severidade,
      titulo: titulo || undefined,
      mensagem: mensagem || undefined,
      geofenceModes: modes,
      raioMetros,
      dataExpiracao: dataExpiracao ? new Date(dataExpiracao).toISOString() : undefined,
      autoExpireMinutes,
      requerAck,
    };
  }

  async function submit(input: CreateDangerZoneAlertInput) {
    try {
      const alerta = await create.mutateAsync(input);
      onSuccess(alerta);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <FormSection title="Alvo">
        <label className="flex items-center gap-2 text-[13px] text-ink-secondary">
          <input
            type="checkbox"
            checked={todasZonas}
            onChange={(e) => setTodasZonas(e.target.checked)}
          />
          Todas as zonas de risco ativas do tenant
        </label>
        {!todasZonas && (
          <FormField label="Zona de risco" required>
            <Select value={idZonaRisco} onChange={(e) => setIdZonaRisco(e.target.value)}>
              <option value="">Selecione…</option>
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nome} ({z.tipo})
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
                <input
                  type="checkbox"
                  checked={modes.includes(m)}
                  onChange={() => toggleMode(m)}
                />
                {MODE_LABEL[m]}
              </label>
            ))}
          </div>
        </FormField>
        <FormField label="Raio (m, opcional)" hint="Sobrescreve o raio padrão da zona (5 km).">
          <input
            type="number"
            className="input"
            min={100}
            value={raioMetros ?? ''}
            onChange={(e) => setRaioMetros(e.target.value ? Number(e.target.value) : undefined)}
          />
        </FormField>
      </FormSection>

      <FormSection title="Conteúdo">
        <SeverityField value={severidade} onChange={setSeveridade} />
        <MessageFields
          titulo={titulo}
          setTitulo={setTitulo}
          mensagem={mensagem}
          setMensagem={setMensagem}
          categoria="DANGER_ZONE"
          templateContext={{
            zonaNome: zonas.find((z) => z.id === idZonaRisco)?.nome,
            zonaTipo: zonas.find((z) => z.id === idZonaRisco)?.tipo,
            nivelRisco: zonas.find((z) => z.id === idZonaRisco)?.nivelRisco,
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
