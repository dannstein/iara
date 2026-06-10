import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Estado global de convite ativo ────────────────────────────
// Pub/sub leve — EventoInviteOverlay escreve, AlertaPopup lê.
// Garante que AlertaPopup se suprima enquanto o popup de convite está visível.

let _hasInvite = false;
let _listeners: Array<(val: boolean) => void> = [];

export function setHasInvite(val: boolean) {
  if (_hasInvite === val) return;
  _hasInvite = val;
  _listeners.forEach((l) => l(val));
}

export function useHasInvite(): boolean {
  const [has, setHas] = useState(_hasInvite);

  useEffect(() => {
    setHas(_hasInvite);
    _listeners.push(setHas);
    return () => {
      _listeners = _listeners.filter((l) => l !== setHas);
    };
  }, []);

  return has;
}

// ── IDs de eventos de convite já vistos ───────────────────────
// Persistido no AsyncStorage — mesma chave usada pelo EventoInviteOverlay.
// Permite que AlertaContext filtre alertas de eventos já tratados,
// evitando que o AlertaPopup reapareça após restart.

const STORAGE_KEY = 'eventoInvite_seen_v1';
let _seenEventoIds = new Set<string>();
let _loaded = false;
let _loadPromise: Promise<void> | null = null;

export function loadSeenEventoIds(): Promise<void> {
  if (_loaded) return Promise.resolve();
  if (_loadPromise) return _loadPromise;
  _loadPromise = AsyncStorage.getItem(STORAGE_KEY)
    .then((raw) => { if (raw) _seenEventoIds = new Set(JSON.parse(raw) as string[]); })
    .catch(() => {})
    .finally(() => { _loaded = true; _loadPromise = null; });
  return _loadPromise;
}

export function markEventoIdSeen(id: string): void {
  _seenEventoIds.add(id);
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([..._seenEventoIds])).catch(() => {});
}

export function getSeenEventoIds(): Set<string> {
  return _seenEventoIds;
}
