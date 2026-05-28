import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AbrigoDTO, Coordenadas, OcupanteDTO } from '@/types/api';

export interface CriarAbrigoInput {
  nome: string;
  descricao?: string;
  coordenadas: Coordenadas;
  capacidadeTotal: number;
  contato?: string;
  idEvento?: string;
}

export function useCriarAbrigo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CriarAbrigoInput) =>
      api.post<AbrigoDTO>('/abrigos', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['abrigos'] }),
  });
}

export interface AbrigoFilter {
  is_active?: boolean;
  id_evento?: string;
}

export function useAbrigos(params?: AbrigoFilter) {
  return useQuery({
    queryKey: ['abrigos', params],
    queryFn: () => api.get<AbrigoDTO[]>('/abrigos', { params }).then((r) => r.data),
  });
}

export function useAbrigo(id: string | undefined) {
  return useQuery({
    queryKey: ['abrigo', id],
    queryFn: () => api.get<AbrigoDTO>(`/abrigos/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useAbrigoOcupantes(id: string | undefined, isPrioridade?: boolean) {
  return useQuery({
    queryKey: ['abrigo', id, 'ocupantes', isPrioridade],
    queryFn: () =>
      api
        .get<OcupanteDTO[]>(`/abrigos/${id}/ocupantes`, {
          params: isPrioridade != null ? { is_prioridade: isPrioridade } : undefined,
        })
        .then((r) => r.data),
    enabled: !!id,
  });
}
