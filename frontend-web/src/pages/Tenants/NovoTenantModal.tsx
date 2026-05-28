import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';
import { Modal, Button, Input, Select, FormField } from '@/components/ui';
import {
  useTenantHierarquia,
  useCriarTenant,
  type TenantNodeDTO,
} from '@/hooks/useTenants';
import { useMe, useTenant } from '@/hooks/useUsuarios';
import { useAuthStore } from '@/store/authStore';
import { apiErrorMessage } from '@/lib/api';

interface Flat {
  id: string;
  nome: string;
  tipo: TenantNodeDTO['tipo'];
}
function flatten(n: TenantNodeDTO, acc: Flat[] = []): Flat[] {
  acc.push({ id: n.id, nome: n.nome, tipo: n.tipo });
  n.filhos.forEach((f) => flatten(f, acc));
  return acc;
}

interface FormData {
  tipo: 'ESTADUAL' | 'MUNICIPAL';
  nome: string;
  uf: string;
  ibgeCod?: string;
  idPai: string;
}

export function NovoTenantModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const role = useAuthStore((s) => s.user?.role);
  const me = useMe();
  const meuTenant = useTenant(me.data?.tenantId);
  const { data: root } = useTenantHierarquia();
  const criar = useCriarTenant();

  const isAdmin = role === 'ADMIN';
  const creatorTipo = meuTenant.data?.tipo;
  const tenants = useMemo(() => (root ? flatten(root) : []), [root]);

  const allowedTipos: FormData['tipo'][] =
    isAdmin || creatorTipo === 'FEDERAL' ? ['ESTADUAL', 'MUNICIPAL'] : ['MUNICIPAL'];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({ defaultValues: { tipo: allowedTipos[0] } });

  const tipo = watch('tipo');
  // Pais válidos: ESTADUAL exige pai FEDERAL; MUNICIPAL exige pai ESTADUAL.
  const parentTipo = tipo === 'ESTADUAL' ? 'FEDERAL' : 'ESTADUAL';
  const parents = tenants.filter((t) => t.tipo === parentTipo);

  function close() {
    reset({ tipo: allowedTipos[0] });
    onClose();
  }

  function onSubmit(data: FormData) {
    if (data.tipo === 'MUNICIPAL' && !data.ibgeCod?.trim()) {
      toast.error('Código IBGE é obrigatório para municípios.');
      return;
    }
    criar.mutate(
      {
        nome: data.nome,
        tipo: data.tipo,
        uf: data.uf.trim().toUpperCase(),
        ibgeCod: data.tipo === 'MUNICIPAL' ? data.ibgeCod : undefined,
        idPai: data.idPai,
      },
      {
        onSuccess: (t) => {
          toast.success(`Tenant "${t.nome}" criado.`);
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
      title="Novo Tenant"
      eyebrow="Gestão"
      icon={<Building2 size={16} />}
      maxWidth="max-w-lg"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={criar.isPending}>
            Criar tenant
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Tipo" required>
            <Select {...register('tipo')} disabled={allowedTipos.length === 1}>
              {allowedTipos.map((t) => (
                <option key={t} value={t}>
                  {t === 'ESTADUAL' ? 'Estado' : 'Município'}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="UF" required error={errors.uf?.message}>
            <Input
              maxLength={2}
              placeholder="SP"
              className="uppercase"
              {...register('uf', { required: 'Informe a UF', maxLength: 2, minLength: 2 })}
            />
          </FormField>
        </div>

        <FormField label="Nome" required error={errors.nome?.message}>
          <Input
            placeholder={tipo === 'ESTADUAL' ? 'Ex.: Minas Gerais' : 'Ex.: Campinas'}
            {...register('nome', { required: 'Informe o nome' })}
          />
        </FormField>

        {tipo === 'MUNICIPAL' && (
          <FormField label="Código IBGE" required hint="7 dígitos" error={errors.ibgeCod?.message}>
            <Input maxLength={7} placeholder="3509502" {...register('ibgeCod')} />
          </FormField>
        )}

        <FormField
          label={tipo === 'ESTADUAL' ? 'Vincular ao (Federal)' : 'Vincular ao (Estado)'}
          required
          error={errors.idPai?.message}
        >
          <Select {...register('idPai', { required: 'Selecione o tenant pai' })} defaultValue="">
            <option value="" disabled>
              {parents.length === 0 ? 'Nenhum tenant pai disponível' : 'Selecione…'}
            </option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Select>
        </FormField>
      </form>
    </Modal>
  );
}
