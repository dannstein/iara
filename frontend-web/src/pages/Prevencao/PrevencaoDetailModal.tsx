import { useState } from 'react';
import { toast } from 'sonner';
import {
  ShieldCheck,
  MapPin,
  FileText,
  ExternalLink,
  Play,
  Check,
  Ban,
  Eye,
  AlertOctagon,
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import {
  Modal,
  Button,
  Select,
  Skeleton,
  LoadingBlock,
  ErrorState,
} from '@/components/ui';
import {
  usePrevencaoDetail,
  useSolicitacaoHistorico,
  useRevisarSolicitacao,
  useAssumirSolicitacao,
  useConcluirSolicitacao,
  useIndeferirSolicitacao,
  useSetPrioridade,
} from '@/hooks/usePrevencao';
import { useUsuario, useUsuariosByIds } from '@/hooks/useUsuarios';
import { apiErrorMessage } from '@/lib/api';
import { formatAbsolute, formatRelative } from '@/lib/utils';
import {
  PRIORIDADE_COLOR,
  STATUS_COLOR,
  STATUS_LABEL,
  TIPO_LABEL,
} from './PrevencaoPage';
import type { Severidade, SolicitacaoStatus } from '@/types/api';

const TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

interface Props {
  id: string | null;
  onClose: () => void;
}

export function PrevencaoDetailModal({ id, onClose }: Props) {
  const sol = usePrevencaoDetail(id);
  const historico = useSolicitacaoHistorico(id);
  const reporter = useUsuario(sol.data?.usuarioId);
  const respId = sol.data?.responsavelId ?? null;
  const responsavel = useUsuario(respId);

  // Resolver nomes dos responsáveis do histórico.
  const nameById = useUsuariosByIds((historico.data ?? []).map((h) => h.responsavelId));

  const revisar = useRevisarSolicitacao();
  const assumir = useAssumirSolicitacao();
  const concluir = useConcluirSolicitacao();
  const indeferir = useIndeferirSolicitacao();
  const setPrioridade = useSetPrioridade();

  const [observacao, setObservacao] = useState('');
  const [parecer, setParecer] = useState('');

  function fire(action: 'revisar' | 'assumir' | 'concluir', label: string) {
    if (!sol.data) return;
    const mutation =
      action === 'revisar' ? revisar : action === 'assumir' ? assumir : concluir;
    mutation.mutate(
      { id: sol.data.id, observacao: observacao || undefined },
      {
        onSuccess: () => {
          toast.success(label);
          setObservacao('');
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
      },
    );
  }

  function cancelar() {
    if (!sol.data || !parecer.trim()) return;
    indeferir.mutate(
      { id: sol.data.id, parecer: parecer.trim() },
      {
        onSuccess: () => {
          toast.success('Solicitação cancelada.');
          setParecer('');
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
      },
    );
  }

  function mudarPrioridade(p: Severidade) {
    if (!sol.data) return;
    setPrioridade.mutate(
      { id: sol.data.id, prioridade: p },
      {
        onSuccess: () => toast.success('Prioridade atualizada.'),
        onError: (e) => toast.error(apiErrorMessage(e)),
      },
    );
  }

  const s = sol.data;
  const terminal = s && (s.status === 'CONCLUIDA' || s.status === 'INDEFERIDA');

  return (
    <Modal
      open={!!id}
      onClose={onClose}
      title={s ? (TIPO_LABEL[s.tipo] ?? s.tipo) : ''}
      eyebrow="Solicitação de prevenção"
      icon={<ShieldCheck size={16} />}
      maxWidth="max-w-3xl"
    >
      {sol.isLoading ? (
        <LoadingBlock />
      ) : sol.isError || !s ? (
        <ErrorState />
      ) : (
        <div className="flex flex-col gap-5">
          {/* Cabeçalho com status + prioridade */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-bg-secondary px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              <span
                className="rounded px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: `${STATUS_COLOR[s.status]}22`, color: STATUS_COLOR[s.status] }}
              >
                {STATUS_LABEL[s.status]}
              </span>
              {s.prioridade && (
                <span
                  className="rounded px-2 py-0.5 text-[11px] font-bold uppercase"
                  style={{ background: `${PRIORIDADE_COLOR[s.prioridade]}22`, color: PRIORIDADE_COLOR[s.prioridade] }}
                >
                  {s.prioridade}
                </span>
              )}
              <span className="text-ink-muted">Aberto {formatRelative(s.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-ink-muted">Prioridade:</span>
              <Select
                className="w-auto"
                value={s.prioridade ?? ''}
                onChange={(e) => e.target.value && mudarPrioridade(e.target.value as Severidade)}
                disabled={setPrioridade.isPending}
              >
                <option value="" disabled>
                  Definir…
                </option>
                {(['CRITICA', 'ALTA', 'MEDIA', 'BAIXA'] as Severidade[]).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Reporter + endereço + descrição */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              <div>
                <p className="eyebrow mb-1">Relatado por</p>
                <p className="text-[13px] text-ink-primary">{reporter.data?.nome ?? '…'}</p>
                {reporter.data?.telefone && (
                  <p className="text-[11px] text-ink-muted">{reporter.data.telefone}</p>
                )}
              </div>
              <div>
                <p className="eyebrow mb-1">Responsável atual</p>
                <p className="text-[13px] text-ink-primary">
                  {responsavel.data?.nome ?? (respId ? '…' : 'Sem responsável')}
                </p>
              </div>
              <div>
                <p className="eyebrow mb-1">Endereço</p>
                <p className="flex items-start gap-1.5 text-[13px] text-ink-primary">
                  <MapPin size={13} className="mt-0.5 flex-shrink-0 text-ink-muted" />
                  {s.enderecoTxt}
                </p>
                {s.geometria && (
                  <p className="data-mono mt-0.5 text-[11px] text-ink-muted">
                    {s.geometria.lat.toFixed(4)}, {s.geometria.lng.toFixed(4)}
                  </p>
                )}
              </div>
              <div>
                <p className="eyebrow mb-1">Motivo</p>
                <p className="whitespace-pre-wrap text-[13px] text-ink-secondary">{s.descricaoMotivo}</p>
              </div>
              {s.observacaoDc && (
                <div>
                  <p className="eyebrow mb-1">Observação técnica</p>
                  <p className="whitespace-pre-wrap text-[13px] text-ink-secondary">{s.observacaoDc}</p>
                </div>
              )}
              {s.pdfUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {s.pdfUrls.map((u, i) => (
                    <a
                      key={u}
                      href={u}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[12px] text-brand-light hover:underline"
                    >
                      <FileText size={12} /> Vistoria {i + 1} <ExternalLink size={10} />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {s.geometria && (
                <div className="h-40 overflow-hidden rounded-lg border border-white/10">
                  <MapContainer
                    center={[s.geometria.lat, s.geometria.lng]}
                    zoom={15}
                    className="h-full w-full"
                    zoomControl={false}
                  >
                    <TileLayer url={TILE_URL} attribution="&copy; OpenStreetMap" />
                    <CircleMarker
                      center={[s.geometria.lat, s.geometria.lng]}
                      radius={8}
                      pathOptions={{
                        color: PRIORIDADE_COLOR[s.prioridade ?? 'MEDIA'] ?? '#3B82F6',
                        fillColor: PRIORIDADE_COLOR[s.prioridade ?? 'MEDIA'] ?? '#3B82F6',
                        fillOpacity: 0.7,
                        weight: 2,
                      }}
                    />
                  </MapContainer>
                </div>
              )}
              <div>
                <p className="eyebrow mb-1">Fotos ({s.fotosUrls.length})</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {s.fotosUrls.map((f) => (
                    <a
                      key={f.url}
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-20 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-[10px] text-ink-muted hover:border-brand-dark/50 hover:text-ink-secondary"
                    >
                      <span className="flex flex-col items-center gap-1">
                        <FileText size={14} /> #{f.ordem}
                      </span>
                    </a>
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-ink-muted">
                  As URLs são links de armazenamento (s3:// em dev) — abra para inspecionar.
                </p>
              </div>
            </div>
          </div>

          {/* Histórico */}
          <div>
            <p className="eyebrow mb-2">Linha do tempo</p>
            {historico.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (historico.data?.length ?? 0) === 0 ? (
              <p className="text-[12px] text-ink-muted">Nenhuma anotação ainda.</p>
            ) : (
              <div className="flex flex-col gap-0 border-l border-white/10 pl-5">
                {historico.data!.map((h) => (
                  <div key={h.id} className="relative pb-4">
                    <span
                      className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-bg-app"
                      style={{ background: STATUS_COLOR[h.statusPara as SolicitacaoStatus] ?? '#64748B' }}
                    />
                    <p className="text-[13px] text-ink-primary">
                      <strong>{STATUS_LABEL[h.statusPara as SolicitacaoStatus] ?? h.statusPara}</strong>
                    </p>
                    <p className="text-[11px] text-ink-secondary">
                      por <span className="text-ink-primary">{nameById[h.responsavelId ?? ''] ?? '—'}</span>
                    </p>
                    {h.observacao && (
                      <p className="mt-0.5 whitespace-pre-wrap text-[12px] text-ink-secondary">{h.observacao}</p>
                    )}
                    <p className="text-[11px] text-ink-muted" title={formatAbsolute(h.createdAt)}>
                      {formatRelative(h.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ações do gestor */}
          {!terminal && (
            <div className="rounded-lg border border-white/[0.06] bg-bg-secondary p-4">
              <p className="eyebrow mb-2">Atualizar atendimento</p>
              <textarea
                className="input min-h-[64px] w-full resize-y"
                placeholder="Anote o que está sendo feito agora (técnica/observação para esta transição)"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                {s.status === 'ABERTA' && (
                  <Button variant="secondary" onClick={() => fire('revisar', 'Em revisão.')} loading={revisar.isPending}>
                    <Eye size={14} /> Em revisão
                  </Button>
                )}
                {s.status !== 'EM_ATENDIMENTO' && (
                  <Button onClick={() => fire('assumir', 'Atendimento iniciado.')} loading={assumir.isPending}>
                    <Play size={14} /> Iniciar atendimento
                  </Button>
                )}
                <Button onClick={() => fire('concluir', 'Atendimento finalizado.')} loading={concluir.isPending}>
                  <Check size={14} /> Finalizar
                </Button>
              </div>

              <div className="mt-4 border-t border-white/5 pt-3">
                <p className="eyebrow mb-1.5">Cancelar / Indeferir</p>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Motivo do cancelamento (obrigatório)"
                    value={parecer}
                    onChange={(e) => setParecer(e.target.value)}
                  />
                  <Button variant="danger" onClick={cancelar} loading={indeferir.isPending} disabled={!parecer.trim()}>
                    <Ban size={14} /> Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {terminal && (
            <p className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-bg-secondary px-4 py-3 text-[12px] text-ink-muted">
              <AlertOctagon size={14} /> Solicitação encerrada — sem novas ações.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
