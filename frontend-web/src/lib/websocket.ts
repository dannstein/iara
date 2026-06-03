import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';

/**
 * Cliente STOMP singleton para receber pushes de alertas em tempo real.
 *
 * Convenções:
 *  - Endpoint: VITE_WS_URL ou ws(s)://host/ws derivado do baseURL HTTP.
 *  - Autenticação: header Authorization: Bearer <token> no CONNECT.
 *  - Subscribes:
 *      /topic/tenant/{tenantId}/alertas — todos os clientes do tenant
 *      /user/queue/alertas             — fila pessoal (resolução Spring por Principal)
 *  - Reconexão automática com backoff (delegado ao @stomp/stompjs).
 *
 * Uso: chamar {@link ensureConnected}(token) após login e fechar via {@link disconnect}
 * no logout. Subscrições via {@link subscribeTenant} / {@link subscribeUser}.
 */

export interface AlertPushPayload {
  type: 'ALERT_NEW' | 'ALERT_STATUS_CHANGED';
  id: string;
  tenantId: string;
  categoria?: string;
  severidade?: string;
  status?: string;
}

let client: Client | null = null;
let currentToken: string | null = null;

function wsUrl(): string {
  const explicit = import.meta.env.VITE_WS_URL;
  if (explicit) return explicit as string;
  const httpBase = import.meta.env.VITE_API_URL ?? '/api';
  // /api → /ws (no host); http(s)://x/api → ws(s)://x/ws
  if (httpBase.startsWith('http')) {
    return httpBase.replace(/^http/, 'ws').replace(/\/api\/?$/, '/ws');
  }
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/ws`;
}

export function ensureConnected(token: string): Client {
  if (client && currentToken === token && client.active) return client;
  if (client) {
    client.deactivate();
    client = null;
  }
  currentToken = token;
  client = new Client({
    brokerURL: wsUrl(),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5_000,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
  });
  client.activate();
  return client;
}

export function disconnect(): void {
  if (client) {
    client.deactivate();
    client = null;
    currentToken = null;
  }
}

function parsePayload(msg: IMessage): AlertPushPayload | null {
  try {
    return JSON.parse(msg.body) as AlertPushPayload;
  } catch {
    return null;
  }
}

export function subscribeTenant(
  tenantId: string,
  onMessage: (payload: AlertPushPayload) => void,
): StompSubscription | null {
  if (!client) return null;
  const dest = `/topic/tenant/${tenantId}/alertas`;
  const sub = client.subscribe(dest, (msg) => {
    const p = parsePayload(msg);
    if (p) onMessage(p);
  });
  return sub;
}

export function subscribeUser(
  onMessage: (payload: AlertPushPayload) => void,
): StompSubscription | null {
  if (!client) return null;
  const sub = client.subscribe('/user/queue/alertas', (msg) => {
    const p = parsePayload(msg);
    if (p) onMessage(p);
  });
  return sub;
}
