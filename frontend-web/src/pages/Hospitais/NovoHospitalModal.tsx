import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Cross } from 'lucide-react';
import { Modal, Button, Input, Select, FormField } from '@/components/ui';
import { LocationPicker } from '@/components/LocationPicker';
import { useCriarHospital } from '@/hooks/useHospitais';
import { apiErrorMessage } from '@/lib/api';
import type { Coordenadas, HospitalTipo } from '@/types/api';

const TIPOS: HospitalTipo[] = ['PUBLICO', 'PRIVADO', 'MISTO', 'CAMPANHA'];

const schema = z.object({
  nome: z.string().min(3, 'Informe o nome'),
  cnes: z.string().optional(),
  tipo: z.enum(['PUBLICO', 'PRIVADO', 'MISTO', 'CAMPANHA']),
  contato: z.string().optional(),
  leitosTotal: z.coerce.number().int().min(0).optional(),
  leitosDisponiveis: z.coerce.number().int().min(0).optional(),
  leitosUti: z.coerce.number().int().min(0).optional(),
  leitosUtiDisp: z.coerce.number().int().min(0).optional(),
  aceitaCampanha: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export function NovoHospitalModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const criar = useCriarHospital();
  const [coords, setCoords] = useState<Coordenadas | null>(null);
  const [coordsError, setCoordsError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { tipo: 'PUBLICO' } });

  function close() {
    reset();
    setCoords(null);
    setCoordsError(null);
    onClose();
  }

  function onSubmit(data: FormData) {
    if (!coords) {
      setCoordsError('Defina a localização do hospital.');
      return;
    }
    criar.mutate(
      { ...data, coordenadas: coords },
      {
        onSuccess: () => {
          toast.success('Hospital cadastrado.');
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
      title="Novo Hospital"
      eyebrow="Infraestrutura"
      icon={<Cross size={16} />}
      maxWidth="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={criar.isPending}>
            Criar hospital
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Nome" required error={errors.nome?.message}>
            <Input placeholder="Ex.: Hospital Municipal" {...register('nome')} />
          </FormField>
          <FormField label="Tipo" required>
            <Select {...register('tipo')}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="CNES" error={errors.cnes?.message}>
            <Input placeholder="Código CNES (opcional)" {...register('cnes')} />
          </FormField>
          <FormField label="Contato" error={errors.contato?.message}>
            <Input placeholder="Telefone (opcional)" {...register('contato')} />
          </FormField>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <FormField label="Leitos" error={errors.leitosTotal?.message}>
            <Input type="number" min={0} {...register('leitosTotal')} />
          </FormField>
          <FormField label="Disponíveis" error={errors.leitosDisponiveis?.message}>
            <Input type="number" min={0} {...register('leitosDisponiveis')} />
          </FormField>
          <FormField label="UTI" error={errors.leitosUti?.message}>
            <Input type="number" min={0} {...register('leitosUti')} />
          </FormField>
          <FormField label="UTI disp." error={errors.leitosUtiDisp?.message}>
            <Input type="number" min={0} {...register('leitosUtiDisp')} />
          </FormField>
        </div>

        <label className="flex items-center gap-2 text-[13px] text-ink-secondary">
          <input type="checkbox" className="h-3.5 w-3.5 accent-brand-dark" {...register('aceitaCampanha')} />
          Aceita hospital de campanha
        </label>

        <FormField label="Localização" required error={coordsError ?? undefined}>
          <LocationPicker
            value={coords}
            onChange={(c) => {
              setCoords(c);
              setCoordsError(null);
            }}
          />
        </FormField>
      </form>
    </Modal>
  );
}
