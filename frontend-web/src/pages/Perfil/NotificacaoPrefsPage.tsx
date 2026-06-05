import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BellOff, Save, ShieldAlert } from 'lucide-react';
import { Button, Card, ErrorState, SectionHeader, Skeleton } from '@/components/ui';
import {
  useAtualizarNotificacaoPrefs,
  useNotificacaoPrefs,
} from '@/hooks/useNotificacaoPrefs';
import { apiErrorMessage } from '@/lib/api';
import type { AlertaCategoria, AlertaSeveridade } from '@/types/api';

const CATEGORIAS: { value: AlertaCategoria; label: string }[] = [
  { value: 'DANGER_ZONE', label: 'Zona de risco' },
  { value: 'EVENT_ZONE', label: 'Evento ativo' },
  { value: 'TENANT_BROADCAST', label: 'Comunicado geral' },
  { value: 'TECHNICAL_REQUEST', label: 'Convocação técnica' },
  { value: 'SUPPORT_POINTS', label: 'Pontos de apoio' },
  { value: 'COLLECTION_POINTS', label: 'Pontos de coleta' },
  { value: 'MONITORS', label: 'Monitoramento' },
  { value: 'PERSONALIZED', label: 'Personalizado' },
];

const SEVERIDADES: { value: AlertaSeveridade; label: string }[] = [
  { value: 'INFO', label: 'INFO — informativo' },
  { value: 'WARNING', label: 'WARNING — aviso' },
  { value: 'DANGER', label: 'DANGER — perigo' },
  { value: 'SOLICITATION', label: 'SOLICITATION — solicitação' },
  { value: 'OPERATIONAL', label: 'OPERATIONAL — operacional' },
];

export function NotificacaoPrefsPage() {
  const { data, isLoading, isError, refetch } = useNotificacaoPrefs();
  const atualizar = useAtualizarNotificacaoPrefs();

  const [categorias, setCategorias] = useState<string[]>([]);
  const [severidades, setSeveridades] = useState<string[]>([]);
  const [naoPerturbe, setNaoPerturbe] = useState(false);

  useEffect(() => {
    if (data) {
      setCategorias(data.categoriasSilenciadas);
      setSeveridades(data.severidadesSilenciadas);
      setNaoPerturbe(data.naoPerturbe);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (isError) {
    return (
      <ErrorState
        title="Erro ao carregar preferências"
        action={<Button onClick={() => refetch()}>Tentar novamente</Button>}
      />
    );
  }

  function toggle(list: string[], v: string): string[] {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  }

  async function save() {
    try {
      await atualizar.mutateAsync({
        categoriasSilenciadas: categorias,
        severidadesSilenciadas: severidades,
        naoPerturbe,
      });
      toast.success('Preferências salvas');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="max-w-3xl">
      <SectionHeader eyebrow="Perfil" title="Preferências de notificação" />

      <Card className="mb-4 border-rose-500/30 bg-rose-500/5">
        <p className="text-[12px] leading-relaxed text-ink-secondary">
          <strong className="text-ink-primary">EMERGENCY e CRITICAL sempre passam.</strong>{' '}
          Alertas com essas severidades ignoram qualquer opt-out — é uma exigência de
          segurança vital, não há como desabilitar.
        </p>
      </Card>

      <Card className="mb-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={naoPerturbe}
            onChange={(e) => setNaoPerturbe(e.target.checked)}
            className="h-4 w-4"
          />
          <div className="flex items-start gap-2">
            <BellOff size={16} className="mt-0.5 text-ink-muted" />
            <div>
              <p className="text-[14px] font-medium text-ink-primary">
                Modo não perturbe
              </p>
              <p className="mt-0.5 text-[12px] text-ink-secondary">
                Silencia todas as notificações exceto EMERGENCY. Útil para finais de semana
                ou férias.
              </p>
            </div>
          </div>
        </label>
      </Card>

      <Card className="mb-4">
        <h3 className="mb-3 text-[14px] font-semibold text-ink-primary">
          Categorias silenciadas
        </h3>
        <p className="mb-3 text-[12px] text-ink-secondary">
          Não receberei alertas destas categorias (a menos que sejam EMERGENCY).
        </p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {CATEGORIAS.map((c) => (
            <label
              key={c.value}
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-[12px] ${
                categorias.includes(c.value)
                  ? 'border-rose-500/40 bg-rose-500/10 text-ink-primary'
                  : 'border-white/10 text-ink-secondary hover:border-white/20'
              }`}
            >
              <input
                type="checkbox"
                checked={categorias.includes(c.value)}
                onChange={() => setCategorias((p) => toggle(p, c.value))}
              />
              {c.label}
            </label>
          ))}
        </div>
      </Card>

      <Card className="mb-4">
        <h3 className="mb-3 text-[14px] font-semibold text-ink-primary">
          Severidades silenciadas
        </h3>
        <p className="mb-3 text-[12px] text-ink-secondary">
          Silencia qualquer alerta dessa severidade independentemente da categoria.
        </p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {SEVERIDADES.map((s) => (
            <label
              key={s.value}
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-[12px] ${
                severidades.includes(s.value)
                  ? 'border-rose-500/40 bg-rose-500/10 text-ink-primary'
                  : 'border-white/10 text-ink-secondary hover:border-white/20'
              }`}
            >
              <input
                type="checkbox"
                checked={severidades.includes(s.value)}
                onChange={() => setSeveridades((p) => toggle(p, s.value))}
              />
              <ShieldAlert size={13} />
              {s.label}
            </label>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={atualizar.isPending}>
          <Save size={14} /> Salvar preferências
        </Button>
      </div>
    </div>
  );
}
