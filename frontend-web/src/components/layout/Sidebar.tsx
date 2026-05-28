import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  Map,
  Package,
  Home,
  Cross,
  Building2,
  ShieldAlert,
  Users,
  LifeBuoy,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEventos } from '@/hooks/useEventos';

interface NavEntry {
  href: string;
  icon: LucideIcon;
  label: string;
}

interface NavGroup {
  eyebrow: string;
  items: NavEntry[];
}

const groups: NavGroup[] = [
  {
    eyebrow: 'Operações',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/eventos', icon: AlertTriangle, label: 'Eventos' },
      { href: '/mapa', icon: Map, label: 'Mapa' },
      { href: '/prevencao', icon: ShieldCheck, label: 'Prevenção' },
    ],
  },
  {
    eyebrow: 'Infraestrutura',
    items: [
      { href: '/pontos-coleta', icon: Package, label: 'Pontos de Coleta' },
      { href: '/abrigos', icon: Home, label: 'Abrigos' },
      { href: '/hospitais', icon: Cross, label: 'Hospitais' },
      { href: '/pontos-apoio', icon: LifeBuoy, label: 'Pontos de Apoio' },
    ],
  },
  {
    eyebrow: 'Gestão',
    items: [
      { href: '/usuarios', icon: Users, label: 'Usuários' },
      { href: '/zonas-risco', icon: ShieldAlert, label: 'Zonas de Risco' },
      { href: '/tenants', icon: Building2, label: 'Tenants' },
    ],
  },
];

interface NavItemProps extends NavEntry {
  badge?: string;
  badgeVariant?: 'critica' | 'brand';
}

function NavItem({ href, icon: Icon, label, badge, badgeVariant }: NavItemProps) {
  return (
    <NavLink
      to={href}
      className={({ isActive }) =>
        cn(
          'group relative mx-2 flex items-center gap-2.5 rounded-lg px-2.5 py-2',
          'text-[13px] font-medium transition-all duration-150',
          isActive
            ? 'border border-[rgba(15,71,188,0.3)] bg-brand-blue-soft text-ink-primary'
            : 'border border-transparent text-ink-secondary hover:bg-white/[0.04] hover:text-ink-primary',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-r-full bg-brand-dark shadow-[0_0_8px_rgba(15,71,188,0.7)]" />
          )}
          <span className={cn('flex-shrink-0 transition-colors', isActive ? 'text-brand-light' : '')}>
            <Icon size={16} />
          </span>
          <span className="truncate">{label}</span>
          {badge && (
            <span
              className={cn(
                'ml-auto rounded border px-1.5 py-0.5 text-[10px] font-bold',
                badgeVariant === 'critica'
                  ? 'border-red-500/30 bg-red-500/15 text-red-400'
                  : 'border-blue-500/30 bg-blue-500/15 text-blue-400',
              )}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  // contagem de eventos que aguardam aprovação (badge no item Eventos)
  const { data: pendentes } = useEventos({ status: 'SOLICITADO' });
  const pendentesCount = pendentes?.length ?? 0;

  return (
    <aside className="fixed bottom-0 left-0 top-14 z-40 flex w-60 flex-col border-r border-white/5 bg-gradient-to-b from-bg-primary to-bg-app transition-all duration-200">
      <div className="flex-1 overflow-y-auto pb-2">
        {groups.map((group) => (
          <div key={group.eyebrow}>
            <div className="px-3 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
              {group.eyebrow}
            </div>
            {group.items.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                badge={
                  item.href === '/eventos' && pendentesCount > 0
                    ? String(pendentesCount)
                    : undefined
                }
                badgeVariant="critica"
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-auto border-t border-white/5 p-3 text-center text-[10px] text-ink-muted">
        IARA v1.0 · Comando e Controle
      </div>
    </aside>
  );
}
