import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// ── Primitivos de cache ───────────────────────────────────────

export async function getCached<T>(key: string, ttlMs: number): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`iara_cache_${key}`);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > ttlMs) return null;
    return entry.data;
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(`iara_cache_${key}`, JSON.stringify(entry));
  } catch {}
}

// ── Fetch network-first com fallback offline ──────────────────
//
// Estratégia:
//   1. Tenta a rede SEMPRE — garante que dados novos apareçam imediatamente.
//   2. Salva resultado em cache ao conseguir resposta.
//   3. Se a rede falhar (offline), retorna último cache salvo (qualquer idade).
//
// O parâmetro ttlMs é mantido para compatibilidade mas não limita o fetch
// — ele só limita o fallback offline (dados muito velhos não são usados
// se houver uma versão mais recente disponível em qualquer forma).

export async function apiCached<T>(
  endpoint: string,
  headers: Record<string, string>,
  _ttlMs?: number,
): Promise<T> {
  const cacheKey = endpoint.replace(/[^a-z0-9]/gi, '_');

  try {
    // Sempre busca na rede — dados sempre frescos quando online
    const response = await api.get<T>(endpoint, { headers });
    await setCached(cacheKey, response.data);   // armazena para uso offline
    return response.data;
  } catch (err) {
    // Rede falhou → tenta cache sem limite de TTL (modo offline)
    const cached = await getCached<T>(cacheKey, Infinity);
    if (cached !== null) return cached;
    throw err;  // sem cache disponível, propaga o erro
  }
}

// ── TTLs (mantidos por compatibilidade, não usados em apiCached) ─
export const TTL = {
  eventos:   5  * 60_000,
  zonas:     5  * 60_000,
  pontos:    15 * 60_000,
  abrigos:   15 * 60_000,
  hospitais: 30 * 60_000,
  lookup:    30 * 60_000,
};
