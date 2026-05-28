import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  EventoDTO,
  EventoStatus,
  HistoricoDTO,
  IncidentesDTO,
  Severidade,
  TriagemDTO,
  FideDTO,
  DemandaDTO,
  CheckinDTO,
  CriarEventoInput,
  PcDTO,
} from '@/types/api';

export interface EventosFilter {
  status?: EventoStatus;
  severidade?: Severidade;
  tipo?: string;
  is_simulado?: boolean;
}

export function useEventos(params?: EventosFilter) {
  return useQuery({
    queryKey: ['eventos', params],
    queryFn: () => api.get<EventoDTO[]>('/eventos', { params }).then((r) => r.data),
    refetchInterval: 30_000,
  });
}

export function useEvento(id: string | undefined) {
  return useQuery({
    queryKey: ['evento', id],
    queryFn: () => api.get<EventoDTO>(`/eventos/${id}`).then((r) => r.data),
    enabled: !!id,
    refetchInterval: 30_000,
  });
}

export function useEventoIncidentes(id: string | undefined) {
  return useQuery({
    queryKey: ['evento', id, 'incidentes'],
    queryFn: () =>
      api.get<IncidentesDTO[]>(`/eventos/${id}/incidentes`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useEventoIncidentesAtual(id: string | undefined) {
  return useQuery({
    queryKey: ['evento', id, 'incidentes', 'atual'],
    queryFn: () =>
      api
        .get<IncidentesDTO>(`/eventos/${id}/incidentes/atual`)
        .then((r) => r.data)
        .catch(() => null),
    enabled: !!id,
  });
}

export function useEventoTriagem(id: string | undefined) {
  return useQuery({
    queryKey: ['evento', id, 'triagem'],
    queryFn: () => api.get<TriagemDTO[]>(`/eventos/${id}/triagem`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useEventoHistorico(id: string | undefined) {
  return useQuery({
    queryKey: ['evento', id, 'historico'],
    queryFn: () => api.get<HistoricoDTO[]>(`/eventos/${id}/historico`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useEventoFide(id: string | undefined) {
  return useQuery({
    queryKey: ['evento', id, 'fide'],
    queryFn: () => api.get<FideDTO>(`/eventos/${id}/fide`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useEventoMural(id: string | undefined) {
  return useQuery({
    queryKey: ['evento', id, 'mural'],
    queryFn: () => api.get<DemandaDTO[]>(`/eventos/${id}/mural`).then((r) => r.data),
    enabled: !!id,
  });
}

export interface FideInput {
  municipioAfetado?: string;
  decretoMunicipal?: string;
  dataDecreto?: string;
  popAfetada?: number;
  danosMateriais?: string;
  acoesResposta?: string;
  recursosSolicitados?: string;
  prejuizoPublico?: number;
  prejuizoPrivado?: number;
  danosHumanosDesc?: string;
}

export function useValidarFide(id: string | undefined) {
  return useQuery({
    queryKey: ['evento', id, 'fide', 'validar'],
    queryFn: () =>
      api
        .get<{ pronto: boolean; motivoBloqueio: string | null }>(`/eventos/${id}/fide/validar`)
        .then((r) => r.data),
    enabled: !!id,
  });
}

export function useAtualizarFide(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: FideInput) =>
      api.put<FideDTO>(`/eventos/${id}/fide`, input).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evento', id, 'fide'] });
      qc.invalidateQueries({ queryKey: ['evento', id] });
    },
  });
}

export function useSubmeterFide(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch<FideDTO>(`/eventos/${id}/fide/submeter`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evento', id, 'fide'] });
      qc.invalidateQueries({ queryKey: ['evento', id] });
    },
  });
}

export interface IncidentesInput {
  mortos?: number;
  feridos?: number;
  desabrigados?: number;
  desaparecidos?: number;
  startVermelho?: number;
  startAmarelo?: number;
  startVerde?: number;
  startPreto?: number;
}

export function useRegistrarIncidentes(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: IncidentesInput) =>
      api.post<IncidentesDTO>(`/eventos/${id}/incidentes`, input).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evento', id, 'incidentes'] });
    },
  });
}

export function useEventoCheckins(id: string | undefined) {
  return useQuery({
    queryKey: ['evento', id, 'checkins'],
    queryFn: () => api.get<CheckinDTO[]>(`/eventos/${id}/checkins`).then((r) => r.data),
    enabled: !!id,
    refetchInterval: 30_000,
  });
}

/** PCs vinculados ao evento com o status (padrão ACEITO) — os que aceitaram ajudar. */
export function useEventoPontosColeta(id: string | undefined, status = 'ACEITO') {
  return useQuery({
    queryKey: ['evento', id, 'pontos-coleta', status],
    queryFn: () =>
      api
        .get<PcDTO[]>(`/eventos/${id}/pontos-coleta`, { params: { status } })
        .then((r) => r.data),
    enabled: !!id,
  });
}

export function useCriarEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CriarEventoInput) =>
      api.post<EventoDTO>('/eventos', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eventos'] }),
  });
}

function useEventoMutation<T>(fn: (id: string) => Promise<T>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['eventos'] });
      qc.invalidateQueries({ queryKey: ['evento', id] });
    },
  });
}

export function useAprovarEvento() {
  return useEventoMutation((id) => api.patch(`/eventos/${id}/aprovar`).then((r) => r.data));
}

export function useCancelarEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, observacao }: { id: string; observacao?: string }) =>
      api.patch(`/eventos/${id}/cancelar`, { observacao }).then((r) => r.data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['eventos'] });
      qc.invalidateQueries({ queryKey: ['evento', id] });
    },
  });
}

export function useMudarStatusEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      observacao,
    }: {
      id: string;
      status: EventoStatus;
      observacao?: string;
    }) => api.patch(`/eventos/${id}/status`, { status, observacao }).then((r) => r.data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['eventos'] });
      qc.invalidateQueries({ queryKey: ['evento', id] });
    },
  });
}
