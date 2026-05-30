import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { Card, FormField, Select } from '@/components/ui';
import { applyTemplate, useAlertaTemplate } from '@/hooks/useAlertas';
import type { AlertaCategoria, AlertaSeveridade } from '@/types/api';
import { SEVERITY } from '../components/severity';

export const SEVERIDADES_BASIC: AlertaSeveridade[] = [
  'INFO', 'WARNING', 'DANGER', 'CRITICAL', 'EMERGENCY',
];

export function FormSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <Card>
      {title && (
        <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
          {title}
        </h3>
      )}
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

interface SeverityFieldProps {
  value: AlertaSeveridade;
  onChange: (s: AlertaSeveridade) => void;
  options?: AlertaSeveridade[];
}

export function SeverityField({ value, onChange, options = SEVERIDADES_BASIC }: SeverityFieldProps) {
  return (
    <FormField label="Severidade" required hint="A severidade altera cor, ordem, cooldown e prioridade da entrega.">
      <Select value={value} onChange={(e) => onChange(e.target.value as AlertaSeveridade)}>
        {options.map((s) => (
          <option key={s} value={s}>{SEVERITY[s].label}</option>
        ))}
      </Select>
    </FormField>
  );
}

interface ExpirationFieldsProps {
  dataExpiracao: string | undefined;
  setDataExpiracao: (v: string | undefined) => void;
  autoExpireMinutes: number | undefined;
  setAutoExpireMinutes: (v: number | undefined) => void;
}

export function ExpirationFields({
  dataExpiracao,
  setDataExpiracao,
  autoExpireMinutes,
  setAutoExpireMinutes,
}: ExpirationFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <FormField label="Expira em" hint="Data/hora absoluta. Opcional.">
        <input
          type="datetime-local"
          className="input"
          value={dataExpiracao ?? ''}
          onChange={(e) => setDataExpiracao(e.target.value || undefined)}
        />
      </FormField>
      <FormField label="Auto-expirar após (min)" hint="Janela relativa em minutos a partir da criação. Opcional.">
        <input
          type="number"
          className="input"
          min={1}
          value={autoExpireMinutes ?? ''}
          onChange={(e) => setAutoExpireMinutes(e.target.value ? Number(e.target.value) : undefined)}
        />
      </FormField>
    </div>
  );
}

export function MessageFields({
  titulo,
  setTitulo,
  mensagem,
  setMensagem,
  tituloOptional = true,
  categoria,
  templateContext,
}: {
  titulo: string;
  setTitulo: (v: string) => void;
  mensagem: string;
  setMensagem: (v: string) => void;
  tituloOptional?: boolean;
  /** Se setado, mostra botão "Aplicar template" que prefilha titulo + mensagem. */
  categoria?: AlertaCategoria;
  templateContext?: Record<string, string | number | null | undefined>;
}) {
  const tmpl = useAlertaTemplate(categoria);

  function applyTemplateClick() {
    if (!tmpl.data) return;
    const ctx = templateContext ?? {};
    const t = applyTemplate(tmpl.data.titulo, ctx);
    const m = applyTemplate(tmpl.data.mensagem, ctx);
    if (t) setTitulo(t);
    if (m) setMensagem(m);
  }

  const canApply = !!(tmpl.data && (tmpl.data.titulo || tmpl.data.mensagem));

  return (
    <>
      {canApply && (
        <button
          type="button"
          onClick={applyTemplateClick}
          className="self-start inline-flex items-center gap-1.5 rounded-md border border-brand-light/30 bg-brand-blue-soft px-2.5 py-1.5 text-[11px] font-medium text-brand-light transition-colors hover:bg-brand-light/15"
        >
          <Sparkles size={12} /> Aplicar template padrão
        </button>
      )}
      <FormField
        label="Título"
        hint={tituloOptional ? 'Se vazio, será gerado um título padrão pela categoria.' : undefined}
        required={!tituloOptional}
      >
        <input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={200} />
      </FormField>
      <FormField
        label="Mensagem"
        hint={tituloOptional ? 'Se vazio, será gerada uma mensagem padrão pela categoria.' : 'Conteúdo enviado a todos os destinatários.'}
        required={!tituloOptional}
      >
        <textarea
          className="input min-h-[100px]"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
        />
      </FormField>
    </>
  );
}
