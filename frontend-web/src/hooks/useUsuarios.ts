import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AtendimentoDTO, Role, UsuarioDTO, UsuariosEmRiscoDTO } from '@/types/api';

export function useEventosAtendidos(id: string | null | undefined) {
  return useQuery({
    queryKey: ['usuario', id, 'eventos-atendidos'],
    queryFn: () => api.get<AtendimentoDTO[]>(`/usuarios/${id}/eventos-atendidos`).then((r) => r.data),
    enabled: !!id,
  });
}

interface TenantDTO {
  id: string;
  nome: string;
  tipo: string;
  uf: string | null;
  ibgeCod: string | null;
  idPai: string | null;
  isActive: boolean;
}

const TEN_MIN = 10 * 60_000;

export interface UsuariosFilter {
  role?: string;
  status?: string;
  especialidade?: string;
}

/** Lista de usuários do escopo do gestor (para seleção, ex.: definir coordenador de PC). */
export function useUsuariosList(params?: UsuariosFilter, enabled = true) {
  return useQuery({
    queryKey: ['usuarios', 'list', params],
    queryFn: () => api.get<UsuarioDTO[]>('/usuarios', { params }).then((r) => r.data),
    enabled,
  });
}

export interface CriarUsuarioInput {
  nome: string;
  email: string;
  telefone?: string;
  documento: string;
  senha: string;
  tenantId: string;
  roleNome: Role;
}

export function useCriarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CriarUsuarioInput) =>
      api.post<UsuarioDTO>('/usuarios', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

export function useMudarRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roleNome }: { id: string; roleNome: Role }) =>
      api.patch<UsuarioDTO>(`/usuarios/${id}/role`, { roleNome }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

export function useAprovarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/usuarios/${id}/aprovar`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

export function useRejeitarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      api.patch(`/usuarios/${id}/rejeitar`, { motivo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

/** Usuário autenticado (inclui tenantId). */
export function useMe() {
  return useQuery({
    queryKey: ['usuarios', 'me'],
    queryFn: () => api.get<UsuarioDTO>('/usuarios/me').then((r) => r.data),
    staleTime: TEN_MIN,
  });
}

export function useTenant(id: string | null | undefined) {
  return useQuery({
    queryKey: ['tenant', id],
    queryFn: () => api.get<TenantDTO>(`/tenants/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: TEN_MIN,
  });
}

export function useUsuario(id: string | null | undefined) {
  return useQuery({
    queryKey: ['usuario', id],
    queryFn: () => api.get<UsuarioDTO>(`/usuarios/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: TEN_MIN,
  });
}

/** Usuários dentro de zonas de risco ativas ou raio de evento ativo (GESTOR). Atualiza a cada 60s. */
export function useUsuariosEmRisco() {
  return useQuery({
    queryKey: ['usuarios', 'em-risco'],
    queryFn: () => api.get<UsuariosEmRiscoDTO>('/usuarios/em-risco').then((r) => r.data),
    refetchInterval: 60_000,
  });
}

/** Resolve vários usuários por id (ex.: responsáveis no histórico) → mapa id→nome. */
export function useUsuariosByIds(ids: (string | null | undefined)[]) {
  const unique = Array.from(new Set(ids.filter((x): x is string => !!x)));
  const results = useQueries({
    queries: unique.map((id) => ({
      queryKey: ['usuario', id],
      queryFn: () => api.get<UsuarioDTO>(`/usuarios/${id}`).then((r) => r.data),
      staleTime: TEN_MIN,
    })),
  });
  const nameById: Record<string, string> = {};
  results.forEach((r, i) => {
    if (r.data) nameById[unique[i]] = r.data.nome;
  });
  return nameById;
}
