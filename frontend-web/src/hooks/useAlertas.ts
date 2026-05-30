import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AckInput,
  AlertaCategoria,
  AlertaDTO,
  AlertaDashboardDTO,
  AlertaDestinatarioDTO,
  AlertaPreviewDTO,
  AlertaTemplateDTO,
  AlertasFilter,
  CreateCollectionPointsInput,
  CreateDangerZoneAlertInput,
  CreateEventZoneAlertInput,
  CreateMonitorsInput,
  CreatePersonalizedInput,
  CreateSupportPointsInput,
  CreateTechnicalRequestInput,
  CreateTenantBroadcastInput,
  DeliveryStatus,
  EscalateAlertInput,
} from '@/types/api';

const ALERT_REFRESH_MS = 15_000;

/** Lista alertas do escopo de tenant + filtros opcionais. */
export function useAlertas(filters?: AlertasFilter) {
  return useQuery({
    queryKey: ['alertas', filters],
    queryFn: () => api.get<AlertaDTO[]>('/alertas', { params: filters }).then((r) => r.data),
    refetchInterval: ALERT_REFRESH_MS,
  });
}

/** Camada de mapa: alertas no escopo (sem filtros). */
export function useAlertasMapLayer() {
  return useQuery({
    queryKey: ['alertas', 'map'],
    queryFn: () => api.get<AlertaDTO[]>('/alertas').then((r) => r.data),
    refetchInterval: 30_000,
  });
}

export function useAlerta(id: string | null | undefined) {
  return useQuery({
    queryKey: ['alerta', id],
    queryFn: () => api.get<AlertaDTO>(`/alertas/${id}`).then((r) => r.data),
    enabled: !!id,
    refetchInterval: ALERT_REFRESH_MS,
  });
}

export function useAlertaDestinatarios(id: string | null | undefined, status?: DeliveryStatus) {
  return useQuery({
    queryKey: ['alerta', id, 'destinatarios', status],
    queryFn: () =>
      api
        .get<AlertaDestinatarioDTO[]>(`/alertas/${id}/destinatarios`, { params: status ? { status } : {} })
        .then((r) => r.data),
    enabled: !!id,
  });
}

export function useAlertasDashboard() {
  return useQuery({
    queryKey: ['alertas', 'dashboard'],
    queryFn: () => api.get<AlertaDashboardDTO>('/alertas/dashboard').then((r) => r.data),
    refetchInterval: ALERT_REFRESH_MS,
  });
}

// ───────────────────── Create mutations (por categoria) ─────────────────────

function endpointFor(categoria: AlertaCategoria | 'ESCALATION'): string {
  switch (categoria) {
    case 'DANGER_ZONE':      return '/alertas/danger-zone';
    case 'EVENT_ZONE':       return '/alertas/event-zone';
    case 'TENANT_BROADCAST': return '/alertas/tenant-broadcast';
    case 'TECHNICAL_REQUEST':return '/alertas/technical-request';
    case 'SUPPORT_POINTS':   return '/alertas/support-points';
    case 'COLLECTION_POINTS':return '/alertas/collection-points';
    case 'MONITORS':         return '/alertas/monitors';
    case 'PERSONALIZED':     return '/alertas/personalized';
    case 'ESCALATION':       return '/alertas/escalonar';
  }
}

function useCreateAlertaMutation<TInput>(categoria: AlertaCategoria | 'ESCALATION') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TInput) =>
      api.post<AlertaDTO>(endpointFor(categoria), input).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alertas'] });
    },
  });
}

export const useCreateDangerZone        = () => useCreateAlertaMutation<CreateDangerZoneAlertInput>('DANGER_ZONE');
export const useCreateEventZone         = () => useCreateAlertaMutation<CreateEventZoneAlertInput>('EVENT_ZONE');
export const useCreateTenantBroadcast   = () => useCreateAlertaMutation<CreateTenantBroadcastInput>('TENANT_BROADCAST');
export const useCreateTechnicalRequest  = () => useCreateAlertaMutation<CreateTechnicalRequestInput>('TECHNICAL_REQUEST');
export const useCreateSupportPoints     = () => useCreateAlertaMutation<CreateSupportPointsInput>('SUPPORT_POINTS');
export const useCreateCollectionPoints  = () => useCreateAlertaMutation<CreateCollectionPointsInput>('COLLECTION_POINTS');
export const useCreateMonitorsAlert     = () => useCreateAlertaMutation<CreateMonitorsInput>('MONITORS');
export const useCreatePersonalizedAlert = () => useCreateAlertaMutation<CreatePersonalizedInput>('PERSONALIZED');
export const useEscalateAlert           = () => useCreateAlertaMutation<EscalateAlertInput>('ESCALATION');

