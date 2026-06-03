import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { NotificacaoPrefDTO, UpdateNotificacaoPrefInput } from '@/types/api';

export function useNotificacaoPrefs() {
  return useQuery({
    queryKey: ['notificacao-prefs'],
    queryFn: () =>
      api.get<NotificacaoPrefDTO>('/usuarios/me/notificacao-prefs').then((r) => r.data),
  });
}

export function useAtualizarNotificacaoPrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateNotificacaoPrefInput) =>
      api.put<NotificacaoPrefDTO>('/usuarios/me/notificacao-prefs', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificacao-prefs'] }),
  });
}
