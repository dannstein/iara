import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AppConfigDTO, UpdateAppConfigInput } from '@/types/api';

const REFRESH_MS = 30_000;

export function useAppConfig() {
  return useQuery({
    queryKey: ['app-config'],
    queryFn: () => api.get<AppConfigDTO>('/admin/app-config').then((r) => r.data),
    refetchInterval: REFRESH_MS,
  });
}

export function useAtualizarAppConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAppConfigInput) =>
      api.put<AppConfigDTO>('/admin/app-config', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app-config'] }),
  });
}
