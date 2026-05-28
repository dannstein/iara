import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  icon,
  children,
  footer,
  maxWidth = 'max-w-lg',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[rgba(7,11,20,0.85)] backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 flex max-h-[calc(100vh-2rem)] w-full flex-col ${maxWidth} animate-fade-in overflow-hidden rounded-2xl border border-white/10 bg-bg-secondary shadow-lg`}
      >
        <div className="h-px flex-shrink-0 bg-gradient-to-r from-transparent via-brand-dark/60 to-transparent" />
        <div className="flex flex-shrink-0 items-center justify-between border-b border-white/5 px-6 py-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue-soft text-brand-light">
                {icon}
              </div>
            )}
            <div>
              {eyebrow && <p className="eyebrow">{eyebrow}</p>}
              <h2 className="text-[15px] font-semibold text-ink-primary">{title}</h2>
            </div>
          </div>
          <IconButton label="Fechar" onClick={onClose}>
            <X size={14} />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex flex-shrink-0 justify-end gap-2 border-t border-white/5 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
