import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { Modal, Button, Input, Select, FormField } from '@/components/ui';
import { useCriarUsuario, useMe } from '@/hooks/useUsuarios';
import { useTenantHierarquia, type TenantNodeDTO } from '@/hooks/useTenants';
import { useAuthStore } from '@/store/authStore';
import { apiErrorMessage } from '@/lib/api';
import type { Role } from '@/types/api';

const RANK: Record<string, number> = {
  ADMIN: 5,
  GESTOR: 4,
  MONITOR: 3,
  COORDENADOR: 2,
  TECNICO: 1,
  DOADOR: 1,
  USUARIO_SIMPLES: 0,
};
const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  GESTOR: 'Gestor',
  MONITOR: 'Monitor',
  COORDENADOR: 'Coordenador',
  DOADOR: 'Doador',
};

function flatten(n: TenantNodeDTO, depth = 0, acc: { id: string; nome: string; depth: number }[] = []) {
  acc.push({ id: n.id, nome: n.nome, depth });
  n.filhos.forEach((f) => flatten(f, depth + 1, acc));
  return acc;
}

const schema = z.object({
  nome: z.string().min(3, 'Informe o nome'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().optional(),
  documento: z.string().min(1, 'Informe o documento'),
  senha: z.string().min(8, 'Mínimo 8 caracteres'),
  tenantId: z.string().min(1, 'Selecione o tenant'),
  roleNome: z.string().min(1, 'Selecione o perfil'),
});
type FormData = z.infer<typeof schema>;

export function NovoUsuarioModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const role = useAuthStore((s) => s.user?.role);
  const me = useMe();
  const { data: root } = useTenantHierarquia();
  const criar = useCriarUsuario();

  const tenants = useMemo(() => (root ? flatten(root) : []), [root]);
  // Sem escalonamento: só perfis de nível <= o do criador (entre os úteis no web).
  const allowedRoles = (['GESTOR', 'MONITOR', 'COORDENADOR', 'DOADOR', 'ADMIN'] as Role[]).filter(
    (r) => RANK[r] <= (RANK[role ?? ''] ?? 0),
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  function close() {
    reset();
    onClose();
  }

  function onSubmit(data: FormData) {
    criar.mutate(
      { ...data, telefone: data.telefone || undefined, roleNome: data.roleNome as Role },
      {
        onSuccess: () => {
          toast.success('Conta criada.');
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
      title="Nova conta"
      eyebrow="Gestão de usuários"
      icon={<UserPlus size={16} />}
      maxWidth="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={criar.isPending}>
            Criar conta
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField label="Nome" required error={errors.nome?.message}>
          <Input {...register('nome')} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="E-mail" required error={errors.email?.message}>
            <Input type="email" {...register('email')} />
          </FormField>
          <FormField label="Telefone" error={errors.telefone?.message}>
            <Input {...register('telefone')} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Documento (CPF)" required error={errors.documento?.message}>
            <Input placeholder="000.000.000-00" {...register('documento')} />
          </FormField>
          <FormField label="Senha inicial" required error={errors.senha?.message}>
            <Input type="password" {...register('senha')} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Perfil" required error={errors.roleNome?.message}>
            <Select {...register('roleNome')} defaultValue="">
              <option value="" disabled>
                Selecione…
              </option>
              {allowedRoles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r] ?? r}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Tenant" required error={errors.tenantId?.message}>
            <Select {...register('tenantId')} defaultValue={me.data?.tenantId ?? ''}>
              <option value="" disabled>
                Selecione…
              </option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {' '.repeat(t.depth * 2)}
                  {t.nome}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
