import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Severidade, EventoStatus, DemandaPrioridade } from '@/types/api';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "há 5 min" — formato relativo para timestamps de eventos. */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: ptBR });
  } catch {
    return '—';
  }
}

/** Data/hora absoluta — usar em tooltips. */
export function formatAbsolute(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return '—';
  }
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('pt-BR').format(n);
}

// ── Severidade ────────────────────────────────────────────
export const severidadeConfig: Record<
  Severidade,
  { label: string; hex: string; text: string; bg: string; border: string }
> = {
  CRITICA: { label: 'Crítica', hex: '#EF4444', text: 'text-red-400', bg: 'bg-red-500/12', border: 'border-red-500/30' },
  ALTA: { label: 'Alta', hex: '#F97316', text: 'text-orange-400', bg: 'bg-orange-500/12', border: 'border-orange-500/30' },
  MEDIA: { label: 'Média', hex: '#EAB308', text: 'text-yellow-400', bg: 'bg-yellow-500/12', border: 'border-yellow-500/30' },
  BAIXA: { label: 'Baixa', hex: '#22C55E', text: 'text-green-400', bg: 'bg-green-500/12', border: 'border-green-500/30' },
};

// ── Status do evento ──────────────────────────────────────
export const statusConfig: Record<
  EventoStatus,
  { label: string; classes: string; pulse?: boolean }
> = {
  SOLICITADO: { label: 'Solicitado', classes: 'text-ink-muted bg-white/5 border-white/10' },
  ATIVO: { label: 'Ativo', classes: 'text-blue-400 bg-blue-500/10 border-blue-500/25' },
  ALERTA_CRITICO: { label: 'Alerta Crítico', classes: 'text-red-400 bg-red-500/10 border-red-500/25', pulse: true },
  ENCERRADO: { label: 'Encerrado', classes: 'text-ink-muted bg-white/5 border-white/10' },
  CANCELADO: { label: 'Cancelado', classes: 'text-ink-muted bg-white/5 border-white/10' },
};

export const prioridadeConfig: Record<DemandaPrioridade, { label: string; text: string }> = {
  CRITICA: { label: 'Crítica', text: 'text-red-400' },
  ALTA: { label: 'Alta', text: 'text-orange-400' },
  MEDIA: { label: 'Média', text: 'text-yellow-400' },
  BAIXA: { label: 'Baixa', text: 'text-green-400' },
  SUPRIDA: { label: 'Suprida', text: 'text-ink-muted' },
};

/** Distância aproximada em metros entre dois pontos (Haversine). */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Iniciais para avatar a partir do nome/email. */
export function initials(name?: string | null): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
