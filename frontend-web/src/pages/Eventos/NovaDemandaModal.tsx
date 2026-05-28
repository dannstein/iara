import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Package } from 'lucide-react';
import { Modal, Button, Input, Select, FormField } from '@/components/ui';
import { api, apiErrorMessage } from '@/lib/api';
import { useEventoPontosColeta } from '@/hooks/useEventos';
import { useDemandaTipos } from '@/hooks/useLookups';
import type { DemandaDTO, DemandaPrioridade } from '@/types/api';

const PRIORIDADES: DemandaPrioridade[] = ['CRITICA', 'ALTA', 'MEDIA', 'BAIXA'];

const schema = z.object({
  idPc: z.string().min(1, 'Selecione o ponto de coleta'),
  idTipo: z.string().min(1, 'Selecione o tipo de demanda'),
  prioridade: z.enum(['CRITICA', 'ALTA', 'MEDIA', 'BAIXA']),
  qtdSolicitada: z.coerce.number().int().positive('Informe a quantidade'),
  descricao: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  eventoId: string;
}

export function NovaDemandaModal({ open, onClose, eventoId }: Props) {
  const qc = useQueryClient();
  // Apenas PCs que ACEITARAM o vínculo com este evento (demanda só pode ser criada nesses).
  const pcs = useEventoPontosColeta(eventoId, 'ACEITO');
  const tipos = useDemandaTipos();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { prioridade: 'MEDIA', qtdSolicitada: 1 },
  });

  const criar = useMutation({
    mutationFn: (data: FormData) =>
      api
        .post<DemandaDTO>(`/pontos-coleta/${data.idPc}/demandas`, {
          idEvento: eventoId,
          idTipo: data.idTipo,
          prioridade: data.prioridade,
          qtdSolicitada: data.qtdSolicitada,
          descricao: data.descricao || undefined,
        })
        .then((r) => r.data),
    onSuccess: (_d, data) => {
      qc.invalidateQueries({ queryKey: ['evento', eventoId, 'mural'] });
      qc.invalidateQueries({ queryKey: ['ponto-coleta', data.idPc, 'demandas'] });
      toast.success('Demanda vinculada ao ponto de coleta.');
      reset();
      onClose();
    },
    onError: (e) =>
      toast.error(
        apiErrorMessage(
          e,
          'Falha ao criar demanda. O ponto de coleta precisa ter aceitado o vínculo com este evento.',
        ),
      ),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Vincular demanda a um Ponto de Coleta"
      eyebrow="Nova demanda"
      icon={<Package size={16} />}
      maxWidth="max-w-lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit((d) => criar.mutate(d))} loading={criar.isPending}>
            Criar demanda
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit((d) => criar.mutate(d))} className="flex flex-col gap-4">
        <FormField
          label="Ponto de Coleta (que aceitaram o evento)"
          required
          hint="Apenas PCs que aceitaram ajudar neste evento podem receber demandas."
          error={errors.idPc?.message}
        >
          <Select {...register('idPc')} defaultValue="" disabled={(pcs.data?.length ?? 0) === 0}>
            <option value="" disabled>
              {pcs.isLoading
                ? 'Carregando…'
                : (pcs.data?.length ?? 0) === 0
                  ? 'Nenhum PC aceitou este evento ainda'
                  : 'Selecione…'}
            </option>
            {pcs.data?.map((pc) => (
              <option key={pc.id} value={pc.id}>
                {pc.pcNome}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Tipo de demanda" required error={errors.idTipo?.message}>
            <Select {...register('idTipo')} defaultValue="">
              <option value="" disabled>
                Selecione…
              </option>
              {tipos.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Prioridade" required error={errors.prioridade?.message}>
            <Select {...register('prioridade')}>
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label="Quantidade solicitada" required error={errors.qtdSolicitada?.message}>
          <Input type="number" min={1} {...register('qtdSolicitada')} />
        </FormField>

        <FormField label="Descrição" error={errors.descricao?.message}>
          <Input placeholder="Detalhes (opcional)" {...register('descricao')} />
        </FormField>
      </form>
    </Modal>
  );
}
