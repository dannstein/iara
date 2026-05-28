import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Coordenadas, PontoApoioDTO } from '@/types/api';

export function usePontosApoio(livre?: boolean) {
  return useQuery({
    queryKey: ['pontos-apoio', { livre }],
    queryFn: () =>
      api
        .get<PontoApoioDTO[]>('/pontos-apoio', { params: livre ? { livre: true } : undefined })
        .then((r) => r.data),
  });
}

export interface CriarPontoApoioInput {
  nome: string;
  descricao?: string;
  coordenadas: Coordenadas;
  contato?: string;
  responsavel?: string;
  enderecoTxt?: string;
}

export function useCriarPontoApoio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CriarPontoApoioInput) =>
      api.post<PontoApoioDTO>('/pontos-apoio', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pontos-apoio'] }),
  });
}
