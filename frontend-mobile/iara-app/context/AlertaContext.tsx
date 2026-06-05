import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
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
  dismissPopup: () => void;
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
  dismissPopup: () => {},
  showAlertPopup: () => {},
  clearFloating: () => {},
  refresh: () => {},
});

export function useAlerta() {
  return useContext(AlertaContext);
}

// ── Provider ──────────────────────────────────────────────────

export function AlertaProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();

  const [alertas, setAlertas]           = useState<AlertaDTO[]>([]);
  const [pendingPopup, setPendingPopup] = useState<AlertaDTO | null>(null);
  const [floatingAlert, setFloatingAlert] = useState<AlertaDTO | null>(null);
  const [isLoading, setIsLoading]       = useState(false);

  // IDs que já foram exibidos no popup nesta sessão
  const seenIds = useRef<Set<string>>(new Set());
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
        (a) => POPUP_SEVERIDADES.has(a.severidade) && !seenIds.current.has(a.id),
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

      // Floating: o alerta ativo mais grave com severidade ≥ WARNING
      const topFloat = data.find((a) => POPUP_SEVERIDADES.has(a.severidade));
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

  // Polling a cada 30 s
  useEffect(() => {
    if (!accessToken) return;
    fetchAlertas();
    const interval = setInterval(fetchAlertas, 30_000);
    return () => clearInterval(interval);
  }, [accessToken, fetchAlertas]);

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
      dismissPopup,
      showAlertPopup,
      clearFloating,
      refresh: fetchAlertas,
    }}>
      {children}
    </AlertaContext.Provider>
  );
}
