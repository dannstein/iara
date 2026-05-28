import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface TenantDTO {
  id: string;
  nome: string;
  tipo: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL';
  uf: string | null;
  ibgeCod: string | null;
  idPai: string | null;
  isActive: boolean;
}

export interface TenantNodeDTO {
  id: string;
  nome: string;
  tipo: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL';
  uf: string | null;
  filhos: TenantNodeDTO[];
}

/** Árvore de tenants visível ao usuário (escopo por tipo; ADMIN vê tudo). */
export function useTenantHierarquia() {
  return useQuery({
    queryKey: ['tenants', 'hierarquia'],
    queryFn: () => api.get<TenantNodeDTO>('/tenants/hierarquia').then((r) => r.data),
  });
}

export function useTenantDetalhe(id: string | null | undefined) {
  return useQuery({
    queryKey: ['tenant-detalhe', id],
    queryFn: () => api.get<TenantDTO>(`/tenants/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export interface CriarTenantInput {
  nome: string;
  tipo: 'ESTADUAL' | 'MUNICIPAL';
  uf: string;
  ibgeCod?: string;
  idPai: string;
}

export function useCriarTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CriarTenantInput) =>
      api.post<TenantDTO>('/tenants', input).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['tenant-detalhe'] });
    },
  });
}
