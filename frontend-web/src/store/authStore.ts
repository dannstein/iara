import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role, TokenResponse } from '@/types/api';

interface AuthUser {
  userId: string;
  tenantId: string;
  email: string;
  role: Role;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (tokens: TokenResponse) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      login: (t) =>
        set({
          accessToken: t.accessToken,
          refreshToken: t.refreshToken,
          user: { userId: t.userId, tenantId: t.tenantId, email: t.email, role: t.role },
          isAuthenticated: true,
        }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      logout: () =>
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),
    }),
    { name: 'iara_token' },
  ),
);

/** Hierarquia de perfis para gating de UI (espelha o backend). */
const ROLE_RANK: Record<Role, number> = {
  USUARIO_SIMPLES: 0,
  DOADOR: 1,
  TECNICO: 1,
  COORDENADOR: 2,
  MONITOR: 3,
  GESTOR: 4,
  ADMIN: 5,
};

export function hasRole(userRole: Role | undefined, min: Role): boolean {
  if (!userRole) return false;
  return ROLE_RANK[userRole] >= ROLE_RANK[min];
}
