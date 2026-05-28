import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <span className="gradient-text-brand text-[64px] font-extrabold leading-none">404</span>
      <h3 className="text-[15px] font-semibold text-ink-primary">Página não encontrada</h3>
      <p className="text-[12px] text-ink-muted">A rota acessada não existe ou foi movida.</p>
      <Link to="/dashboard" className="mt-2">
        <Button variant="secondary">Voltar ao Dashboard</Button>
      </Link>
    </div>
  );
}
