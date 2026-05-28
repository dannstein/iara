import type { ReactNode } from 'react';
import { Heart, Activity } from 'lucide-react';

interface StartCardProps {
  color: string;
  textColor?: string;
  label: string;
  count: number;
  description: string;
  icon?: ReactNode;
}

function StartCard({ color, textColor, label, count, description, icon }: StartCardProps) {
  return (
    <div
      className="flex flex-col gap-2 rounded-lg p-3"
      style={{ background: `${color}14`, border: `1px solid ${color}35` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color }}>
          {label}
        </span>
        <span style={{ color: textColor || color, opacity: 0.7 }}>{icon}</span>
      </div>
      <span
        className="text-[28px] font-bold leading-none tabular-nums"
        style={{ color: textColor || color }}
      >
        {count}
      </span>
      <span className="text-[11px] text-ink-muted">{description}</span>
    </div>
  );
}

interface StartTriageCardProps {
  vermelho: number;
  amarelo: number;
  verde: number;
  preto: number;
}

/** Dashboard de triagem START (§9.12). */
export function StartTriageCard({ vermelho, amarelo, verde, preto }: StartTriageCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-bg-secondary">
      <div className="flex items-center gap-2 border-b border-white/5 px-5 py-3.5">
        <span className="h-4 w-1 rounded-full bg-red-500" />
        <h3 className="text-[13px] font-semibold text-ink-primary">Triagem START</h3>
        <span className="ml-1 text-[10px] text-ink-muted">Protocolo de múltiplas vítimas</span>
      </div>
      <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-4">
        <StartCard color="#EF4444" label="Imediato" count={vermelho} description="Risco de vida" icon={<Heart size={16} />} />
        <StartCard color="#EAB308" label="Urgente" count={amarelo} description="Estável / observação" icon={<Activity size={16} />} />
        <StartCard color="#22C55E" label="Ambulante" count={verde} description="Leve / pode aguardar" />
        <StartCard color="#374151" textColor="#9CA3AF" label="Expectante" count={preto} description="Óbito / sem chance" />
      </div>
    </div>
  );
}
