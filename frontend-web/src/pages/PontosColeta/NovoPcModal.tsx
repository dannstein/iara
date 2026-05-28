import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Package } from 'lucide-react';
import { Modal, Button, Input, Select, FormField } from '@/components/ui';
import { LocationPicker } from '@/components/LocationPicker';
import { useCriarPc } from '@/hooks/usePontosColeta';
import { apiErrorMessage } from '@/lib/api';
import type { Coordenadas, PcTipo } from '@/types/api';

const TIPOS: PcTipo[] = ['FIXO', 'TEMPORARIO'];

const schema = z.object({
  pcNome: z.string().min(3, 'Informe o nome'),
  pcTipo: z.enum(['FIXO', 'TEMPORARIO']),
  pcDesc: z.string().optional(),
  pcContato: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function NovoPcModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const criar = useCriarPc();
  const [coords, setCoords] = useState<Coordenadas | null>(null);
  const [coordsError, setCoordsError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { pcTipo: 'FIXO' } });

  function close() {
    reset();
    setCoords(null);
    setCoordsError(null);
    onClose();
  }

  function onSubmit(data: FormData) {
    if (!coords) {
      setCoordsError('Defina a localização do ponto de coleta.');
      return;
    }
    criar.mutate(
      {
        pcNome: data.pcNome,
        pcTipo: data.pcTipo,
        coordenadas: coords,
        pcDesc: data.pcDesc || undefined,
        pcContato: data.pcContato || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Ponto de coleta criado.');
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
      title="Novo Ponto de Coleta"
      eyebrow="Infraestrutura"
      icon={<Package size={16} />}
      maxWidth="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={criar.isPending}>
            Criar PC
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Nome" required error={errors.pcNome?.message}>
            <Input placeholder="Ex.: PC Ginásio Municipal" {...register('pcNome')} />
          </FormField>
          <FormField label="Tipo" required error={errors.pcTipo?.message}>
            <Select {...register('pcTipo')}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label="Contato" error={errors.pcContato?.message}>
          <Input placeholder="Telefone ou responsável (opcional)" {...register('pcContato')} />
        </FormField>

        <FormField label="Descrição" error={errors.pcDesc?.message}>
          <Input placeholder="Detalhes (opcional)" {...register('pcDesc')} />
        </FormField>

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
