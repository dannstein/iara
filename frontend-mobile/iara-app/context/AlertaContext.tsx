import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { api, WS_URL } from '../services/api';
import { useAuth } from './AuthContext';
import {
  connectAlertaSocket,
  disconnectAlertaSocket,
  AlertaSocketPayload,
} from '../lib/alertaSocket';
// TODO: notificações nativas — descomentar quando push estiver reativado em lib/notifications.ts
// import { scheduleAlertNotification } from '../lib/notifications';

// ── Tipos ─────────────────────────────────────────────────────

export type AlertaSeveridade =
  | 'INFO' | 'WARNING' | 'DANGER' | 'CRITICAL' | 'EMERGENCY'
  | 'SOLICITATION' | 'OPERATIONAL';

export type AlertaStatus = 'ACTIVE' | 'EXPIRED' | 'RESOLVED' | 'CANCELLED' | 'SUPERSEDED';

export type AlertaCategoria =
  | 'DANGER_ZONE' | 'EVENT_ZONE' | 'TENANT_BROADCAST' | 'TECHNICAL_REQUEST'
  | 'SUPPORT_POINTS' | 'COLLECTION_POINTS' | 'MONITORS' | 'PERSONALIZED' | 'ESCALATION';

export interface AlertaDTO {
  id: string;
  idEvento?: string;
  titulo: string | null;
  mensagem: string;
  severidade: AlertaSeveridade;
  status: AlertaStatus;
  categoria: AlertaCategoria;
  requerAck: boolean;
  coordenadas: { lat: number; lng: number } | null;
  raioMetros: number | null;
  dataExpiracao: string | null;
  createdAt: string;
  totalDestinatarios: number;
}

// ── Ordenação de severidade ────────────────────────────────────

const SEV_ORDER: Record<AlertaSeveridade, number> = {
  EMERGENCY:   0,
  CRITICAL:    1,
  DANGER:      2,
  WARNING:     3,
  SOLICITATION:4,
  INFO:        5,
  OPERATIONAL: 6,
};

const POPUP_SEVERIDADES = new Set<AlertaSeveridade>(['WARNING', 'DANGER', 'CRITICAL', 'EMERGENCY']);

export function sortBySeveridade(a: AlertaDTO, b: AlertaDTO) {
  return SEV_ORDER[a.severidade] - SEV_ORDER[b.severidade];
}

// ── Cores por severidade ───────────────────────────────────────

export const SEVERITY_COLOR: Record<AlertaSeveridade, string> = {
  EMERGENCY:   '#E8621A',
  CRITICAL:    '#EF4444',
  DANGER:      '#F97316',
  WARNING:     '#EAB308',
  SOLICITATION:'#0F47BC',
  INFO:        '#3B82F6',
  OPERATIONAL: '#64748B',
};

export const SEVERITY_LABEL: Record<AlertaSeveridade, string> = {
  EMERGENCY:   'Emergência',
  CRITICAL:    'Crítico',
  DANGER:      'Perigo',
  WARNING:     'Alerta',
  SOLICITATION:'Solicitação',
  INFO:        'Informação',
  OPERATIONAL: 'Operacional',
};

export const CATEGORIA_LABEL: Record<AlertaCategoria, string> = {
  DANGER_ZONE:       'Zona de Risco',
  EVENT_ZONE:        'Zona de Evento',
  TENANT_BROADCAST:  'Comunicado Geral',
  TECHNICAL_REQUEST: 'Chamado Técnico',
  SUPPORT_POINTS:    'Pontos de Apoio',
  COLLECTION_POINTS: 'Pontos de Coleta',
  MONITORS:          'Monitores',
  PERSONALIZED:      'Personalizado',
  ESCALATION:        'Escalonamento',
};

// ── Contexto ──────────────────────────────────────────────────

interface AlertaContextValue {
  alertas: AlertaDTO[];
  pendingPopup: AlertaDTO | null;
  floatingAlert: AlertaDTO | null;
  notificationCount: number;
  isLoading: boolean;
  lastAlertAt: number;
  dismissPopup: () => void;
  dismissAndClearFloating: () => void;
  showAlertPopup: (alerta: AlertaDTO) => void;
  clearFloating: () => void;
  refresh: () => void;
}

const AlertaContext = createContext<AlertaContextValue>({
  alertas: [],
  pendingPopup: null,
  floatingAlert: null,
  notificationCount: 0,
  isLoading: false,
  lastAlertAt: 0,
  dismissPopup: () => {},
  dismissAndClearFloating: () => {},
  showAlertPopup: () => {},
  clearFloating: () => {},
  refresh: () => {},
});

export function useAlerta() {
  return useContext(AlertaContext);
}

// ── Provider ──────────────────────────────────────────────────

