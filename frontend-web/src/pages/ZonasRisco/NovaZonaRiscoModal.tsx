import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ShieldAlert } from 'lucide-react';
import { Modal, Button, Input, Select, FormField } from '@/components/ui';
import { LocationPicker } from '@/components/LocationPicker';
import { useCriarZonaRisco } from '@/hooks/useZonasRisco';
import { usePontosApoio } from '@/hooks/usePontosApoio';
import { apiErrorMessage } from '@/lib/api';
import { distanceMeters } from '@/lib/utils';
import type { Coordenadas, ZonaTipo } from '@/types/api';

const TIPOS: ZonaTipo[] = ['ENCHENTE', 'DESLIZAMENTO', 'INCENDIO', 'MULTIPERIGO', 'OUTRO'];

interface FormFields {
  nome: string;
  descricao?: string;
  tipo: ZonaTipo;
  raioMetros: number;
  nivelRisco: number;
}

export function NovaZonaRiscoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const criar = useCriarZonaRisco();
  const livres = usePontosApoio(true);
  const [coords, setCoords] = useState<Coordenadas | null>(null);
  const [coordsError, setCoordsError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormFields>({ defaultValues: { tipo: 'ENCHENTE', raioMetros: 3000, nivelRisco: 3 } });

  const raio = Number(watch('raioMetros')) || 0;

  function close() {
    reset({ tipo: 'ENCHENTE', raioMetros: 3000, nivelRisco: 3 });
    setCoords(null);
    setSelected([]);
    setCoordsError(null);
    onClose();
  }

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function onSubmit(data: FormFields) {
    if (!coords) {
      setCoordsError('Defina o centro da zona.');
      return;
    }
    criar.mutate(
      {
        nome: data.nome,
        descricao: data.descricao || undefined,
        tipo: data.tipo,
        coordenadas: coords,
        raioMetros: Number(data.raioMetros),
        nivelRisco: Number(data.nivelRisco),
        idsPontoApoio: selected.length ? selected : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Zona de risco criada.');
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
      title="Nova Zona de Risco"
      eyebrow="Mapeamento de risco"
      icon={<ShieldAlert size={16} />}
      maxWidth="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={criar.isPending}>
            Criar zona
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField label="Nome" required error={errors.nome?.message}>
          <Input placeholder="Ex.: Encosta do Bairro Alto" {...register('nome', { required: 'Informe o nome' })} />
        </FormField>

        <div className="grid grid-cols-3 gap-3">
          <FormField label="Tipo" required>
            <Select {...register('tipo')}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Nível de risco" required>
            <Select {...register('nivelRisco')}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Raio (m)" required>
            <Input type="number" step="100" {...register('raioMetros', { required: true })} />
          </FormField>
        </div>

        <FormField label="Centro da zona" required error={coordsError ?? undefined}>
          <LocationPicker
            value={coords}
            onChange={(c) => {
              setCoords(c);
              setCoordsError(null);
            }}
          />
        </FormField>

        <div>
          <p className="form-label mb-1.5">Pontos de apoio (opcional, dentro do raio)</p>
          {livres.isLoading ? (
            <p className="text-[12px] text-ink-muted">Carregando…</p>
          ) : (livres.data?.length ?? 0) === 0 ? (
            <p className="text-[12px] text-ink-muted">Nenhum ponto de apoio livre. Cadastre na página de Pontos de Apoio.</p>
          ) : (
            <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-md border border-white/[0.06] p-2">
              {livres.data!.map((p) => {
                const dist = coords ? distanceMeters(coords, p.coordenadas) : null;
                const outOfRange = dist != null && dist > raio;
                const disabled = !coords || outOfRange;
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-2 rounded px-2 py-1.5 text-[13px] ${disabled ? 'opacity-40' : 'cursor-pointer hover:bg-white/[0.03]'}`}
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-brand-dark"
                      disabled={disabled}
                      checked={selected.includes(p.id)}
                      onChange={() => toggle(p.id)}
                    />
                    <span className="flex-1 text-ink-primary">{p.nome}</span>
                    {dist != null && (
                      <span className={outOfRange ? 'text-severity-critica' : 'text-ink-muted'}>
                        {(dist / 1000).toFixed(1)} km
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
          {!coords && <p className="form-hint mt-1">Defina o centro para habilitar a seleção por proximidade.</p>}
        </div>
      </form>
    </Modal>
  );
}
