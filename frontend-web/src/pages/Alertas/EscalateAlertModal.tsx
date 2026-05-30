import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Siren } from 'lucide-react';
import { Button, FormField, Modal, Select } from '@/components/ui';
import { useMe, useTenant } from '@/hooks/useUsuarios';
import { useTenantHierarquia, type TenantNodeDTO } from '@/hooks/useTenants';
import { useEscalateAlert } from '@/hooks/useAlertas';
import { apiErrorMessage } from '@/lib/api';
import type { AlertaDTO, EscalateAlertInput } from '@/types/api';

interface Props {
  alerta: AlertaDTO;
  open: boolean;
  onClose: () => void;
  onEscalated: (newAlertaId: string) => void;
}

/** Acha todos os ancestrais de `targetId` na árvore. */
function findAncestors(root: TenantNodeDTO | null | undefined, targetId: string): TenantNodeDTO[] {
  if (!root) return [];
  const stack: { node: TenantNodeDTO; path: TenantNodeDTO[] }[] = [{ node: root, path: [] }];
  while (stack.length > 0) {
    const { node, path } = stack.pop()!;
    if (node.id === targetId) return path;
    for (const f of node.filhos) {
      stack.push({ node: f, path: [...path, node] });
    }
  }
  return [];
}

const SEVERIDADES = ['DANGER', 'CRITICAL', 'EMERGENCY'] as const;

export function EscalateAlertModal({ alerta, open, onClose, onEscalated }: Props) {
  const me = useMe();
  const myTenant = useTenant(me.data?.tenantId);
  const tree = useTenantHierarquia();
  const escalate = useEscalateAlert();

  const ancestors = useMemo(() => {
    if (!me.data?.tenantId) return [];
    return findAncestors(tree.data, me.data.tenantId);
  }, [tree.data, me.data?.tenantId]);

  const [idTenantAlvo, setIdTenantAlvo] = useState('');
  const [severidade, setSeveridade] = useState<EscalateAlertInput['severidade']>('CRITICAL');
  const [motivo, setMotivo] = useState('');
  const [titulo, setTitulo] = useState(alerta.titulo ?? '');
  const [mensagem, setMensagem] = useState(alerta.mensagem);
  const [confirm, setConfirm] = useState(false);

  async function submit() {
    if (!idTenantAlvo) return toast.error('Selecione o tenant ancestral');
    if (motivo.trim().length < 20) return toast.error('Motivo precisa ter no mínimo 20 caracteres');
    if (!titulo.trim() || !mensagem.trim()) return toast.error('Título e mensagem são obrigatórios');
    if (!confirm) return toast.error('Confirme que entendeu a auditoria permanente');
    try {
      const created = await escalate.mutateAsync({
        idTenantAlvo,
        severidade,
        motivo: motivo.trim(),
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        idEvento: alerta.idEvento ?? undefined,
        idZonaRisco: alerta.idZonaRisco ?? undefined,
      });
      toast.success('Escalonamento enviado e auditado');
      onEscalated(created.id);
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  const fromTenantName = myTenant.data?.nome ?? '—';

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Comunicação"
      title="Escalonar alerta"
      icon={<Siren size={16} />}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" onClick={submit} disabled={escalate.isPending}>
            {escalate.isPending ? 'Escalando…' : 'Confirmar escalonamento'}
          </Button>
        </>
      }
    >
      <div className="mb-4 flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-[12px] text-yellow-200">
        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
        <div>
          <strong>Esta ação será auditada permanentemente.</strong> Quem escalou, de qual tenant,
          para qual tenant, o motivo e o timestamp ficam registrados em log imutável de
          compliance. Use somente para emergências que exigem ação imediata de uma camada
          superior da hierarquia.
        </div>
      </div>

      <div className="space-y-4">
        <FormField label="De" hint="Seu tenant atual.">
          <input className="input" value={fromTenantName} disabled />
        </FormField>

        <FormField label="Para (tenant ancestral)" required>
          <Select value={idTenantAlvo} onChange={(e) => setIdTenantAlvo(e.target.value)}>
            <option value="">Selecione…</option>
            {ancestors.length === 0 && <option disabled>Sem ancestrais (você está no topo)</option>}
            {ancestors.map((t) => (
              <option key={t.id} value={t.id}>{t.nome} ({t.tipo})</option>
            ))}
          </Select>
        </FormField>

        <FormField label="Severidade" required>
          <Select value={severidade} onChange={(e) => setSeveridade(e.target.value as EscalateAlertInput['severidade'])}>
            {SEVERIDADES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Motivo do escalonamento"
          required
          hint={`Mínimo 20 caracteres. Atual: ${motivo.length}/20.`}
        >
          <textarea
            className="input min-h-[80px]"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Explique por que esta situação precisa do tenant ancestral…"
          />
        </FormField>

        <FormField label="Título" required>
          <input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={200} />
        </FormField>

        <FormField label="Mensagem" required>
          <textarea
            className="input min-h-[80px]"
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
          />
        </FormField>

        <label className="flex items-start gap-2 text-[12px] text-ink-secondary">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
          />
          Confirmo que entendi que esta ação será permanentemente auditada e atinge os
          gestores do tenant ancestral.
        </label>
      </div>
    </Modal>
  );
}
