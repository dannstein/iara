import { useEffect, useState } from 'react';

// ── Estado global de conectividade ────────────────────────────
// Pub/sub leve — o listener de rede ativo vive em NetworkMonitor (_layout.tsx)
// para garantir que o bridge nativo já esteja pronto.
// apiCached também chama setOffline como fonte secundária (passiva).

let _isOffline = false;
let _listeners: Array<(val: boolean) => void> = [];

export function setOffline(val: boolean) {
  if (_isOffline === val) return;
  _isOffline = val;
  _listeners.forEach((l) => l(val));
}

export function useIsOffline(): boolean {
  const [isOffline, setIsOffline] = useState(_isOffline);

  useEffect(() => {
    setIsOffline(_isOffline);
    _listeners.push(setIsOffline);
    return () => {
      _listeners = _listeners.filter((l) => l !== setIsOffline);
    };
  }, []);

  return isOffline;
}
