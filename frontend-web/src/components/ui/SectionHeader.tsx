import type { ReactNode } from 'react';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  barColor?: string;
}

/** Cabeçalho de seção padrão (§9.17): barra vertical + eyebrow + título. */
export function SectionHeader({ eyebrow, title, action, barColor = '#0F47BC' }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="h-5 w-[3px] flex-shrink-0 rounded-full" style={{ background: barColor }} />
      <div className="flex flex-col leading-tight">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 className="text-[15px] font-semibold text-ink-primary">{title}</h2>
      </div>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}
