import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  DashboardAbrigos,
  DashboardEventos,
  DashboardIncidentes,
  DashboardPcs,
  DashboardTecnicos,
} from '@/types/api';

const REFETCH = 30_000;

export function useDashboardEventos(isSimulado = false) {
  return useQuery({
    queryKey: ['dashboard', 'eventos', isSimulado],
    queryFn: () =>
      api
        .get<DashboardEventos>('/dashboard/eventos', { params: { is_simulado: isSimulado } })
        .then((r) => r.data),
    refetchInterval: REFETCH,
  });
}

export function useDashboardIncidentes(isSimulado = false) {
  return useQuery({
    queryKey: ['dashboard', 'incidentes', isSimulado],
    queryFn: () =>
      api
        .get<DashboardIncidentes>('/dashboard/incidentes', {
          params: { is_simulado: isSimulado },
        })
        .then((r) => r.data),
    refetchInterval: REFETCH,
  });
}

export function useDashboardAbrigos() {
  return useQuery({
    queryKey: ['dashboard', 'abrigos'],
    queryFn: () => api.get<DashboardAbrigos>('/dashboard/abrigos').then((r) => r.data),
    refetchInterval: REFETCH,
  });
}

export function useDashboardPcs() {
  return useQuery({
    queryKey: ['dashboard', 'pcs'],
    queryFn: () => api.get<DashboardPcs>('/dashboard/pcs').then((r) => r.data),
    refetchInterval: REFETCH,
  });
}

export function useDashboardTecnicos() {
  return useQuery({
    queryKey: ['dashboard', 'tecnicos'],
    queryFn: () => api.get<DashboardTecnicos>('/dashboard/tecnicos').then((r) => r.data),
    refetchInterval: REFETCH,
  });
}
