import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AlertaAgendadoDTO,
  AlertaCategoria,
  CreateAlertaAgendadoInput,
} from '@/types/api';

const REFRESH_MS = 30_000;

interface AgendamentosFilter {
  ativo?: boolean;
  categoria?: AlertaCategoria;
}

export function useAgendamentos(filter?: AgendamentosFilter) {
  return useQuery({
    queryKey: ['agendamentos', filter],
    queryFn: () =>
      api
        .get<AlertaAgendadoDTO[]>('/alertas/agendamentos', { params: filter })
        .then((r) => r.data),
    refetchInterval: REFRESH_MS,
  });
}

export function useAgendamento(id: string | null | undefined) {
  return useQuery({
    queryKey: ['agendamento', id],
    queryFn: () =>
      api.get<AlertaAgendadoDTO>(`/alertas/agendamentos/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCriarAgendamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAlertaAgendadoInput) =>
      api.post<AlertaAgendadoDTO>('/alertas/agendamentos', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agendamentos'] }),
  });
}

export function useAtualizarAgendamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateAlertaAgendadoInput }) =>
      api.put<AlertaAgendadoDTO>(`/alertas/agendamentos/${id}`, input).then((r) => r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['agendamentos'] });
      qc.invalidateQueries({ queryKey: ['agendamento', vars.id] });
    },
  });
}

export function useAtivarAgendamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<AlertaAgendadoDTO>(`/alertas/agendamentos/${id}/ativar`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agendamentos'] }),
  });
}

export function useDesativarAgendamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<AlertaAgendadoDTO>(`/alertas/agendamentos/${id}/desativar`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agendamentos'] }),
  });
}

export function useRemoverAgendamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/alertas/agendamentos/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agendamentos'] }),
  });
}
