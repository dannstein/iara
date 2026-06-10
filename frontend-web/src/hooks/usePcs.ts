import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  CapacidadeDTO,
  DemandaDTO,
  DoacaoDTO,
  EstoqueDTO,
  HelperDTO,
  InventoryTransactionDTO,
  MotivoRecusaDTO,
  PcAuditLogDTO,
  PcDTO,
  PcEventoDTO,
  SpringPage,
  WorkerDisponibilidadeDTO,
} from '@/types/api';

/* ---------------- PC events (lifecycle 4B) ---------------- */

export function usePcEventos(pcId?: string) {
  return useQuery({
    queryKey: ['pc', pcId, 'eventos'],
    queryFn: () => api.get<PcEventoDTO[]>(`/pontos-coleta/${pcId}/eventos`).then((r) => r.data),
    enabled: !!pcId,
  });
}

export function useMotivosRecusa() {
  return useQuery({
    queryKey: ['pc', 'motivos-recusa'],
    queryFn: () => api.get<MotivoRecusaDTO[]>('/pontos-coleta/motivos-recusa').then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}

export function useAceitarPcEvento(pcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventoId: string) =>
      api
        .patch<PcEventoDTO>(`/pontos-coleta/${pcId}/eventos/${eventoId}/aceitar`)
        .then((r) => r.data),
    onSuccess: () => invalidatePc(qc, pcId),
  });
}

export function useRecusarPcEvento(pcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { eventoId: string; idMotivoRecusa: string; descricao?: string }) =>
      api
        .patch<PcEventoDTO>(`/pontos-coleta/${pcId}/eventos/${vars.eventoId}/recusar`, {
          idMotivoRecusa: vars.idMotivoRecusa,
          descricao: vars.descricao,
        })
        .then((r) => r.data),
    onSuccess: () => invalidatePc(qc, pcId),
  });
}

export function useWorkforce(pcId?: string, eventoId?: string) {
  return useQuery({
    queryKey: ['pc', pcId, 'eventos', eventoId, 'workforce'],
    queryFn: () =>
      api
        .get<WorkerDisponibilidadeDTO[]>(
          `/pontos-coleta/${pcId}/eventos/${eventoId}/workforce`,
        )
        .then((r) => r.data),
    enabled: !!pcId && !!eventoId,
  });
}

/* ---------------- Worker self-view ---------------- */

export function useWorkerDisponibilidades(status?: string) {
  return useQuery({
    queryKey: ['worker', 'disponibilidade', status],
    queryFn: () =>
      api
        .get<WorkerDisponibilidadeDTO[]>('/worker/evento-disponibilidade', {
          params: status ? { status } : undefined,
        })
        .then((r) => r.data),
  });
}

export function useConfirmarDisponibilidade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api
        .patch<WorkerDisponibilidadeDTO>(`/worker/evento-disponibilidade/${id}/confirmar`)
        .then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['worker', 'disponibilidade'] });
      qc.invalidateQueries({ queryKey: ['pc', data.pcId, 'eventos', data.eventoId, 'workforce'] });
    },
  });
}

export function useRecusarDisponibilidade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; idMotivoRecusa?: string; descricao?: string }) =>
      api
        .patch<WorkerDisponibilidadeDTO>(
          `/worker/evento-disponibilidade/${vars.id}/recusar`,
          { idMotivoRecusa: vars.idMotivoRecusa, descricao: vars.descricao },
        )
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worker', 'disponibilidade'] }),
  });
}

/* ---------------- Demandas (4C) ---------------- */

export interface DemandaFilter {
  is_active?: boolean;
  prioridade?: string;
  id_evento?: string;
}

export function useDemandas(pcId?: string, filters?: DemandaFilter) {
  return useQuery({
    queryKey: ['pc', pcId, 'demandas', filters],
    queryFn: () =>
      api
        .get<DemandaDTO[]>(`/pontos-coleta/${pcId}/demandas`, { params: filters })
        .then((r) => r.data),
    enabled: !!pcId,
  });
}

export interface CriarDemandaPayload {
  idEvento: string;
  idTipo: string;
  prioridade?: string;
  qtdSolicitada: number;
  descricao?: string;
  qtdMaximaCapacidade?: number;
}

export function useCriarDemandaPc(pcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CriarDemandaPayload) =>
      api.post<DemandaDTO>(`/pontos-coleta/${pcId}/demandas`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pc', pcId, 'demandas'] }),
  });
}

export function useFecharDemanda(pcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (demandaId: string) =>
      api
        .patch<DemandaDTO>(`/pontos-coleta/${pcId}/demandas/${demandaId}/fechar`)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pc', pcId, 'demandas'] }),
  });
}

/* ---------------- Capacidades (4C) ---------------- */

export function useCapacidades(pcId?: string) {
  return useQuery({
    queryKey: ['pc', pcId, 'capacidades'],
    queryFn: () =>
      api.get<CapacidadeDTO[]>(`/pontos-coleta/${pcId}/capacidades`).then((r) => r.data),
    enabled: !!pcId,
  });
}

export function useUpsertCapacidade(pcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { tipoId: string; qtdMaxima: number }) =>
      api
        .put<CapacidadeDTO>(`/pontos-coleta/${pcId}/capacidades/${vars.tipoId}`, {
          qtdMaxima: vars.qtdMaxima,
        })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pc', pcId, 'capacidades'] }),
  });
}

