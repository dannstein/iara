import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  SolicitacaoHistoricoDTO,
  SolicitacaoServicoDTO,
  Severidade,
} from '@/types/api';

export function usePrevencao() {
  return useQuery({
    queryKey: ['solicitacoes-servico'],
    queryFn: () =>
      api.get<SolicitacaoServicoDTO[]>('/solicitacoes-servico').then((r) => r.data),
    refetchInterval: 30_000,
  });
}

export function usePrevencaoDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: ['solicitacao-servico', id],
    queryFn: () =>
      api.get<SolicitacaoServicoDTO>(`/solicitacoes-servico/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useSolicitacaoHistorico(id: string | null | undefined) {
  return useQuery({
    queryKey: ['solicitacao-servico', id, 'historico'],
    queryFn: () =>
      api
        .get<SolicitacaoHistoricoDTO[]>(`/solicitacoes-servico/${id}/historico`)
        .then((r) => r.data),
    enabled: !!id,
  });
}

function useTransicao(path: 'revisar' | 'assumir' | 'concluir') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, observacao }: { id: string; observacao?: string }) =>
      api.patch<SolicitacaoServicoDTO>(`/solicitacoes-servico/${id}/${path}`, { observacao }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['solicitacoes-servico'] });
      qc.invalidateQueries({ queryKey: ['solicitacao-servico', vars.id] });
    },
  });
}

export const useRevisarSolicitacao = () => useTransicao('revisar');
export const useAssumirSolicitacao = () => useTransicao('assumir');
export const useConcluirSolicitacao = () => useTransicao('concluir');

export function useIndeferirSolicitacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, parecer }: { id: string; parecer: string }) =>
      api.patch<SolicitacaoServicoDTO>(`/solicitacoes-servico/${id}/indeferir`, { parecer }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['solicitacoes-servico'] });
      qc.invalidateQueries({ queryKey: ['solicitacao-servico', vars.id] });
    },
  });
}

export function useSetPrioridade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, prioridade }: { id: string; prioridade: Severidade }) =>
      api.patch<SolicitacaoServicoDTO>(`/solicitacoes-servico/${id}/prioridade`, { prioridade }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['solicitacoes-servico'] });
      qc.invalidateQueries({ queryKey: ['solicitacao-servico', vars.id] });
    },
  });
}
