import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Power, Save, XCircle } from 'lucide-react';
import {
  Button,
  Card,
  ErrorState,
  SectionHeader,
  Skeleton,
} from '@/components/ui';
import { useAppConfig, useAtualizarAppConfig } from '@/hooks/useAppConfig';
import { useAuthStore } from '@/store/authStore';
import { apiErrorMessage } from '@/lib/api';

export function AppConfigPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useAppConfig();
  const atualizar = useAtualizarAppConfig();
  const [enabledChannels, setEnabledChannels] = useState<string[]>([]);

  useEffect(() => {
    if (data) setEnabledChannels(data.canaisHabilitados);
  }, [data]);

  if (!user || user.role !== 'ADMIN') {
    return (
      <ErrorState
        title="Acesso restrito"
        description="Apenas ADMIN pode visualizar a configuração global."
      />
    );
  }
  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (isError) {
    return (
      <ErrorState
        title="Erro ao carregar configuração"
        action={<Button onClick={() => refetch()}>Tentar novamente</Button>}
      />
    );
  }
  if (!data) return null;

  async function toggleDisaster() {
    if (!data) return;
    try {
      const next = await atualizar.mutateAsync({ disasterModeAtivo: !data.disasterModeAtivo });
      toast.success(`Modo desastre ${next.disasterModeAtivo ? 'ATIVADO' : 'desativado'}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function saveChannels() {
    try {
      await atualizar.mutateAsync({ canaisHabilitados: enabledChannels });
      toast.success('Canais atualizados');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  function toggleChannel(id: string) {
    setEnabledChannels((p) => (p.includes(id) ? p.filter((c) => c !== id) : [...p, id]));
  }

  return (
    <div className="max-w-3xl">
      <SectionHeader eyebrow="Administração" title="Configuração global" />

      {data.disasterModeAtivo && (
        <Card className="mb-4 border-rose-500/40 bg-rose-500/10">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="mt-0.5 text-rose-400" />
            <div>
              <p className="text-[14px] font-semibold text-ink-primary">
                Modo desastre ATIVO
              </p>
              <p className="mt-1 text-[12px] text-ink-secondary">
                Jobs agendados e regras automáticas estão pausados. Apenas alertas criados
                manualmente são processados. Desative quando a situação se normalizar.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[14px] font-semibold text-ink-primary">Modo desastre</h3>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-secondary">
              Quando ativo: agendamentos não disparam, regras automáticas ficam silenciosas, e a
              expansão automática de raio pausa. Útil em sobrecarga ou para suprimir fan-out
              durante manutenção. Alertas criados manualmente continuam funcionando.
            </p>
          </div>
          <Button
            variant={data.disasterModeAtivo ? 'ghost' : 'primary'}
            onClick={toggleDisaster}
            disabled={atualizar.isPending}
          >
            <Power size={14} />
            {data.disasterModeAtivo ? 'Desativar' : 'Ativar'}
          </Button>
        </div>
      </Card>

      <Card className="mb-4">
        <h3 className="text-[14px] font-semibold text-ink-primary">Canais de notificação</h3>
        <p className="mt-1 text-[12px] text-ink-secondary">
          Marque os canais que devem receber o fan-out de cada alerta. Canais sem credenciais
          configuradas (healthy = false) ainda podem ser ativados mas marcarão envios como IGNORADO.
        </p>
        <div className="mt-3 space-y-2">
          {data.canaisDisponiveis.map((ch) => (
            <label
              key={ch.id}
              className={`flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-[12px] ${
                enabledChannels.includes(ch.id)
                  ? 'border-brand-light bg-brand-blue-soft text-ink-primary'
                  : 'border-white/10 text-ink-secondary hover:border-white/20'
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enabledChannels.includes(ch.id)}
                  onChange={() => toggleChannel(ch.id)}
                />
                <span className="font-mono font-semibold">{ch.id}</span>
              </span>
              {ch.healthy ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 size={13} /> ok
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400">
                  <XCircle size={13} /> sem configuração
                </span>
              )}
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={saveChannels} disabled={atualizar.isPending}>
            <Save size={14} /> Salvar canais
          </Button>
        </div>
      </Card>

      {Object.keys(data.outros).length > 0 && (
        <Card>
          <h3 className="text-[14px] font-semibold text-ink-primary">Outras chaves</h3>
          <pre className="mt-2 overflow-x-auto rounded-md bg-bg-elevated p-3 text-[11px] text-ink-secondary">
            {JSON.stringify(data.outros, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
