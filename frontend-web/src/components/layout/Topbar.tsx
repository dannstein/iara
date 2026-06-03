import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { LogOut, ChevronRight, Sun, Moon, Monitor, Bell } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { initials } from '@/lib/utils';
import { NotificationBell } from './NotificationBell';
import { TenantSwitcher } from './TenantSwitcher';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/store/themeStore';

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

const THEME_ICONS: Record<Theme, React.ReactNode> = {
  dark: <Moon size={15} />,
  light: <Sun size={15} />,
  system: <Monitor size={15} />,
};
const THEME_LABELS: Record<Theme, string> = {
  dark: 'Modo escuro',
  light: 'Modo claro',
  system: 'Seguir sistema',
};

function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();
  return (
    <button
      onClick={cycleTheme}
      title={THEME_LABELS[theme]}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-bg-hover hover:text-ink-primary"
    >
      {THEME_ICONS[theme]}
    </button>
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
            onClick={() => { setOpen(false); navigate('/perfil/notificacoes'); }}
            className="flex w-full items-center gap-2 border-b border-white/5 px-4 py-3 text-left text-[13px] text-ink-secondary transition-colors hover:bg-white/[0.04] hover:text-ink-primary"
          >
            <Bell size={15} /> Preferências de notificação
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-[13px] text-ink-secondary transition-colors hover:bg-white/[0.04] hover:text-ink-primary"
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
    <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center gap-4 bg-bg-primary px-6"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      {/* Accent line — gradiente com as cores do logo (azul + laranja) */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{ background: 'linear-gradient(90deg, #0f47bc 0%, #e8621a 50%, #f5a623 100%)', opacity: 0.5 }}
      />

      <Link to="/dashboard" className="flex w-[208px] flex-shrink-0 items-center gap-2.5">
        <img src="/logo-iara.svg" alt="IARA" className="h-7 w-auto" />
        <span className="text-[15px] font-bold tracking-tight text-ink-primary">IARA</span>
        {/* Badge DC usa laranja/âmbar do logo em vez de azul */}
        <span
          className="ml-1 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
          style={{
            background: 'rgba(232, 98, 26, 0.15)',
            border: '1px solid rgba(232, 98, 26, 0.35)',
            color: '#f5a623',
          }}
        >
          DC
        </span>
      </Link>
      <Breadcrumb />
      <div className="flex items-center gap-2">
        <TenantSwitcher />
        <NotificationBell />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
