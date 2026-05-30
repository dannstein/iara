import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ChevronRight, Sparkles } from 'lucide-react';
import {
  Button,
  Card,
  FormField,
  SectionHeader,
} from '@/components/ui';
import { useCriarAgendamento } from '@/hooks/useAgendamentos';
import { useAlertaTemplate } from '@/hooks/useAlertas';
import { apiErrorMessage } from '@/lib/api';
import type { AlertaCategoria, RecurrenceType } from '@/types/api';
import { CATEGORIA, SEVERITY } from './components/severity';
import { RecurrencePicker, type RecurrenceValue } from './components/RecurrencePicker';

const CATEGORIES: AlertaCategoria[] = [
  'DANGER_ZONE', 'EVENT_ZONE', 'TENANT_BROADCAST', 'TECHNICAL_REQUEST',
  'SUPPORT_POINTS', 'COLLECTION_POINTS', 'MONITORS', 'PERSONALIZED',
];

/** Exemplo de payload mínimo por categoria — pré-preenche o JSON editor. */
const DEFAULT_PAYLOAD: Record<AlertaCategoria, object> = {
  DANGER_ZONE: { idZonaRisco: '<uuid>', severidade: 'WARNING', geofenceModes: ['INSIDE', 'NEAR'] },
  EVENT_ZONE:  { idEvento: '<uuid>', severidade: 'WARNING', geofenceModes: ['INSIDE'] },
  TENANT_BROADCAST: { idTenantAlvo: '<uuid>', severidade: 'INFO', mensagem: 'Texto do aviso' },
  TECHNICAL_REQUEST: { idEvento: '<uuid>', ackMinimo: 5 },
  SUPPORT_POINTS: { idZonaRisco: '<uuid>', escopoTipo: 'ZONA', severidade: 'WARNING' },
  COLLECTION_POINTS: { idEvento: '<uuid>', escopoTipo: 'EVENTO', severidade: 'INFO' },
  MONITORS: { escopoTipo: 'TENANT', severidade: 'OPERATIONAL' },
  PERSONALIZED: { severidade: 'INFO', titulo: 'Título', mensagem: 'Mensagem' },
  ESCALATION: {},
};

