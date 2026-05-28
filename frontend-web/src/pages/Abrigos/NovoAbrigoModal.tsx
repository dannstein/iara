import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Home } from 'lucide-react';
import { Modal, Button, Input, FormField } from '@/components/ui';
import { LocationPicker } from '@/components/LocationPicker';
import { useCriarAbrigo } from '@/hooks/useAbrigos';
import { apiErrorMessage } from '@/lib/api';
import type { Coordenadas } from '@/types/api';

const schema = z.object({
  nome: z.string().min(3, 'Informe o nome'),
  capacidadeTotal: z.coerce.number().int().positive('Informe a capacidade'),
  contato: z.string().optional(),
  descricao: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function NovoAbrigoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const criar = useCriarAbrigo();
  const [coords, setCoords] = useState<Coordenadas | null>(null);
  const [coordsError, setCoordsError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { capacidadeTotal: 50 } });

  function close() {
    reset();
    setCoords(null);
    setCoordsError(null);
    onClose();
  }

  function onSubmit(data: FormData) {
    if (!coords) {
      setCoordsError('Defina a localização do abrigo.');
      return;
    }
    criar.mutate(
      {
        nome: data.nome,
        descricao: data.descricao || undefined,
        coordenadas: coords,
        capacidadeTotal: data.capacidadeTotal,
        contato: data.contato || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Abrigo criado.');
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
      title="Novo Abrigo"
      eyebrow="Infraestrutura"
      icon={<Home size={16} />}
      maxWidth="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={criar.isPending}>
            Criar abrigo
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Nome" required error={errors.nome?.message}>
            <Input placeholder="Ex.: Abrigo Escola Central" {...register('nome')} />
          </FormField>
          <FormField label="Capacidade total" required error={errors.capacidadeTotal?.message}>
            <Input type="number" min={1} {...register('capacidadeTotal')} />
          </FormField>
        </div>

        <FormField label="Contato" error={errors.contato?.message}>
          <Input placeholder="Telefone ou responsável (opcional)" {...register('contato')} />
        </FormField>

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
