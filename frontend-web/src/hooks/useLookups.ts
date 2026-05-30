import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { LookupItem, ZonaRiscoDTO } from '@/types/api';

const FIVE_MIN = 5 * 60_000;

export function useDesastreTipos() {
  return useQuery({
    queryKey: ['lookup', 'desastre-tipos'],
    queryFn: () => api.get<LookupItem[]>('/lookup/desastre-tipos').then((r) => r.data),
    staleTime: FIVE_MIN,
  });
}

export function useDemandaTipos() {
  return useQuery({
    queryKey: ['lookup', 'demanda-tipos'],
    queryFn: () => api.get<LookupItem[]>('/lookup/demanda-tipos').then((r) => r.data),
    staleTime: FIVE_MIN,
  });
}

// ── Camadas do mapa ───────────────────────────────────────
export function useZonasRisco() {
  return useQuery({
    queryKey: ['zonas-risco'],
    queryFn: () => api.get<ZonaRiscoDTO[]>('/zonas-risco').then((r) => r.data),
  });
}
