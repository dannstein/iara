import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CategoriaDTO, EspecDTO } from '@/types/api';

export function useCategorias() {
  return useQuery({
    queryKey: ['especialidades', 'categorias'],
    queryFn: () => api.get<CategoriaDTO[]>('/especialidades/categorias').then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}

export function useEspecs(idCategoria?: string) {
  return useQuery({
    queryKey: ['especialidades', 'especs', idCategoria ?? 'all'],
    queryFn: () =>
      api
        .get<EspecDTO[]>('/especialidades', {
          params: idCategoria ? { id_categoria: idCategoria } : undefined,
        })
        .then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}

export function useCriarCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { nome: string; descricao?: string }) =>
      api.post<CategoriaDTO>('/especialidades/categorias', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['especialidades'] }),
  });
}

export function useCriarEspec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { idCategoria: string; nome: string; descricao?: string }) =>
      api.post<EspecDTO>('/especialidades', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['especialidades'] }),
  });
}
