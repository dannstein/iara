import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Coordenadas, HospitalDTO, HospitalTipo } from '@/types/api';

export function useHospitais() {
  return useQuery({
    queryKey: ['hospitais'],
    queryFn: () => api.get<HospitalDTO[]>('/hospitais').then((r) => r.data),
  });
}

export interface CriarHospitalInput {
  nome: string;
  cnes?: string;
  tipo: HospitalTipo;
  coordenadas: Coordenadas;
  contato?: string;
  leitosTotal?: number;
  leitosDisponiveis?: number;
  leitosUti?: number;
  leitosUtiDisp?: number;
  aceitaCampanha?: boolean;
}

export function useCriarHospital() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CriarHospitalInput) =>
      api.post<HospitalDTO>('/hospitais', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospitais'] }),
  });
}