export function NovoAgendamentoPage() {
  const navigate = useNavigate();
  const criar = useCriarAgendamento();

  const [categoria, setCategoria] = useState<AlertaCategoria | null>(null);
  const [nome, setNome] = useState('');
  const [payloadJson, setPayloadJson] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceValue>({
    tipoRecorrencia: 'DAILY',
    inicio: new Date(Date.now() + 5 * 60_000).toISOString().slice(0, 16),
    horario: '09:00',
  });

  const tmpl = useAlertaTemplate(categoria ?? undefined);

  // Quando muda categoria: pre-fill nome e JSON
  useEffect(() => {
    if (!categoria) return;
    setNome(`Agendamento — ${CATEGORIA[categoria].label}`);
    setPayloadJson(JSON.stringify(DEFAULT_PAYLOAD[categoria] ?? {}, null, 2));
  }, [categoria]);

  const parsedPayload = useMemo(() => {
    try { return { ok: true as const, value: JSON.parse(payloadJson || '{}') }; }
    catch (e) { return { ok: false as const, error: String(e) }; }
  }, [payloadJson]);

  function applyTemplateToJson() {
    if (!tmpl.data || !categoria) return;
    try {
      const current = JSON.parse(payloadJson || '{}');
      const next = { ...current, titulo: tmpl.data.titulo, mensagem: tmpl.data.mensagem };
      setPayloadJson(JSON.stringify(next, null, 2));
    } catch {
      toast.error('Payload JSON inválido — corrija antes de aplicar template');
    }
  }

  async function submit() {
    if (!categoria) return;
    if (!nome.trim()) { toast.error('Nome obrigatório'); return; }
    if (!parsedPayload.ok) { toast.error('Payload JSON inválido'); return; }
    if (!recurrence.inicio) { toast.error('Início obrigatório'); return; }
    if (recurrence.tipoRecorrencia === 'WEEKLY' && recurrence.diaSemana == null) {
      toast.error('WEEKLY exige dia da semana'); return;
    }
    if (recurrence.tipoRecorrencia === 'MONTHLY' && recurrence.diaMes == null) {
      toast.error('MONTHLY exige dia do mês'); return;
    }
    if (recurrence.tipoRecorrencia === 'HOURLY' && !recurrence.intervaloHoras) {
      toast.error('HOURLY exige intervalo em horas'); return;
    }
    if (['DAILY', 'WEEKLY', 'MONTHLY'].includes(recurrence.tipoRecorrencia) && !recurrence.horario) {
      toast.error(`${recurrence.tipoRecorrencia} exige horário`); return;
    }
    try {
      const created = await criar.mutateAsync({
        nome,
        categoria,
        payload: parsedPayload.value,
        tipoRecorrencia: recurrence.tipoRecorrencia as RecurrenceType,
        inicio: new Date(recurrence.inicio).toISOString(),
        fim: recurrence.fim ? new Date(recurrence.fim).toISOString() : undefined,
        horario: recurrence.horario ? `${recurrence.horario}:00` : undefined,
        diaSemana: recurrence.diaSemana,
        diaMes: recurrence.diaMes,
        intervaloHoras: recurrence.intervaloHoras,
      });
      toast.success(`Agendamento criado — próximo disparo: ${new Date(created.proximaExecucao).toLocaleString('pt-BR')}`);
      navigate('/alertas/agendamentos');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Comunicação"
        title={categoria ? `Novo agendamento — ${CATEGORIA[categoria].label}` : 'Novo agendamento'}
        action={
          <Button
            variant="secondary"
            onClick={() => (categoria ? setCategoria(null) : navigate('/alertas/agendamentos'))}
          >
            <ArrowLeft size={14} /> {categoria ? 'Trocar categoria' : 'Voltar'}
          </Button>
        }
      />

      {!categoria && (
        <>
          <p className="mb-5 text-[13px] text-ink-secondary">
            Escolha a categoria do alerta que será disparado pelo agendamento.
            Você define o conteúdo na próxima etapa.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const meta = CATEGORIA[cat];
              const Icon = meta.icon;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoria(cat)}
                  className="group flex items-start gap-3 rounded-xl border border-white/[0.08] bg-bg-secondary p-4 text-left transition-all hover:-translate-y-px hover:border-white/14"
                >
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ background: SEVERITY.SOLICITATION.glow, color: SEVERITY.SOLICITATION.color }}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[14px] font-semibold text-ink-primary">{meta.label}</h3>
                    <p className="mt-0.5 text-[12px] text-ink-secondary">{meta.description}</p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="mt-2 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </button>
              );
            })}
          </div>
        </>
      )}

      {categoria && (
        <div className="space-y-4">
          <Card>
            <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
              Identificação
            </h3>
            <FormField label="Nome do agendamento" required hint="Para identificação no painel — não é enviado aos destinatários.">
              <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={200} />
            </FormField>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
                Payload (JSON)
              </h3>
              {tmpl.data && (tmpl.data.titulo || tmpl.data.mensagem) && (
                <button
                  type="button"
                  onClick={applyTemplateToJson}
                  className="inline-flex items-center gap-1.5 rounded-md border border-brand-light/30 bg-brand-blue-soft px-2.5 py-1 text-[11px] font-medium text-brand-light hover:bg-brand-light/15"
                >
                  <Sparkles size={12} /> Adicionar template padrão
                </button>
              )}
            </div>
            <p className="mb-3 text-[12px] text-ink-muted">
              JSON do request da categoria <strong>{categoria}</strong>. Substitua os <code>&lt;uuid&gt;</code>
              pelos ids reais. Validação ocorre no momento do disparo.
            </p>
            <textarea
              className="input min-h-[200px] font-mono text-[12px]"
              value={payloadJson}
              onChange={(e) => setPayloadJson(e.target.value)}
              spellCheck={false}
            />
            {!parsedPayload.ok && (
              <p className="mt-2 text-[12px] text-severity-critica">JSON inválido: {parsedPayload.error}</p>
            )}
          </Card>

          <Card>
            <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
              Recorrência
            </h3>
            <RecurrencePicker value={recurrence} onChange={setRecurrence} />
          </Card>

          <div className="flex justify-end">
            <Button onClick={submit} disabled={criar.isPending || !parsedPayload.ok}>
              {criar.isPending ? 'Salvando…' : 'Criar agendamento'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
