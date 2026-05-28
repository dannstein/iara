import type { ReactNode } from 'react';
import { Loader2, Inbox, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function Spinner({ size = 18, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={cn('animate-spin text-ink-muted', className)} />;
}

export function LoadingBlock({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-ink-muted">
      <Spinner size={24} />
      <span className="text-[13px]">{label}</span>
    </div>
  );
}

interface StateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: StateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <div className="mb-1 text-ink-muted">{icon ?? <Inbox size={40} strokeWidth={1.5} />}</div>
      <h3 className="text-[14px] font-semibold text-ink-primary">{title}</h3>
      {description && <p className="max-w-sm text-[12px] text-ink-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Erro ao carregar',
  description = 'Não foi possível obter os dados. Tente novamente.',
  action,
}: Partial<StateProps>) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <div className="mb-1 text-severity-critica">
        <AlertTriangle size={40} strokeWidth={1.5} />
      </div>
      <h3 className="text-[14px] font-semibold text-ink-primary">{title}</h3>
      <p className="max-w-sm text-[12px] text-ink-muted">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function PulseDot({ color = '#22C55E', className }: { color?: string; className?: string }) {
  return (
    <span
      className={cn('inline-block h-2 w-2 rounded-full pulse-dot', className)}
      style={{ background: color, color }}
    />
  );
}
