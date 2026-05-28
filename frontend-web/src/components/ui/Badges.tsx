import { cn } from '@/lib/utils';
import { severidadeConfig, statusConfig } from '@/lib/utils';
import type { Severidade, EventoStatus } from '@/types/api';

export function SeverityBadge({ severity }: { severity: Severidade }) {
  const cfg = severidadeConfig[severity];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border px-2 py-0.5',
        'text-[10px] font-bold uppercase tracking-[0.08em]',
        cfg.bg,
        cfg.text,
        cfg.border,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.hex }} />
      {cfg.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: EventoStatus }) {
  const cfg = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold',
        cfg.classes,
        cfg.pulse && 'animate-pulse-critica',
      )}
    >
      {cfg.label}
    </span>
  );
}

/** Barra de severidade no topo de um card (§7.3). Pai precisa ser relative. */
export function SeverityBar({ severity }: { severity: Severidade }) {
  const hex = severidadeConfig[severity].hex;
  return (
    <div
      className="absolute left-0 right-0 top-0 h-[2px]"
      style={{
        background: `linear-gradient(90deg, transparent 0%, ${hex} 40%, ${hex} 60%, transparent 100%)`,
      }}
    />
  );
}

/** Chip de tenant — segregação visual em tabelas multi-tenant. */
export function TenantChip({ nome }: { nome?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-ink-secondary">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-light" />
      {nome ?? '—'}
    </span>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}
export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        className,
      )}
    >
      {children}
    </span>
  );
}
