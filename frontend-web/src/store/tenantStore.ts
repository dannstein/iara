import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Tenant ativo selecionado por usuários multi-tenant (FEDERAL/ESTADUAL/ADMIN).
 * null = escopo completo. Enviado ao backend via header X-Active-Tenant.
 */
interface TenantState {
  activeTenantId: string | null;
  activeTenantName: string | null;
  setActiveTenant: (id: string | null, name: string | null) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      activeTenantId: null,
      activeTenantName: null,
      setActiveTenant: (id, name) => set({ activeTenantId: id, activeTenantName: name }),
    }),
    { name: 'iara_active_tenant' },
  ),
);
