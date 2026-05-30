import {
  Info,
  AlertTriangle,
  AlertOctagon,
  Siren,
  Megaphone,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { AlertaSeveridade, AlertaCategoria, AlertaStatus } from '@/types/api';

interface SeverityMeta {
  label: string;
  color: string;       // hex base (segue DESIGN_SYSTEM_WEB §1.4 + brand orange)
  glow: string;        // tonal background
  icon: LucideIcon;
  pulse?: boolean;     // animação iara-pulse-critica
}

export const SEVERITY: Record<AlertaSeveridade, SeverityMeta> = {
  INFO:         { label: 'Informativo',  color: '#3B82F6', glow: 'rgba(59,130,246,0.12)',  icon: Info },
  WARNING:      { label: 'Atenção',      color: '#EAB308', glow: 'rgba(234,179,8,0.12)',   icon: AlertTriangle },
  DANGER:       { label: 'Perigo',       color: '#F97316', glow: 'rgba(249,115,22,0.12)',  icon: AlertOctagon },
  CRITICAL:     { label: 'Crítico',      color: '#EF4444', glow: 'rgba(239,68,68,0.15)',   icon: Siren, pulse: true },
  EMERGENCY:    { label: 'Emergência',   color: '#E8621A', glow: 'rgba(232,98,26,0.18)',   icon: Siren, pulse: true },
  SOLICITATION: { label: 'Solicitação',  color: '#0F47BC', glow: 'rgba(15,71,188,0.15)',   icon: Megaphone },
  OPERATIONAL:  { label: 'Operacional',  color: '#64748B', glow: 'rgba(100,116,139,0.12)', icon: Wrench },
};

export const CATEGORIA: Record<AlertaCategoria, { label: string; icon: LucideIcon; description: string }> = {
  DANGER_ZONE:       { label: 'Zonas de Risco',       icon: AlertOctagon,
                       description: 'Avisar usuários em/próximos a zonas de risco' },
  EVENT_ZONE:        { label: 'Zonas de Evento',      icon: AlertTriangle,
                       description: 'Avisar usuários em/próximos a eventos ativos' },
  TENANT_BROADCAST:  { label: 'Broadcast de Tenant',  icon: Megaphone,
                       description: 'Comunicação ampla a todos do tenant' },
  TECHNICAL_REQUEST: { label: 'Solicitação Técnica',  icon: Wrench,
                       description: 'Pedir reforço de técnicos voluntários' },
  SUPPORT_POINTS:    { label: 'Pontos de Apoio',      icon: Info,
                       description: 'Comunicar pontos de apoio sobre risco' },
  COLLECTION_POINTS: { label: 'Pontos de Coleta',     icon: Info,
                       description: 'Comunicar coordenadores de PCs sobre evento' },
  MONITORS:          { label: 'Monitores',            icon: Info,
                       description: 'Comunicar monitores de campo' },
  PERSONALIZED:      { label: 'Personalizado',        icon: Megaphone,
                       description: 'Alerta livre com público customizável' },
  ESCALATION:        { label: 'Escalonamento',        icon: Siren,
                       description: 'Escalar emergência para tenant ancestral' },
};

export const STATUS_LABEL: Record<AlertaStatus, string> = {
  ACTIVE: 'Ativo',
  EXPIRED: 'Expirado',
  RESOLVED: 'Resolvido',
  CANCELLED: 'Cancelado',
  SUPERSEDED: 'Substituído',
};

interface SeverityBadgeProps {
  severidade: AlertaSeveridade;
  size?: 'sm' | 'md';
}

export function AlertSeverityBadge({ severidade, size = 'md' }: SeverityBadgeProps) {
  const cfg = SEVERITY[severidade];
  const Icon = cfg.icon;
  const text = size === 'sm' ? 'text-[10px]' : 'text-[11px]';
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-0.5';
  const iconSize = size === 'sm' ? 10 : 12;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border ${padding} ${text} font-bold uppercase tracking-[0.08em] ${cfg.pulse ? 'animate-pulse-critica' : ''}`}
      style={{ background: cfg.glow, color: cfg.color, borderColor: `${cfg.color}55` }}
    >
      <Icon size={iconSize} />
      {cfg.label}
    </span>
  );
}

export function AlertStatusBadge({ status }: { status: AlertaStatus }) {
  const colorMap: Record<AlertaStatus, string> = {
    ACTIVE: '#3B82F6',
    EXPIRED: '#64748B',
    RESOLVED: '#22C55E',
    CANCELLED: '#64748B',
    SUPERSEDED: '#8B5CF6',
  };
  const c = colorMap[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium"
      style={{ background: `${c}1a`, color: c, borderColor: `${c}55` }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
