import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';
import { Button, FormField, Input } from '@/components/ui';
import { useWebLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { apiErrorMessage } from '@/lib/api';

const schema = z.object({
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
  senha: z.string().min(1, 'Informe a senha'),
});
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useWebLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  if (isAuthenticated) return <Navigate to={from} replace />;

  const onSubmit = (data: FormData) =>
    login.mutate(data, { onSuccess: () => navigate(from, { replace: true }) });

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-app px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src="/logo-iara.svg" alt="IARA" className="h-12 w-auto" />
          <h1 className="text-[22px] font-bold tracking-tight">
            <span className="gradient-text-brand">IARA</span>
          </h1>
          <p className="text-[13px] text-ink-secondary">Sistema de Gestão de Desastres</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-bg-secondary p-6 shadow-lg"
        >
          <FormField label="E-mail" error={errors.email?.message} htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="gestor@defesacivil.gov.br"
              {...register('email')}
            />
          </FormField>

          <FormField label="Senha" error={errors.senha?.message} htmlFor="senha">
            <Input
              id="senha"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register('senha')}
            />
          </FormField>

          {login.isError && (
            <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-400">
              <AlertCircle size={14} />
              {apiErrorMessage(login.error, 'Não foi possível entrar. Verifique suas credenciais.')}
            </div>
          )}

          <Button type="submit" loading={login.isPending} className="mt-1 w-full">
            <LogIn size={15} /> Entrar
          </Button>
        </form>

        <p className="mt-6 text-center text-[11px] text-ink-muted">
          Acesso restrito a gestores e operadores da Defesa Civil.
        </p>
      </div>
    </div>
  );
}
