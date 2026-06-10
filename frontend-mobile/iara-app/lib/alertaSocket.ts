import { Client, IMessage } from '@stomp/stompjs';

export type AlertaSocketPayload = {
  type: 'ALERT_NEW' | 'ALERT_STATUS_CHANGED';
  id: string;
  categoria?: string;
  severidade?: string;
  tenantId: string;
  status?: string;
};

let _client: Client | null = null;

export function connectAlertaSocket(
  wsUrl: string,
  accessToken: string,
  onMessage: (payload: AlertaSocketPayload) => void,
) {
  disconnectAlertaSocket();

  _client = new Client({
    webSocketFactory: () => new WebSocket(wsUrl) as unknown as globalThis.WebSocket,
    connectHeaders: { Authorization: `Bearer ${accessToken}` },
    reconnectDelay: 5000,
    onConnect: () => {
      _client?.subscribe('/user/queue/alertas', (msg: IMessage) => {
        try {
          onMessage(JSON.parse(msg.body) as AlertaSocketPayload);
        } catch {}
      });
    },
    onStompError: () => {},
    onDisconnect: () => {},
  });

  _client.activate();
}

export function disconnectAlertaSocket() {
  if (_client?.active) _client.deactivate();
  _client = null;
}
