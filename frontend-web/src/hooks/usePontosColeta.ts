import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Coordenadas,
  CriarDemandaInput,
  DemandaDTO,
  EstoqueDTO,
  PcDTO,
  PcTipo,
} from '@/types/api';

export interface CriarPcInput {
  pcNome: string;
  pcTipo?: PcTipo;
  coordenadas: Coordenadas;
  pcDesc?: string;
  pcContato?: string;
}

export interface PcFilter {
  is_active?: boolean;
  pc_is_verified?: boolean;
  pc_tipo?: PcTipo;
}

export function usePontosColeta(params?: PcFilter) {
  return useQuery({
    queryKey: ['pontos-coleta', params],
    queryFn: () => api.get<PcDTO[]>('/pontos-coleta', { params }).then((r) => r.data),
  });
}

/** Define manualmente o coordenador de um PC (GESTOR/ADMIN); promove o usuário a COORDENADOR. */
export function useDefinirCoordenador(pcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (idUsuario: string) =>
      api.patch<PcDTO>(`/pontos-coleta/${pcId}/coordenador`, { idUsuario }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pontos-coleta'] });
      qc.invalidateQueries({ queryKey: ['ponto-coleta', pcId] });
      qc.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
}

/** Cria um Ponto de Coleta (COORDENADOR — GESTOR/ADMIN herdam). O coordenador é o usuário logado. */
export function useCriarPc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CriarPcInput) =>
      api.post<PcDTO>('/pontos-coleta', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pontos-coleta'] }),
  });
}

/** PCs próximos a um ponto, ordenados por distância (raio padrão do backend: 5000m). */
export function usePcsProximos(lat?: number, lng?: number, raioMetros = 20000) {
  return useQuery({
    queryKey: ['pontos-coleta', 'proximos', lat, lng, raioMetros],
    queryFn: () =>
      api
        .get<PcDTO[]>('/pontos-coleta/proximos', {
          params: { lat, lng, raio_metros: raioMetros },
        })
        .then((r) => r.data),
    enabled: lat != null && lng != null,
  });
}

export function usePontoColeta(id: string | undefined) {
  return useQuery({
    queryKey: ['ponto-coleta', id],
    queryFn: () => api.get<PcDTO>(`/pontos-coleta/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function usePcDemandas(id: string | undefined) {
  return useQuery({
    queryKey: ['ponto-coleta', id, 'demandas'],
    queryFn: () =>
      api.get<DemandaDTO[]>(`/pontos-coleta/${id}/demandas`).then((r) => r.data),
    enabled: !!id,
  });
}

export function usePcEstoque(id: string | undefined) {
  return useQuery({
    queryKey: ['ponto-coleta', id, 'estoque'],
    queryFn: () =>
      api.get<EstoqueDTO[]>(`/pontos-coleta/${id}/estoque`).then((r) => r.data),
    enabled: !!id,
  });
}

/**
 * Cria uma demanda em um PC vinculado a um evento.
 * Pré-condição: vínculo PC↔evento ACEITO (senão o backend responde 409).
 * GESTOR/ADMIN herdam COORDENADOR, então podem chamar.
 */
export function useCriarDemanda(pcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CriarDemandaInput) =>
      api.post<DemandaDTO>(`/pontos-coleta/${pcId}/demandas`, input).then((r) => r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['ponto-coleta', pcId, 'demandas'] });
      qc.invalidateQueries({ queryKey: ['evento', vars.idEvento, 'mural'] });
    },
  });
}
