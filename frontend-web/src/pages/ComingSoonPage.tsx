import { Construction } from 'lucide-react';
import { SectionHeader } from '@/components/ui';

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div>
      <SectionHeader eyebrow="Gestão" title={title} />
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-bg-secondary py-20 text-center">
        <Construction size={40} strokeWidth={1.5} className="text-ink-muted" />
        <h3 className="text-[15px] font-semibold text-ink-primary">Em construção</h3>
        <p className="max-w-md text-[12px] text-ink-muted">
          Esta tela faz parte da próxima etapa de entrega. A fundação, o design system e os
          endpoints já estão prontos para conectá-la.
        </p>
      </div>
    </div>
  );
}
