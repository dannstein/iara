import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { TokenResponse } from '@/types/api';

interface LoginInput {
  email: string;
  senha: string;
}

/** Login web — rejeita USUARIO_SIMPLES (403) no backend. */
export function useWebLogin() {
  const login = useAuthStore((s) => s.login);
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const { data } = await api.post<TokenResponse>('/auth/web/login', input);
      return data;
    },
    onSuccess: (data) => login(data),
  });
}

export function useLogout() {
  const { accessToken, refreshToken, logout } = useAuthStore.getState();
  return async () => {
    try {
      if (accessToken && refreshToken) {
        await api.post('/auth/logout', { accessToken, refreshToken });
      }
    } catch {
      /* ignore — limpamos o estado de qualquer forma */
    } finally {
      logout();
    }
  };
}
