import { useEffect, useMemo, useState } from 'react';
import { useTenantHierarquia, type TenantNodeDTO } from './useTenants';

export interface TenantOption {
  id: string;
  nome: string;
  tipo: TenantNodeDTO['tipo'];
  depth: number;
}

function flatten(n: TenantNodeDTO, depth = 0, acc: TenantOption[] = []): TenantOption[] {
  acc.push({ id: n.id, nome: n.nome, tipo: n.tipo, depth });
  n.filhos.forEach((f) => flatten(f, depth + 1, acc));
  return acc;
}

/**
 * Opções de tenant para filtros/segregação visual em tabelas.
 * `multiTenant` indica que o usuário enxerga mais de um tenant (federal/estadual/admin),
 * caso em que vale exibir a coluna e o filtro de tenant.
 */
export function useTenantOptions() {
  const { data: root } = useTenantHierarquia();
  const tenants = useMemo(() => (root ? flatten(root) : []), [root]);
  const nameById = useMemo(() => {
    const m: Record<string, string> = {};
    tenants.forEach((t) => (m[t.id] = t.nome));
    return m;
  }, [tenants]);

  // Para cada tenant, o conjunto dele próprio + todos os descendentes.
  const descendantsById = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    const visit = (n: TenantNodeDTO): Set<string> => {
      const set = new Set<string>([n.id]);
      n.filhos.forEach((f) => visit(f).forEach((id) => set.add(id)));
      map[n.id] = set;
      return set;
    };
    if (root) visit(root);
    return map;
  }, [root]);

  /** Linha pertence ao escopo do tenant selecionado (ele ou um descendente). */
  const inTenantScope = (rowTenantId: string, selectedId: string) =>
    !selectedId || (descendantsById[selectedId]?.has(rowTenantId) ?? false);

  return { tenants, nameById, multiTenant: tenants.length > 1, inTenantScope };
}

/** Paginação client-side simples. Reseta para a 1ª página quando o total encolhe. */
export function usePagination<T>(rows: T[], pageSize = 10) {
  const [page, setPage] = useState(0);
  const total = rows.length;

  useEffect(() => {
    if (page > 0 && page * pageSize >= total) setPage(0);
  }, [total, page, pageSize]);

  const paged = useMemo(
    () => rows.slice(page * pageSize, page * pageSize + pageSize),
    [rows, page, pageSize],
  );

  return { paged, page, setPage, total, pageSize };
}
