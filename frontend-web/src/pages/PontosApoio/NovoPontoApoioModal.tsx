import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { LifeBuoy } from 'lucide-react';
import { Modal, Button, Input, FormField } from '@/components/ui';
import { LocationPicker } from '@/components/LocationPicker';
import { useCriarPontoApoio } from '@/hooks/usePontosApoio';
import { apiErrorMessage } from '@/lib/api';
import type { Coordenadas } from '@/types/api';

const schema = z.object({
  nome: z.string().min(3, 'Informe o nome'),
  descricao: z.string().optional(),
  contato: z.string().optional(),
  responsavel: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function NovoPontoApoioModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const criar = useCriarPontoApoio();
  const [coords, setCoords] = useState<Coordenadas | null>(null);
  const [coordsError, setCoordsError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  function close() {
    reset();
    setCoords(null);
    setCoordsError(null);
    onClose();
  }

  function onSubmit(data: FormData) {
    if (!coords) {
      setCoordsError('Defina a localização do ponto de apoio.');
      return;
    }
    criar.mutate(
      { ...data, coordenadas: coords },
      {
        onSuccess: () => {
          toast.success('Ponto de apoio criado.');
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
      title="Novo Ponto de Apoio"
      eyebrow="Infraestrutura"
      icon={<LifeBuoy size={16} />}
      maxWidth="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={criar.isPending}>
            Criar ponto de apoio
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField label="Nome" required error={errors.nome?.message}>
          <Input placeholder="Ex.: Base de Apoio Vila Nova" {...register('nome')} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Contato" error={errors.contato?.message}>
            <Input placeholder="Telefone (opcional)" {...register('contato')} />
          </FormField>
          <FormField label="Responsável" error={errors.responsavel?.message}>
            <Input placeholder="Nome (opcional)" {...register('responsavel')} />
          </FormField>
        </div>
        <FormField label="Descrição" error={errors.descricao?.message}>
          <Input placeholder="Detalhes (opcional)" {...register('descricao')} />
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
