import { useState } from 'react';
import { toast } from 'sonner';
import { Bot, History, Power, PowerOff, Settings, X } from 'lucide-react';
import {
  Button,
  Card,
  ErrorState,
  SectionHeader,
  Skeleton,
} from '@/components/ui';
import {
  useAlertaAutomaticoLog,
  useAlertasAutomaticos,
  useAtivarAlertaAutomatico,
  useAtualizarConfigAutomatico,
  useDesativarAlertaAutomatico,
} from '@/hooks/useAlertasAutomaticos';
import { apiErrorMessage } from '@/lib/api';
import { formatRelative } from '@/lib/utils';
import type {
  AlertaAutomaticoDTO,
  AlertaAutomaticoRuleParameter,
} from '@/types/api';

export function AlertasAutomaticosPage() {
  const { data: rules = [], isLoading, isError, refetch } = useAlertasAutomaticos();
  const ativar = useAtivarAlertaAutomatico();
  const desativar = useDesativarAlertaAutomatico();
  const [configuring, setConfiguring] = useState<AlertaAutomaticoDTO | null>(null);
  const [logRule, setLogRule] = useState<AlertaAutomaticoDTO | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (isError) {
    return (
      <ErrorState
        title="Erro ao carregar regras"
        action={<Button onClick={() => refetch()}>Tentar novamente</Button>}
      />
    );
  }

  async function toggle(rule: AlertaAutomaticoDTO) {
    try {
      if (rule.ativo) {
        await desativar.mutateAsync(rule.ruleId);
        toast.success(`Regra desativada: ${rule.displayName}`);
      } else {
        await ativar.mutateAsync({ ruleId: rule.ruleId, config: rule.config ?? defaultConfig(rule) });
        toast.success(`Regra ativada: ${rule.displayName}`);
      }
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Comunicação"
        title="Alertas Automáticos"
      />

      <Card className="mb-5 border-brand-orange/30 bg-brand-orange/5">
        <p className="text-[12px] leading-relaxed text-ink-secondary">
          Regras que reagem a eventos do sistema e criam alertas sem intervenção manual.{' '}
          <strong className="text-ink-primary">Atenção:</strong> não podem ser deletadas, apenas
          desativadas. Toda ativação, desativação, alteração de configuração e disparo é
          registrado em auditoria.
        </p>
      </Card>

      <div className="space-y-4">
        {rules.map((rule) => (
          <Card key={rule.ruleId}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    rule.ativo ? 'bg-brand-orange/15 text-brand-orange' : 'bg-bg-elevated text-ink-muted'
                  }`}
                >
                  <Bot size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-[15px] font-semibold text-ink-primary">{rule.displayName}</h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-secondary">{rule.description}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-muted">
                    <span className="rounded-full bg-bg-elevated px-2 py-0.5 font-mono">
                      gatilho: {rule.triggerEvent}
                    </span>
                    {rule.activatedAt && rule.ativo && (
                      <span>Ativada {formatRelative(rule.activatedAt)}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button
                  variant={rule.ativo ? 'ghost' : 'primary'}
                  onClick={() => toggle(rule)}
                  disabled={ativar.isPending || desativar.isPending}
                >
                  {rule.ativo ? (
                    <><PowerOff size={14} /> Desativar</>
                  ) : (
                    <><Power size={14} /> Ativar</>
                  )}
                </Button>
                <div className="flex gap-1.5">
                  {rule.parameters.length > 0 && (
                    <button
                      onClick={() => setConfiguring(rule)}
                      className="btn-icon"
                      title="Configurar parâmetros"
                    >
                      <Settings size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setLogRule(rule)}
                    className="btn-icon"
                    title="Ver histórico"
                  >
                    <History size={14} />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {configuring && (
        <ConfigModal
          rule={configuring}
          onClose={() => setConfiguring(null)}
        />
      )}
      {logRule && (
        <LogDrawer rule={logRule} onClose={() => setLogRule(null)} />
      )}
    </div>
  );
}

function defaultConfig(rule: AlertaAutomaticoDTO): Record<string, unknown> {
  const cfg: Record<string, unknown> = {};
  for (const p of rule.parameters) cfg[p.name] = p.defaultValue;
  return cfg;
}

function ConfigModal({ rule, onClose }: { rule: AlertaAutomaticoDTO; onClose: () => void }) {
  const atualizar = useAtualizarConfigAutomatico();
  const [config, setConfig] = useState<Record<string, unknown>>(
    rule.config ?? defaultConfig(rule),
  );

  async function save() {
    try {
      await atualizar.mutateAsync({ ruleId: rule.ruleId, config });
      toast.success('Configuração atualizada');
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-bg-primary p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-ink-primary">Configurar regra</h3>
            <p className="mt-1 text-[12px] text-ink-secondary">{rule.displayName}</p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={14} />
          </button>
        </div>
        <div className="space-y-3">
          {rule.parameters.map((p) => (
            <ParameterField
              key={p.name}
              parameter={p}
              value={config[p.name]}
              onChange={(v) => setConfig((c) => ({ ...c, [p.name]: v }))}
            />
          ))}
          {rule.parameters.length === 0 && (
            <p className="text-[13px] text-ink-muted">Esta regra não possui parâmetros configuráveis.</p>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={atualizar.isPending}>Salvar</Button>
        </div>
      </div>
    </div>
  );
}

function ParameterField({
  parameter,
  value,
  onChange,
}: {
  parameter: AlertaAutomaticoRuleParameter;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (parameter.type === 'boolean') {
    return (
      <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-secondary">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        {parameter.label}
      </label>
    );
  }
  if (parameter.type === 'number') {
    return (
      <div>
        <label className="mb-1 block text-[12px] text-ink-secondary">{parameter.label}</label>
        <input
          type="number"
          className="input"
          value={value as number | undefined ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        />
      </div>
    );
  }
  if (parameter.type === 'enum' && parameter.options) {
    return (
      <div>
        <label className="mb-1 block text-[12px] text-ink-secondary">{parameter.label}</label>
        <select
          className="input"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
          {parameter.options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    );
  }
  return (
    <div>
      <label className="mb-1 block text-[12px] text-ink-secondary">{parameter.label}</label>
      <input
        className="input"
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function LogDrawer({ rule, onClose }: { rule: AlertaAutomaticoDTO; onClose: () => void }) {
  const { data, isLoading } = useAlertaAutomaticoLog(rule.ruleId);
  return (
    <div className="fixed inset-0 z-[600] bg-black/60" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-[440px] overflow-y-auto border-l border-white/10 bg-bg-primary p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-ink-primary">Histórico</h3>
            <p className="mt-1 text-[12px] text-ink-secondary">{rule.displayName}</p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={14} />
          </button>
        </div>
        {isLoading && <Skeleton className="h-40 w-full" />}
        {!isLoading && (data?.content.length ?? 0) === 0 && (
          <p className="text-[13px] text-ink-muted">Nenhum registro ainda.</p>
        )}
        <ul className="space-y-2">
          {data?.content.map((entry) => (
            <li
              key={entry.id}
              className="rounded-md border border-white/10 bg-bg-elevated/50 p-3 text-[12px]"
            >
              <div className="flex items-center justify-between">
                <span className={`font-mono font-semibold ${ACAO_COLOR[entry.acao]}`}>
                  {entry.acao}
                </span>
                <span className="text-ink-muted">{formatRelative(entry.createdAt)}</span>
              </div>
              {entry.alertaId && (
                <p className="mt-1 text-ink-secondary">
                  Alerta: <span className="font-mono">{entry.alertaId.slice(0, 12)}…</span>
                </p>
              )}
              {entry.payload && (
                <pre className="mt-1 overflow-x-auto text-[10px] text-ink-muted">
                  {JSON.stringify(entry.payload, null, 2)}
                </pre>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const ACAO_COLOR: Record<string, string> = {
  ATIVADO: 'text-emerald-400',
  DESATIVADO: 'text-ink-muted',
  CONFIG_ALTERADO: 'text-blue-400',
  DISPAROU: 'text-brand-orange',
  ERRO: 'text-rose-400',
};
