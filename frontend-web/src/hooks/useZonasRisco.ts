import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Coordenadas, ZonaRiscoDTO, ZonaTipo } from '@/types/api';

export function useZonasRisco() {
  return useQuery({
    queryKey: ['zonas-risco'],
    queryFn: () => api.get<ZonaRiscoDTO[]>('/zonas-risco').then((r) => r.data),
  });
}

export interface CriarZonaRiscoInput {
  nome: string;
  descricao?: string;
  tipo: ZonaTipo;
  coordenadas: Coordenadas;
  raioMetros: number;
  nivelRisco: number;
  fonte?: string;
  idsPontoApoio?: string[];
}

export function useCriarZonaRisco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CriarZonaRiscoInput) =>
      api.post<ZonaRiscoDTO>('/zonas-risco', input).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zonas-risco'] });
      qc.invalidateQueries({ queryKey: ['pontos-apoio'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'zonas-risco'] });
    },
  });
}

function useApoioMutation(fn: (zonaId: string, idApoio: string) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ zonaId, idApoio }: { zonaId: string; idApoio: string }) => fn(zonaId, idApoio),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zonas-risco'] });
      qc.invalidateQueries({ queryKey: ['pontos-apoio'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'zonas-risco'] });
    },
  });
}

export function useVincularApoio() {
  return useApoioMutation((zonaId, idApoio) =>
    api.post(`/zonas-risco/${zonaId}/apoios`, { idPontoApoio: idApoio }),
  );
}

export function useDesvincularApoio() {
  return useApoioMutation((zonaId, idApoio) =>
    api.delete(`/zonas-risco/${zonaId}/apoios/${idApoio}`),
  );
}

export function useDesativarZona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/zonas-risco/${id}/desativar`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zonas-risco'] });
      qc.invalidateQueries({ queryKey: ['pontos-apoio'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'zonas-risco'] });
    },
  });
}

export function useDashboardZonasSemApoio() {
  return useQuery({
    queryKey: ['dashboard', 'zonas-risco'],
    queryFn: () =>
      api.get<{ SEM_APOIO: number; COM_APOIO: number }>('/dashboard/zonas-risco').then((r) => r.data),
    refetchInterval: 30_000,
  });
}