/* ---------------- Estoque + Doações (4D) ---------------- */

export function useEstoque(pcId?: string) {
  return useQuery({
    queryKey: ['pc', pcId, 'estoque'],
    queryFn: () => api.get<EstoqueDTO[]>(`/pontos-coleta/${pcId}/estoque`).then((r) => r.data),
    enabled: !!pcId,
  });
}

export function useDoacoesPendentesPc(pcId?: string) {
  return useQuery({
    queryKey: ['pc', pcId, 'doacoes'],
    queryFn: () => api.get<DoacaoDTO[]>(`/pontos-coleta/${pcId}/doacoes`).then((r) => r.data),
    enabled: !!pcId,
  });
}

export function useReceberDoacao(pcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; qtdRecebida: number }) =>
      api
        .patch<DoacaoDTO>(`/doacoes/${vars.id}/receber`, { qtdRecebida: vars.qtdRecebida })
        .then((r) => r.data),
    onSuccess: () => invalidateInventory(qc, pcId),
  });
}

export function useDistribuir(pcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { idTipo: string; quantidade: number; observacao?: string }) =>
      api.post(`/pontos-coleta/${pcId}/estoque/distribuir`, vars).then((r) => r.data),
    onSuccess: () => invalidateInventory(qc, pcId),
  });
}

export function useAjustarEstoque(pcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { idTipo: string; delta: number; observacao?: string }) =>
      api.post(`/pontos-coleta/${pcId}/estoque/ajustar`, vars).then((r) => r.data),
    onSuccess: () => invalidateInventory(qc, pcId),
  });
}

export function useInventoryTransacoes(pcId?: string, eventoId?: string) {
  return useQuery({
    queryKey: ['pc', pcId, 'inventario', eventoId],
    queryFn: () =>
      api
        .get<InventoryTransactionDTO[]>(`/pontos-coleta/${pcId}/inventario/transacoes`, {
          params: eventoId ? { id_evento: eventoId } : undefined,
        })
        .then((r) => r.data),
    enabled: !!pcId,
  });
}

/* ---------------- Helpers / Workers cadastrais ---------------- */

export function useHelpers(pcId?: string, status?: string) {
  return useQuery({
    queryKey: ['pc', pcId, 'helpers', status],
    queryFn: () =>
      api
        .get<HelperDTO[]>(`/pontos-coleta/${pcId}/helpers`, { params: status ? { status } : undefined })
        .then((r) => r.data),
    enabled: !!pcId,
  });
}

export function useConvidarHelper(pcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (idUsuario: string) =>
      api
        .post<HelperDTO>(`/pontos-coleta/${pcId}/helpers/convidar`, null, { params: { idUsuario } })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pc', pcId, 'helpers'] }),
  });
}

export function useEncerrarHelper(pcId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (helperId: string) =>
      api
        .patch<HelperDTO>(`/pontos-coleta/${pcId}/helpers/${helperId}/encerrar`)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pc', pcId, 'helpers'] }),
  });
}

/* ---------------- Histórico / Auditoria (4F) ---------------- */

export function usePcHistorico(pcId?: string, eventoId?: string, page = 0, size = 50) {
  return useQuery({
    queryKey: ['pc', pcId, 'historico', eventoId, page, size],
    queryFn: () =>
      api
        .get<SpringPage<PcAuditLogDTO>>(`/pontos-coleta/${pcId}/historico`, {
          params: { id_evento: eventoId, page, size },
        })
        .then((r) => r.data),
    enabled: !!pcId,
  });
}

export function useWorkerAtividade(pcId?: string, usuarioId?: string, page = 0, size = 50) {
  return useQuery({
    queryKey: ['pc', pcId, 'workers', usuarioId, 'atividade', page, size],
    queryFn: () =>
      api
        .get<SpringPage<PcAuditLogDTO>>(
          `/pontos-coleta/${pcId}/workers/${usuarioId}/atividade`,
          { params: { page, size } },
        )
        .then((r) => r.data),
    enabled: !!pcId && !!usuarioId,
  });
}

/* ---------------- "Meu PC" — picker do coordenador/worker logado ---------------- */

export function useMeuPc(coordenadorId?: string) {
  return useQuery({
    queryKey: ['meu-pc', coordenadorId],
    queryFn: () =>
      api
        .get<PcDTO[]>('/pontos-coleta', { params: { is_active: true } })
        .then((r) => r.data.find((p) => p.coordenadorId === coordenadorId) ?? null),
    enabled: !!coordenadorId,
  });
}

/* ---------------- helpers internos ---------------- */

function invalidatePc(qc: ReturnType<typeof useQueryClient>, pcId: string) {
  qc.invalidateQueries({ queryKey: ['pc', pcId, 'eventos'] });
  qc.invalidateQueries({ queryKey: ['ponto-coleta', pcId] });
}

function invalidateInventory(qc: ReturnType<typeof useQueryClient>, pcId: string) {
  qc.invalidateQueries({ queryKey: ['pc', pcId, 'doacoes'] });
  qc.invalidateQueries({ queryKey: ['pc', pcId, 'estoque'] });
  qc.invalidateQueries({ queryKey: ['pc', pcId, 'demandas'] });
  qc.invalidateQueries({ queryKey: ['pc', pcId, 'inventario'] });
}
