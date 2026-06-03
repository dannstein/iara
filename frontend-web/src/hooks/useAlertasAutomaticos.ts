import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AlertaAutomaticoDTO, AlertaAutomaticoLogDTO } from '@/types/api';

const REFRESH_MS = 30_000;

export function useAlertasAutomaticos() {
  return useQuery({
    queryKey: ['alertas-automaticos'],
    queryFn: () =>
      api.get<AlertaAutomaticoDTO[]>('/alertas/automaticos').then((r) => r.data),
    refetchInterval: REFRESH_MS,
  });
}

export function useAtivarAlertaAutomatico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { ruleId: string; config?: Record<string, unknown> }) =>
      api
        .patch<AlertaAutomaticoDTO>(
          `/alertas/automaticos/${vars.ruleId}/ativar`,
          vars.config ?? {},
        )
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alertas-automaticos'] });
      qc.invalidateQueries({ queryKey: ['alertas-automaticos-log'] });
    },
  });
}

export function useDesativarAlertaAutomatico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) =>
      api
        .patch<AlertaAutomaticoDTO>(`/alertas/automaticos/${ruleId}/desativar`)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alertas-automaticos'] });
      qc.invalidateQueries({ queryKey: ['alertas-automaticos-log'] });
    },
  });
}

export function useAtualizarConfigAutomatico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { ruleId: string; config: Record<string, unknown> }) =>
      api
        .put<AlertaAutomaticoDTO>(
          `/alertas/automaticos/${vars.ruleId}/config`,
          vars.config,
        )
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alertas-automaticos'] });
      qc.invalidateQueries({ queryKey: ['alertas-automaticos-log'] });
    },
  });
}

interface LogPage {
  content: AlertaAutomaticoLogDTO[];
  totalElements: number;
  totalPages: number;
}

export function useAlertaAutomaticoLog(ruleId?: string) {
  return useQuery({
    queryKey: ['alertas-automaticos-log', ruleId],
    queryFn: () =>
      api
        .get<LogPage>('/alertas/automaticos/log', {
          params: ruleId ? { ruleId, size: 100 } : { size: 100 },
        })
        .then((r) => r.data),
    refetchInterval: REFRESH_MS,
  });
}
