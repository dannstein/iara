import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { NotificacaoDTO } from '@/types/api';

export function useNotificacoes() {
  return useQuery({
    queryKey: ['notificacoes'],
    queryFn: () => api.get<NotificacaoDTO[]>('/notificacoes').then((r) => r.data),
  });
}

/** Polling do contador de não-lidas — substitui push em tempo real. */
export function useNaoLidasCount() {
  return useQuery({
    queryKey: ['notificacoes', 'nao-lidas', 'count'],
    queryFn: () =>
      api.get<{ count: number }>('/notificacoes/nao-lidas/count').then((r) => r.data.count),
    refetchInterval: 20_000,
  });
}

export function useMarcarLida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notificacoes/${id}/ler`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificacoes'] }),
  });
}

export function useMarcarTodasLidas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch('/notificacoes/ler-todas').then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificacoes'] }),
  });
}
