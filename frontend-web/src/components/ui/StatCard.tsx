import type { ReactNode } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatVariant = 'default' | 'critica' | 'alta' | 'media' | 'baixa' | 'brand';

const borderByVariant: Record<StatVariant, string> = {
  default: 'border-white/[0.08] hover:border-white/[0.14]',
  critica: 'border-red-500/25 hover:border-red-500/40 hover:shadow-red-500/10',
  alta: 'border-orange-500/25 hover:border-orange-500/40',
  media: 'border-yellow-500/25 hover:border-yellow-500/40',
  baixa: 'border-green-500/25 hover:border-green-500/40',
  brand: 'border-blue-500/25 hover:border-blue-500/40',
};

const barByVariant: Record<StatVariant, string> = {
  default: '',
  critica: 'bg-gradient-to-r from-transparent via-red-500 to-transparent',
  alta: 'bg-gradient-to-r from-transparent via-orange-500 to-transparent',
  media: 'bg-gradient-to-r from-transparent via-yellow-500 to-transparent',
  baixa: 'bg-gradient-to-r from-transparent via-green-500 to-transparent',
  brand: 'bg-gradient-to-r from-transparent via-blue-500 to-transparent',
};

const iconBoxByVariant: Record<StatVariant, string> = {
  default: 'bg-white/5 text-ink-secondary',
  critica: 'bg-red-500/10 text-red-400',
  alta: 'bg-orange-500/10 text-orange-400',
  media: 'bg-yellow-500/10 text-yellow-400',
  baixa: 'bg-green-500/10 text-green-400',
  brand: 'bg-blue-500/10 text-blue-400',
};

const valueByVariant: Record<StatVariant, string> = {
  default: 'text-ink-primary',
  critica: 'text-red-400',
  alta: 'text-orange-400',
  media: 'text-yellow-400',
  baixa: 'text-green-400',
  brand: 'text-ink-primary',
};

interface StatCardProps {
  eyebrow?: string;
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  variant?: StatVariant;
  delta?: number;
  deltaLabel?: string;
}

export function StatCard({
  eyebrow,
  title,
  value,
  icon,
  variant = 'default',
  delta,
  deltaLabel = 'em relação ao período anterior',
}: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-bg-secondary p-5 border transition-all duration-[250ms]',
        'hover:-translate-y-0.5 hover:shadow-lg',
        borderByVariant[variant],
      )}
    >
      {variant !== 'default' && (
        <div className={cn('absolute left-0 right-0 top-0 h-[2px]', barByVariant[variant])} />
      )}
      <div className="mb-3 flex items-start justify-between">
        <div>
          {eyebrow && <p className="eyebrow mb-0.5">{eyebrow}</p>}
          <p className="text-[13px] font-medium text-ink-secondary">{title}</p>
        </div>
        {icon && (
          <div
            className={cn(
              'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
              iconBoxByVariant[variant],
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <p className={cn('mb-1.5 text-[28px] font-bold leading-none tabular-nums', valueByVariant[variant])}>
        {value}
      </p>
      {delta != null && (
        <p
          className={cn(
            'flex items-center gap-1 text-[12px] font-medium',
            delta > 0 ? 'text-red-400' : 'text-green-400',
          )}
        >
          {delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(delta)}% {deltaLabel}
        </p>
      )}
    </div>
  );
}
