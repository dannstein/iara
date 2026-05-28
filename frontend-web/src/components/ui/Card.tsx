import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl bg-bg-secondary border border-white/[0.08] p-5',
        className,
      )}
      {...props}
    />
  );
}
