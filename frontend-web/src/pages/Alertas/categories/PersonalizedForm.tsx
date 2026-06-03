import { useState } from 'react';
import { toast } from 'sonner';
import { FormField, Select } from '@/components/ui';
import { LocationPicker } from '@/components/LocationPicker';
import { useTenantOptions } from '@/hooks/useTenantTable';
import { useCreatePersonalizedAlert, usePreviewPersonalized } from '@/hooks/useAlertas';
import { apiErrorMessage } from '@/lib/api';
import type { AlertaDTO, AlertaSeveridade, Coordenadas, CreatePersonalizedInput, GeofenceMode, Role } from '@/types/api';
import { ExpirationFields, FormSection, MessageFields, SeverityField } from './common';
import { PreviewPanel } from '../components/PreviewPanel';
import { HistoricalGeofenceFields } from '../components/HistoricalGeofenceFields';

const ROLES: { value: Role | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'DOADOR', label: 'Doadores' },
  { value: 'TECNICO', label: 'Técnicos' },
  { value: 'COORDENADOR', label: 'Coordenadores' },
  { value: 'MONITOR', label: 'Monitores' },
  { value: 'GESTOR', label: 'Gestores' },
  { value: 'USUARIO_SIMPLES', label: 'Cidadãos' },
];

const MODES: GeofenceMode[] = ['INSIDE', 'NEAR', 'HOME'];

interface Props {
  onSuccess: (alerta: AlertaDTO) => void;
}

export function PersonalizedForm({ onSuccess }: Props) {
  const { tenants } = useTenantOptions();
  const create = useCreatePersonalizedAlert();
  const preview = usePreviewPersonalized();

  const [idTenantAlvo, setIdTenantAlvo] = useState('');
  const [targetRole, setTargetRole] = useState<Role | ''>('');
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const [raioMetros, setRaioMetros] = useState<number | undefined>();
  const [modes, setModes] = useState<GeofenceMode[]>(['INSIDE', 'NEAR']);
  const [severidade, setSeveridade] = useState<AlertaSeveridade>('INFO');
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [requerAck, setRequerAck] = useState(false);
  const [dataExpiracao, setDataExpiracao] = useState<string | undefined>();
  const [autoExpireMinutes, setAutoExpireMinutes] = useState<number | undefined>();
  const [lastHours, setLastHours] = useState<number | undefined>();
  const [frequentMinDays, setFrequentMinDays] = useState<number | undefined>();
  const [frequentLastDays, setFrequentLastDays] = useState<number | undefined>();

  function toggleMode(m: GeofenceMode) {
    setModes((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  function buildPayload(): CreatePersonalizedInput | null {
    if (!titulo.trim()) { toast.error('Título é obrigatório'); return null; }
    if (!mensagem.trim()) { toast.error('Mensagem é obrigatória'); return null; }
    return {
      idTenantAlvo: idTenantAlvo || undefined,
      targetRole: targetRole || undefined,
      coordenadas: coordenadas || undefined,
      raioMetros,
      geofenceModes: coordenadas ? modes : undefined,
      severidade,
      titulo,
      mensagem,
      requerAck,
      dataExpiracao: dataExpiracao ? new Date(dataExpiracao).toISOString() : undefined,
      autoExpireMinutes,
      lastHours: coordenadas && modes.includes('PASSED_THROUGH') ? lastHours : undefined,
      frequentMinDays: coordenadas && modes.includes('FREQUENT') ? frequentMinDays : undefined,
      frequentLastDays: coordenadas && modes.includes('FREQUENT') ? frequentLastDays : undefined,
    };
  }

  async function submit(input: CreatePersonalizedInput) {
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Tenant" hint="Vazio = seu tenant.">
            <Select value={idTenantAlvo} onChange={(e) => setIdTenantAlvo(e.target.value)}>
              <option value="">— Meu tenant —</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.nome} ({t.tipo})</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Perfil">
            <Select value={targetRole} onChange={(e) => setTargetRole(e.target.value as Role | '')}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </Select>
          </FormField>
        </div>
        <FormField label="Localização (opcional)" hint="Define um ponto no mapa para geofencing.">
          <LocationPicker value={coordenadas} onChange={setCoordenadas} />
        </FormField>
        {coordenadas && (
          <>
            <FormField label="Raio (m)" required hint="Distância do ponto para o geofencing.">
              <input
                type="number"
                className="input"
                min={100}
                value={raioMetros ?? ''}
                onChange={(e) => setRaioMetros(e.target.value ? Number(e.target.value) : undefined)}
              />
            </FormField>
            <FormField label="Geofencing">
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
                    {m === 'INSIDE' ? 'Dentro do raio' : m === 'NEAR' ? 'Próximo' : 'Endereço residencial'}
                  </label>
                ))}
              </div>
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
          tituloOptional={false}
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
