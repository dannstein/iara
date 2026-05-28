import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { LogOut, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { initials } from '@/lib/utils';
import { NotificationBell } from './NotificationBell';
import { TenantSwitcher } from './TenantSwitcher';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  eventos: 'Eventos',
  mapa: 'Mapa',
  'pontos-coleta': 'Pontos de Coleta',
  abrigos: 'Abrigos',
  hospitais: 'Hospitais',
  usuarios: 'Usuários',
  'zonas-risco': 'Zonas de Risco',
  tenants: 'Tenants',
};

function Breadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  return (
    <nav className="flex flex-1 items-center gap-1 text-sm text-ink-muted">
      <span>IARA</span>
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight size={14} />
          <span className={i === segments.length - 1 ? 'text-ink-primary' : ''}>
            {ROUTE_LABELS[seg] ?? seg}
          </span>
        </span>
      ))}
    </nav>
  );
}

function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-dark text-[12px] font-bold text-white transition-all hover:ring-2 hover:ring-brand-dark/50"
      >
        {initials(user?.email)}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 animate-fade-in overflow-hidden rounded-xl border border-white/10 bg-bg-elevated shadow-lg">
          <div className="border-b border-white/5 px-4 py-3">
            <p className="truncate text-[13px] font-semibold text-ink-primary">{user?.email}</p>
            <p className="text-[11px] text-ink-muted">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-[13px] text-ink-secondary transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            <LogOut size={15} /> Sair
          </button>
        </div>
      )}
    </div>
  );
}

export function Topbar() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center gap-4 border-b border-white/5 bg-bg-primary px-6">
      <Link to="/dashboard" className="flex w-[208px] flex-shrink-0 items-center gap-2.5">
        <img src="/logo-iara.svg" alt="IARA" className="h-7 w-auto" />
        <span className="text-[15px] font-bold tracking-tight text-white">IARA</span>
        <span className="ml-1 rounded border border-[rgba(15,71,188,0.3)] bg-brand-blue-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-brand-light">
          DC
        </span>
      </Link>
      <Breadcrumb />
      <div className="flex items-center gap-3">
        <TenantSwitcher />
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
