import { UserCheck, FileText, ExternalLink } from 'lucide-react';
import { Modal, Skeleton, SeverityBadge } from '@/components/ui';
import { useEventosAtendidos } from '@/hooks/useUsuarios';
import { formatRelative } from '@/lib/utils';
import type { UsuarioDTO } from '@/types/api';

interface Props {
  usuario: UsuarioDTO | null;
  especNome?: string;
  onClose: () => void;
}

export function VoluntarioDetailModal({ usuario, especNome, onClose }: Props) {
  const atendidos = useEventosAtendidos(usuario?.id);

  return (
    <Modal
      open={!!usuario}
      onClose={onClose}
      title={usuario?.nome ?? ''}
      eyebrow="Voluntário"
      icon={<UserCheck size={16} />}
      maxWidth="max-w-2xl"
    >
      {usuario && (
        <div className="flex flex-col gap-5">
          {/* Documentação */}
          <div>
            <p className="eyebrow mb-2">Documentação</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <Campo label="E-mail" value={usuario.email} />
              <Campo label="Telefone" value={usuario.telefone ?? '—'} />
              <Campo label="Documento" value={usuario.documento ?? '—'} />
              <Campo label="Situação do cadastro" value={usuario.cadastroSts} />
              <Campo label="Especialidade" value={especNome ?? '—'} />
              <Campo label="Registro profissional" value={usuario.docComprovacaoNumero ?? '—'} />
            </div>
            {usuario.docComprovacaoUrl && (
              <a
                href={usuario.docComprovacaoUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-brand-light hover:underline"
              >
                <FileText size={13} /> Ver documento de comprovação <ExternalLink size={11} />
              </a>
            )}
          </div>

          {/* Histórico de eventos atendidos */}
          <div>
            <p className="eyebrow mb-2">Eventos atendidos</p>
            {atendidos.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (atendidos.data?.length ?? 0) === 0 ? (
              <p className="text-[12px] text-ink-muted">
                Nenhum atendimento registrado (check-ins ou triagens).
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {atendidos.data!.map((a) => (
                  <div
                    key={a.eventoId}
                    className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-bg-secondary px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={a.severidade} />
                      <span className="text-[13px] text-ink-primary">{a.eventoTitulo}</span>
                    </div>
                    <span className="text-[11px] text-ink-muted">
                      {a.checkins > 0 && `${a.checkins} check-in${a.checkins > 1 ? 's' : ''}`}
                      {a.checkins > 0 && a.triagens > 0 && ' · '}
                      {a.triagens > 0 && `${a.triagens} triagem${a.triagens > 1 ? 's' : ''}`}
                      {a.primeiroCheckin && ` · ${formatRelative(a.primeiroCheckin)}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function Campo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/[0.06] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="text-[13px] text-ink-primary">{value}</p>
    </div>
  );
}
