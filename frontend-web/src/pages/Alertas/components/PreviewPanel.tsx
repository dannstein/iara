import { useState } from 'react';
import { AlertTriangle, Send, Eye, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button, Card } from '@/components/ui';
import { apiErrorMessage } from '@/lib/api';
import type { AlertaPreviewDTO } from '@/types/api';

interface Props<TInput> {
  /** Constrói o payload a partir do estado atual do form. Retorna null se inválido. */
  buildPayload: () => TInput | null;
  /** Hook de preview que recebe o input e retorna AlertaPreviewDTO. */
  previewMutation: ReturnType<typeof useMutation<AlertaPreviewDTO, unknown, TInput>>;
  /** Confirma criação (chama a mutation real). */
  onConfirm: (input: TInput) => Promise<void>;
  /** Label do botão final. Default: "Disparar alerta". */
  confirmLabel?: string;
}

/**
 * Pipeline de criação em 2 passos:
 *  1) Usuário clica "Pré-visualizar"  → roda targeting e mostra contagem
 *  2) Usuário clica "Confirmar"       → cria de verdade
 * O preview pode ser refeito quantas vezes quiser (não consome cooldown).
 */
export function PreviewPanel<TInput>({
  buildPayload,
  previewMutation,
  onConfirm,
  confirmLabel = 'Disparar alerta',
}: Props<TInput>) {
  const [preview, setPreview] = useState<AlertaPreviewDTO | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmedPayload, setConfirmedPayload] = useState<TInput | null>(null);

  async function handlePreview() {
    const payload = buildPayload();
    if (!payload) return;
    try {
      const result = await previewMutation.mutateAsync(payload);
      setPreview(result);
      setConfirmedPayload(payload);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleConfirm() {
    if (!confirmedPayload) return;
    setConfirming(true);
    try {
      await onConfirm(confirmedPayload);
    } finally {
      setConfirming(false);
    }
  }

  function reset() {
    setPreview(null);
    setConfirmedPayload(null);
  }

  if (!preview) {
    return (
      <div className="flex justify-end">
        <Button onClick={handlePreview} disabled={previewMutation.isPending}>
          {previewMutation.isPending ? (
            <><Loader2 size={14} className="animate-spin" /> Calculando…</>
          ) : (
            <><Eye size={14} /> Pré-visualizar destinatários</>
          )}
        </Button>
      </div>
    );
  }

  const rolesEntries = Object.entries(preview.porRole).sort((a, b) => b[1] - a[1]);
  const tenantEntries = Object.entries(preview.porTenant).sort((a, b) => b[1] - a[1]);

  return (
    <Card className="border-brand-light/30">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
          Pré-visualização
        </h3>
        <button onClick={reset} className="text-[11px] text-ink-muted hover:text-ink-secondary">
          Editar form
        </button>
      </div>

      <div className="mb-4 flex items-baseline gap-2">
        <span className="font-mono text-[36px] font-bold text-brand-light">
          {preview.totalDestinatarios}
        </span>
        <span className="text-[13px] text-ink-secondary">
          destinatário{preview.totalDestinatarios !== 1 ? 's' : ''} receberá{preview.totalDestinatarios !== 1 ? 'ão' : ''} este alerta
        </span>
      </div>

      {preview.cooldownAtivo && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-[12px] text-yellow-200">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          <span>
            Cooldown ativo — um alerta semelhante foi enviado recentemente. Tente confirmar mesmo assim
            (será mesclado) ou aguarde a janela acabar.
          </span>
        </div>
      )}

      {preview.totalDestinatarios > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {rolesEntries.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                Por perfil
              </p>
              <div className="space-y-1">
                {rolesEntries.map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between text-[12px]">
                    <span className="text-ink-secondary">{role}</span>
                    <span className="font-mono text-ink-primary">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tenantEntries.length > 1 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                Por tenant
              </p>
              <div className="space-y-1">
                {tenantEntries.slice(0, 5).map(([tenantId, count]) => (
                  <div key={tenantId} className="flex items-center justify-between text-[12px]">
                    <span className="truncate font-mono text-ink-secondary">{tenantId.slice(0, 8)}…</span>
                    <span className="font-mono text-ink-primary">{count}</span>
                  </div>
                ))}
                {tenantEntries.length > 5 && (
                  <p className="text-[11px] text-ink-muted">+ {tenantEntries.length - 5} outros</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={handlePreview} disabled={previewMutation.isPending}>
          <Eye size={14} /> Recalcular
        </Button>
        <Button onClick={handleConfirm} disabled={confirming || preview.totalDestinatarios === 0}>
          {confirming ? (
            <><Loader2 size={14} className="animate-spin" /> Enviando…</>
          ) : (
            <><Send size={14} /> {confirmLabel}</>
          )}
        </Button>
      </div>
    </Card>
  );
}
