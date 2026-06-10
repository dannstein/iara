import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';

// ── Tipos ────────────────────────────────────────────────────

export type UserRole =
  | 'DOADOR'
  | 'USUARIO_SIMPLES'
  | 'COORDENADOR'
  | 'TECNICO'
  | 'MONITOR'
  | 'GESTOR'
  | 'ADMIN'
  | null;

interface AuthState {
  role: UserRole;
  nome: string;
  email: string;
  userId: string;
  tenantId: string;
  accessToken: string;
  isLoading: boolean;
}

interface AuthData extends AuthState {
  refresh: () => Promise<void>;
}

// ── Context ──────────────────────────────────────────────────

const AuthContext = createContext<AuthData>({
  role: null,
  nome: '',
  email: '',
  userId: '',
  tenantId: '',
  accessToken: '',
  isLoading: true,
  refresh: async () => {},
});

// ── Provider ─────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    role: null,
    nome: '',
    email: '',
    userId: '',
    tenantId: '',
    accessToken: '',
    isLoading: true,
  });

  const load = useCallback(async () => {
    try {
      const [token, rawUser] = await Promise.all([
        SecureStore.getItemAsync('accessToken'),
        SecureStore.getItemAsync('userData'),
      ]);

      let role: UserRole = null;
      let nome = '';
      let email = '';
      let userId = '';
      let tenantId = '';

      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          role     = parsed.role     ?? null;
          nome     = parsed.nome     ?? '';
          email    = parsed.email    ?? '';
          userId   = parsed.userId   ?? '';
          tenantId = parsed.tenantId ?? '';
        } catch {}
      }

      if (token) {
        try {
          const res = await api.get('/usuarios/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          nome = res.data.nome ?? nome;
        } catch {}
      }

      setState({
        role,
        nome,
        email,
        userId,
        tenantId,
        accessToken: token ?? '',
        isLoading: false,
      });
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const value = useMemo<AuthData>(
    () => ({ ...state, refresh: load }),
    [state, load],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook público ─────────────────────────────────────────────

export function useAuth(): AuthData {
  return useContext(AuthContext);
}