// ───────────────────── Preview mutations (1F.2) ─────────────────────

function previewEndpointFor(categoria: AlertaCategoria | 'ESCALATION'): string {
  switch (categoria) {
    case 'DANGER_ZONE':      return '/alertas/preview/danger-zone';
    case 'EVENT_ZONE':       return '/alertas/preview/event-zone';
    case 'TENANT_BROADCAST': return '/alertas/preview/tenant-broadcast';
    case 'TECHNICAL_REQUEST':return '/alertas/preview/technical-request';
    case 'SUPPORT_POINTS':   return '/alertas/preview/support-points';
    case 'COLLECTION_POINTS':return '/alertas/preview/collection-points';
    case 'MONITORS':         return '/alertas/preview/monitors';
    case 'PERSONALIZED':     return '/alertas/preview/personalized';
    case 'ESCALATION':       return '/alertas/preview/escalonar';
  }
}

function usePreviewMutation<TInput>(categoria: AlertaCategoria | 'ESCALATION') {
  return useMutation({
    mutationFn: (input: TInput) =>
      api.post<AlertaPreviewDTO>(previewEndpointFor(categoria), input).then((r) => r.data),
  });
}

export const usePreviewDangerZone        = () => usePreviewMutation<CreateDangerZoneAlertInput>('DANGER_ZONE');
export const usePreviewEventZone         = () => usePreviewMutation<CreateEventZoneAlertInput>('EVENT_ZONE');
export const usePreviewTenantBroadcast   = () => usePreviewMutation<CreateTenantBroadcastInput>('TENANT_BROADCAST');
export const usePreviewTechnicalRequest  = () => usePreviewMutation<CreateTechnicalRequestInput>('TECHNICAL_REQUEST');
export const usePreviewSupportPoints     = () => usePreviewMutation<CreateSupportPointsInput>('SUPPORT_POINTS');
export const usePreviewCollectionPoints  = () => usePreviewMutation<CreateCollectionPointsInput>('COLLECTION_POINTS');
export const usePreviewMonitors          = () => usePreviewMutation<CreateMonitorsInput>('MONITORS');
export const usePreviewPersonalized      = () => usePreviewMutation<CreatePersonalizedInput>('PERSONALIZED');
export const usePreviewEscalation        = () => usePreviewMutation<EscalateAlertInput>('ESCALATION');

// ───────────────────── Management mutations ─────────────────────

export function useResolverAlerta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<AlertaDTO>(`/alertas/${id}/resolver`).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['alertas'] });
      qc.invalidateQueries({ queryKey: ['alerta', data.id] });
    },
  });
}

export function useCancelarAlerta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<AlertaDTO>(`/alertas/${id}/cancelar`).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['alertas'] });
      qc.invalidateQueries({ queryKey: ['alerta', data.id] });
    },
  });
}

/** Marca o alerta como visualizado pelo usuário atual (idempotente). */
export function useVisualizarAlerta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<AlertaDestinatarioDTO>(`/alertas/${id}/visualizar`).then((r) => r.data),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['alerta', id] });
    },
  });
}

export function useAckAlerta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AckInput }) =>
      api.patch<AlertaDestinatarioDTO>(`/alertas/${id}/ack`, input).then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['alerta', vars.id] });
      qc.invalidateQueries({ queryKey: ['alertas'] });
    },
  });
}

/** Template padrão da categoria (1F.4). Cache agressivo — templates raramente mudam. */
export function useAlertaTemplate(categoria: AlertaCategoria | null | undefined) {
  return useQuery({
    queryKey: ['alerta-template', categoria],
    queryFn: () => api.get<AlertaTemplateDTO>(`/alertas/templates/${categoria}`).then((r) => r.data),
    enabled: !!categoria,
    staleTime: 60 * 60_000, // 1h
  });
}

/** Substitui {placeholders} em um string com valores do contexto. */
export function applyTemplate(text: string, context: Record<string, string | number | null | undefined>): string {
  if (!text) return text;
  return text.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const v = context[key];
    return v != null ? String(v) : `{${key}}`;
  });
}
