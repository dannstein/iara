// Geocoding no cliente via OpenStreetMap Nominatim. Usamos isto porque o
// geocoder do backend está em modo stub e não há endpoint genérico exposto.
// Volume baixo (uso interno de gestores) — dentro da política de uso do Nominatim.

const NOMINATIM = 'https://nominatim.openstreetmap.org';

export interface GeocodeResult {
  lat: number;
  lng: number;
  label: string;
}

/** Endereço/texto → coordenadas (primeiro resultado, priorizando o Brasil). */
export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  if (!query.trim()) return null;
  const url = `${NOMINATIM}/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Falha no geocoding');
  const data: Array<{ lat: string; lon: string; display_name: string }> = await res.json();
  if (data.length === 0) return null;
  const first = data[0];
  return { lat: Number(first.lat), lng: Number(first.lon), label: first.display_name };
}

export interface StructuredAddress {
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

/** Endereço estruturado → coordenadas. Usa a busca estruturada do Nominatim, com fallback textual. */
export async function geocodeStructured(addr: StructuredAddress): Promise<GeocodeResult | null> {
  const street = [addr.numero, addr.logradouro].filter(Boolean).join(' ').trim();
  const params = new URLSearchParams({ format: 'jsonv2', limit: '1', countrycodes: 'br' });
  if (street) params.set('street', street);
  if (addr.cidade) params.set('city', addr.cidade);
  if (addr.uf) params.set('state', addr.uf);
  if (addr.cep) params.set('postalcode', addr.cep);

  const res = await fetch(`${NOMINATIM}/search?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  if (res.ok) {
    const data: Array<{ lat: string; lon: string; display_name: string }> = await res.json();
    if (data.length > 0) {
      const f = data[0];
      return { lat: Number(f.lat), lng: Number(f.lon), label: f.display_name };
    }
  }
  // Fallback: busca textual com tudo concatenado.
  const free = [street, addr.bairro, addr.cidade, addr.uf, addr.cep].filter(Boolean).join(', ');
  return geocodeAddress(free);
}

export interface CepResult {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

/** Consulta um CEP brasileiro (ViaCEP) e retorna os campos de endereço. */
export async function lookupCep(cep: string): Promise<CepResult | null> {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.erro) return null;
  return {
    logradouro: data.logradouro ?? '',
    bairro: data.bairro ?? '',
    cidade: data.localidade ?? '',
    uf: data.uf ?? '',
  };
}
