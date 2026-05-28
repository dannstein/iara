import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { cn, formatRelative } from '@/lib/utils';
import {
  useNaoLidasCount,
  useNotificacoes,
  useMarcarLida,
  useMarcarTodasLidas,
} from '@/hooks/useNotificacoes';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: count = 0 } = useNaoLidasCount();
  const { data: notificacoes = [] } = useNotificacoes();
  const marcarLida = useMarcarLida();
  const marcarTodas = useMarcarTodasLidas();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Notificações"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-white/5 hover:text-ink-primary"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 animate-fade-in overflow-hidden rounded-xl border border-white/10 bg-bg-elevated shadow-lg">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <span className="text-[13px] font-semibold text-ink-primary">Notificações</span>
            {count > 0 && (
              <button
                onClick={() => marcarTodas.mutate()}
                className="flex items-center gap-1 text-[11px] text-brand-light hover:underline"
              >
                <CheckCheck size={12} /> Marcar todas
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notificacoes.length === 0 ? (
              <p className="px-4 py-8 text-center text-[12px] text-ink-muted">
                Nenhuma notificação.
              </p>
            ) : (
              notificacoes.slice(0, 20).map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.lida && marcarLida.mutate(n.id)}
                  className={cn(
                    'flex w-full flex-col gap-0.5 border-b border-white/[0.04] px-4 py-3 text-left transition-colors hover:bg-white/[0.03]',
                    !n.lida && 'bg-brand-blue-soft/40',
                  )}
                >
                  <div className="flex items-center gap-2">
                    {!n.lida && <span className="h-1.5 w-1.5 rounded-full bg-brand-light" />}
                    <span className="text-[12px] font-semibold text-ink-primary">{n.titulo}</span>
                  </div>
                  <span className="text-[11px] text-ink-secondary">{n.mensagem}</span>
                  <span className="text-[10px] text-ink-muted">{formatRelative(n.createdAt)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
