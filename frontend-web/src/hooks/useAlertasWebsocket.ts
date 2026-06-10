import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useTenantStore } from '@/store/tenantStore';
import {
  disconnect,
  ensureConnected,
  subscribeTenant,
  subscribeUser,
  type AlertPushPayload,
} from '@/lib/websocket';

/**
 * Conecta ao STOMP do backend, escuta o tópico do tenant atual + a fila
 * pessoal, e invalida as queries React Query relevantes quando um push chega.
 *
 * Use uma vez no AppLayout — não em componentes filhos.
 */
export function useAlertasWebsocket() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const activeTenant = useTenantStore((s) => s.activeTenantId);
  const qc = useQueryClient();

  useEffect(() => {
    if (!token || !user) {
      disconnect();
      return;
    }
    const client = ensureConnected(token);

    function handle(p: AlertPushPayload) {
      qc.invalidateQueries({ queryKey: ['alertas'] });
      qc.invalidateQueries({ queryKey: ['alertas-dashboard'] });
      qc.invalidateQueries({ queryKey: ['eventos'] });
      if (p.id) {
        qc.invalidateQueries({ queryKey: ['alerta', p.id] });
      }
    }

    // Aguarda conexão antes de assinar.
    const onConnect = () => {
      const tenantId = activeTenant ?? user?.tenantId;
      if (tenantId && user) {
        subscribeTenant(tenantId, handle);
        subscribeUser(handle);
      }
    };

    if (client.connected) {
      onConnect();
    } else {
      client.onConnect = onConnect;
    }

    return () => {
      // Não desconecta em re-render — só quando token muda ou logout.
    };
  }, [token, user, activeTenant, qc]);
}
