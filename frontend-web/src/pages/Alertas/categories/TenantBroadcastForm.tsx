import { useState } from 'react';
import { toast } from 'sonner';
import { FormField, Select } from '@/components/ui';
import { useTenantOptions } from '@/hooks/useTenantTable';
import { useCreateTenantBroadcast, usePreviewTenantBroadcast } from '@/hooks/useAlertas';
import { apiErrorMessage } from '@/lib/api';
import type { AlertaDTO, AlertaSeveridade, CreateTenantBroadcastInput, Role } from '@/types/api';
import { ExpirationFields, FormSection, MessageFields, SeverityField } from './common';
import { PreviewPanel } from '../components/PreviewPanel';

const ROLES: { value: Role | ''; label: string }[] = [
  { value: '', label: 'Todos os usuários' },
  { value: 'DOADOR', label: 'Doadores' },
  { value: 'TECNICO', label: 'Técnicos' },
  { value: 'COORDENADOR', label: 'Coordenadores' },
  { value: 'MONITOR', label: 'Monitores' },
  { value: 'GESTOR', label: 'Gestores' },
  { value: 'USUARIO_SIMPLES', label: 'Cidadãos' },
];

interface Props {
  onSuccess: (alerta: AlertaDTO) => void;
}

export function TenantBroadcastForm({ onSuccess }: Props) {
  const { tenants } = useTenantOptions();
  const create = useCreateTenantBroadcast();
  const preview = usePreviewTenantBroadcast();
  const [idTenantAlvo, setIdTenantAlvo] = useState('');
  const [targetRole, setTargetRole] = useState<Role | ''>('');
  const [severidade, setSeveridade] = useState<AlertaSeveridade>('INFO');
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [dataExpiracao, setDataExpiracao] = useState<string | undefined>();
  const [autoExpireMinutes, setAutoExpireMinutes] = useState<number | undefined>();

  function buildPayload(): CreateTenantBroadcastInput | null {
    if (!idTenantAlvo) { toast.error('Selecione o tenant alvo'); return null; }
    if (!mensagem.trim()) { toast.error('Mensagem é obrigatória'); return null; }
    return {
      idTenantAlvo,
      targetRole: targetRole || undefined,
      severidade,
      titulo: titulo || undefined,
      mensagem,
      dataExpiracao: dataExpiracao ? new Date(dataExpiracao).toISOString() : undefined,
      autoExpireMinutes,
    };
  }

  async function submit(input: CreateTenantBroadcastInput) {
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
        <FormField label="Tenant" required hint="Apenas tenants do seu escopo aparecem.">
          <Select value={idTenantAlvo} onChange={(e) => setIdTenantAlvo(e.target.value)}>
            <option value="">Selecione…</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} ({t.tipo})
              </option>
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
      </FormSection>

      <FormSection title="Conteúdo">
        <SeverityField value={severidade} onChange={setSeveridade} />
        <MessageFields
          titulo={titulo}
          setTitulo={setTitulo}
          mensagem={mensagem}
          setMensagem={setMensagem}
          tituloOptional={false}
          categoria="TENANT_BROADCAST"
          templateContext={{
            tenantNome: tenants.find((t) => t.id === idTenantAlvo)?.nome,
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
        confirmLabel="Enviar broadcast"
      />
    </div>
  );
}
