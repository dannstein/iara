import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'iara_pinned_v1';

export type LocalTipo = 'ponto-coleta' | 'abrigo' | 'hospital' | 'ponto-apoio';

export interface PinnedLocation {
  id: string;
  tipo: LocalTipo;
  nome: string;
  endereco?: string;
  pinnedAt: string;
}

export async function getPinned(): Promise<PinnedLocation[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// Retorna true se foi fixado, false se foi desfixado
export async function togglePin(loc: Omit<PinnedLocation, 'pinnedAt'>): Promise<boolean> {
  const current = await getPinned();
  const idx     = current.findIndex((p) => p.id === loc.id && p.tipo === loc.tipo);
  let next: PinnedLocation[];
  if (idx >= 0) {
    next = current.filter((_, i) => i !== idx);
  } else {
    next = [{ ...loc, pinnedAt: new Date().toISOString() }, ...current];
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return idx < 0;
}

export async function checkPinned(id: string, tipo: LocalTipo): Promise<boolean> {
  const list = await getPinned();
  return list.some((p) => p.id === id && p.tipo === tipo);
}
