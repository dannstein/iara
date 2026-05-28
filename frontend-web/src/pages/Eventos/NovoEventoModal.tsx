import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { Modal, Button, Input, Select, FormField } from '@/components/ui';
import { LocationPicker } from '@/components/LocationPicker';
import { useCriarEvento } from '@/hooks/useEventos';
import { useDesastreTipos } from '@/hooks/useLookups';
import { apiErrorMessage } from '@/lib/api';
import type { Coordenadas, Severidade } from '@/types/api';

const SEVERIDADES: Severidade[] = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];

const schema = z.object({
  titulo: z.string().min(3, 'Informe um título'),
  descricao: z.string().optional(),
  idTipo: z.string().min(1, 'Selecione o tipo'),
  severidade: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA']),
  raioMetros: z.coerce.number().int().positive().optional(),
  isSimulado: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export function NovoEventoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const tipos = useDesastreTipos();
  const criar = useCriarEvento();
  const [coords, setCoords] = useState<Coordenadas | null>(null);
  const [coordsError, setCoordsError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { severidade: 'MEDIA', raioMetros: 3000 },
  });

  function close() {
    reset();
    setCoords(null);
    setCoordsError(null);
    onClose();
  }

  function onSubmit(data: FormData) {
    if (!coords) {
      setCoordsError('Defina a localização do evento.');
      return;
    }
    const tipo = tipos.data?.find((t) => t.id === data.idTipo);
    criar.mutate(
      {
        titulo: data.titulo,
        descricao: data.descricao || undefined,
        idTipo: data.idTipo,
        severidade: data.severidade,
        coordenadas: coords,
        raioMetros: data.raioMetros,
        cobradeCod: tipo?.cobradeCod,
        isSimulado: data.isSimulado,
      },
      {
        onSuccess: () => {
          toast.success('Evento criado (status SOLICITADO). Aprove-o para ativá-lo.');
          close();
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Abrir novo evento"
      eyebrow="Registro de ocorrência"
      icon={<AlertTriangle size={16} />}
      maxWidth="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={criar.isPending}>
            Criar evento
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField label="Título" required error={errors.titulo?.message}>
          <Input placeholder="Ex.: Enchente no bairro Centro" {...register('titulo')} />
        </FormField>

        <FormField label="Descrição" error={errors.descricao?.message}>
          <textarea
            className="input min-h-[72px] resize-y"
            placeholder="Detalhes da ocorrência (opcional)"
            {...register('descricao')}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Tipo (COBRADE)" required error={errors.idTipo?.message}>
            <Select {...register('idTipo')} defaultValue="">
              <option value="" disabled>
                Selecione…
              </option>
              {tipos.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                  {t.cobradeCod ? ` (${t.cobradeCod})` : ''}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Severidade" required error={errors.severidade?.message}>
            <Select {...register('severidade')}>
              {SEVERIDADES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label="Localização do evento" required error={coordsError ?? undefined}>
          <LocationPicker
            value={coords}
            onChange={(c) => {
              setCoords(c);
              setCoordsError(null);
            }}
          />
        </FormField>

        <FormField label="Raio afetado (m)" hint="Zona em torno do ponto" error={errors.raioMetros?.message}>
          <Input type="number" step="100" className="max-w-[180px]" {...register('raioMetros')} />
        </FormField>

        <label className="flex items-center gap-2 text-[13px] text-ink-secondary">
          <input type="checkbox" className="h-3.5 w-3.5 accent-brand-dark" {...register('isSimulado')} />
          Evento simulado (exercício — excluído dos KPIs reais)
        </label>
      </form>
    </Modal>
  );
}