export function AlertaProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, tenantId } = useAuth();

  const [alertas, setAlertas]           = useState<AlertaDTO[]>([]);
  const [pendingPopup, setPendingPopup] = useState<AlertaDTO | null>(null);
  const [floatingAlert, setFloatingAlert] = useState<AlertaDTO | null>(null);
  const [isLoading, setIsLoading]       = useState(false);
  const [lastAlertAt, setLastAlertAt]   = useState(0);

  // IDs que já foram exibidos no popup nesta sessão
  const seenIds = useRef<Set<string>>(new Set());
  // IDs cujo balão flutuante foi dispensado pelo usuário nesta sessão
  const dismissedFloatingIds = useRef<Set<string>>(new Set());
  // Fila de alertas novos esperando para mostrar popup
  const popupQueue = useRef<AlertaDTO[]>([]);

  const fetchAlertas = useCallback(async () => {
    if (!accessToken) return;
    try {
      setIsLoading(true);
      const res = await api.get<AlertaDTO[]>('/alertas?status=ACTIVE', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = [...res.data].sort(sortBySeveridade);
      setAlertas(data);

      // Detecta alertas novos que precisam de popup
      const novos = data.filter(
        (a) => POPUP_SEVERIDADES.has(a.severidade)
          && !seenIds.current.has(a.id),
      );

      if (novos.length > 0) {
        // TODO: notificações nativas — descomentar quando push estiver reativado
        // for (const a of novos) {
        //   const title = `${SEVERITY_LABEL[a.severidade]} — ${CATEGORIA_LABEL[a.categoria]}`;
        //   const body  = a.titulo ?? a.mensagem.slice(0, 120);
        //   scheduleAlertNotification(title, body, a.id, a.severidade).catch(() => {});
        // }

        // Adiciona à fila e dispara popup se não há popup ativo
        popupQueue.current.push(...novos);
        setPendingPopup((curr) => curr ?? popupQueue.current.shift() ?? null);
      }

      // Floating: o alerta ativo mais grave com severidade ≥ WARNING (exceto dispensados)
      const topFloat = data.find(
        (a) => POPUP_SEVERIDADES.has(a.severidade) && !dismissedFloatingIds.current.has(a.id),
      );
      setFloatingAlert((curr) => {
        // Mantém o atual se ainda está na lista; senão atualiza
        if (curr && data.some((a) => a.id === curr.id)) return curr;
        return topFloat ?? null;
      });
    } catch {
      // silencia — pode estar offline
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const handleSocketMessage = useCallback(async (payload: AlertaSocketPayload) => {
    if (payload.type === 'ALERT_NEW') {
      try {
        const res = await api.get<AlertaDTO>(`/alertas/${payload.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const alerta = res.data;
        setAlertas((prev) => {
          const filtered = prev.filter((a) => a.id !== alerta.id);
          return [...filtered, alerta].sort(sortBySeveridade);
        });
        const isNew =
          POPUP_SEVERIDADES.has(alerta.severidade) &&
          !seenIds.current.has(alerta.id) &&
          !popupQueue.current.some((a) => a.id === alerta.id);
        if (isNew) {
          popupQueue.current.push(alerta);
          setPendingPopup((curr) => curr ?? popupQueue.current.shift() ?? null);
        }
        const topFloat = POPUP_SEVERIDADES.has(alerta.severidade) &&
          !dismissedFloatingIds.current.has(alerta.id) ? alerta : null;
        if (topFloat) {
          setFloatingAlert((curr) => {
            const sev = SEV_ORDER[topFloat.severidade];
            if (!curr) return topFloat;
            return sev <= SEV_ORDER[curr.severidade] ? topFloat : curr;
          });
        }
        setLastAlertAt(Date.now());
      } catch {}
    } else if (payload.type === 'ALERT_STATUS_CHANGED') {
      const terminal = new Set(['RESOLVED', 'CANCELLED', 'EXPIRED', 'SUPERSEDED']);
      if (payload.status && terminal.has(payload.status)) {
        setAlertas((prev) => prev.filter((a) => a.id !== payload.id));
        setFloatingAlert((curr) => (curr?.id === payload.id ? null : curr));
        setLastAlertAt(Date.now());
      } else {
        try {
          const res = await api.get<AlertaDTO>(`/alertas/${payload.id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          setAlertas((prev) => {
            const filtered = prev.filter((a) => a.id !== res.data.id);
            return [...filtered, res.data].sort(sortBySeveridade);
          });
          setLastAlertAt(Date.now());
        } catch {}
      }
    }
  }, [accessToken]);

  // Carrega estado inicial e (re)conecta WebSocket quando token ou tenant muda
  useEffect(() => {
    if (!accessToken) return;
    fetchAlertas();
    connectAlertaSocket(WS_URL, accessToken, tenantId, handleSocketMessage);
    return () => disconnectAlertaSocket();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, tenantId]);

  function dismissPopup() {
    if (!pendingPopup) return;
    seenIds.current.add(pendingPopup.id);

    // Marca como visualizado no backend (silencia erros)
    api.patch(`/alertas/${pendingPopup.id}/visualizar`, {}, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => {});

    // Próximo da fila, se houver
    const next = popupQueue.current.shift() ?? null;
    setPendingPopup(next);
  }

  // Dispensa o popup E remove o balão flutuante para toda a sessão
  function dismissAndClearFloating() {
    if (!pendingPopup) return;
    const id = pendingPopup.id;
    dismissedFloatingIds.current.add(id);
    setFloatingAlert((curr) => (curr?.id === id ? null : curr));
    seenIds.current.add(id);
    api.patch(`/alertas/${id}/visualizar`, {}, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => {});
    const next = popupQueue.current.shift() ?? null;
    setPendingPopup(next);
  }

  function showAlertPopup(alerta: AlertaDTO) {
    setPendingPopup(alerta);
  }

  function clearFloating() {
    setFloatingAlert(null);
  }

  const notificationCount = alertas.length;

  return (
    <AlertaContext.Provider value={{
      alertas,
      pendingPopup,
      floatingAlert,
      notificationCount,
      isLoading,
      lastAlertAt,
      dismissPopup,
      dismissAndClearFloating,
      showAlertPopup,
      clearFloating,
      refresh: fetchAlertas,
    }}>
      {children}
    </AlertaContext.Provider>
  );
}
