import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  title?: string;
  count?: number;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  toolbar?: ReactNode;
  emptyState?: ReactNode;
  footer?: ReactNode;
}

export function DataTable<T>({
  title,
  count,
  columns,
  rows,
  rowKey,
  onRowClick,
  toolbar,
  emptyState,
  footer,
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08]">
      {(title || toolbar) && (
        <div className="flex items-center justify-between border-b border-white/5 bg-bg-primary px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-brand-dark" />
            {title && <h3 className="text-[13px] font-semibold text-ink-primary">{title}</h3>}
            {count != null && (
              <span className="ml-1 text-[11px] text-ink-muted">{count} registros</span>
            )}
          </div>
          {toolbar && <div className="flex gap-2">{toolbar}</div>}
        </div>
      )}

      {rows.length === 0 && emptyState ? (
        emptyState
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted',
                      col.className,
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-white/[0.04] transition-colors last:border-0',
                    onRowClick && 'cursor-pointer hover:bg-white/[0.025]',
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 text-[13px] text-ink-primary', col.className)}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {footer && (
        <div className="flex items-center justify-between border-t border-white/5 bg-bg-primary px-5 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);
  return (
    <>
      <span className="text-[12px] text-ink-muted">
        Mostrando {from}–{to} de {total}
      </span>
      <div className="flex gap-1">
        <button
          className="btn-ghost px-2.5 py-1 text-[12px] disabled:opacity-30"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
        >
          Anterior
        </button>
        <span className="px-3 py-1 text-[12px] text-ink-secondary">
          {page + 1} / {pages}
        </span>
        <button
          className="btn-ghost px-2.5 py-1 text-[12px] disabled:opacity-30"
          disabled={page + 1 >= pages}
          onClick={() => onChange(page + 1)}
        >
          Próximo
        </button>
      </div>
    </>
  );
}
