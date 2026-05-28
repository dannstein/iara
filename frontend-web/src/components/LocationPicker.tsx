import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMapEvents, useMap } from 'react-leaflet';
import { Crosshair, Search, MapPinned, Loader2 } from 'lucide-react';
import { Input, FormField } from '@/components/ui';
import { cn } from '@/lib/utils';
import { geocodeAddress, geocodeStructured, lookupCep } from '@/lib/geocode';
import { useMe, useTenant } from '@/hooks/useUsuarios';
import type { Coordenadas } from '@/types/api';

const TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const FALLBACK_CENTER: [number, number] = [-15.7801, -47.9292]; // Brasil (Brasília)

/** Resolve um centro de mapa a partir do tenant do usuário (geocodificado). */
export function useTenantCenter(): [number, number] | null {
  const me = useMe();
  const tenant = useTenant(me.data?.tenantId);
  const [center, setCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!tenant.data) return;
    // FEDERAL/ESTADUAL podem não ser uma cidade — ainda assim tentamos geocodificar o nome.
    const q = [tenant.data.nome, tenant.data.uf, 'Brasil'].filter(Boolean).join(', ');
    let cancelled = false;
    geocodeAddress(q)
      .then((r) => {
        if (!cancelled && r) setCenter([r.lat, r.lng]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [tenant.data]);

  return center;
}

type Mode = 'coords' | 'address' | 'map';

interface LocationPickerProps {
  value: Coordenadas | null;
  onChange: (coords: Coordenadas) => void;
}

const MODES: { id: Mode; label: string; icon: typeof Crosshair }[] = [
  { id: 'coords', label: 'Coordenadas', icon: Crosshair },
  { id: 'address', label: 'Endereço', icon: Search },
  { id: 'map', label: 'No mapa', icon: MapPinned },
];

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [mode, setMode] = useState<Mode>('map');
  const tenantCenter = useTenantCenter();

  return (
    <div className="flex flex-col gap-3">
      {/* Seletor de modo */}
      <div className="flex gap-1 rounded-lg border border-white/10 p-0.5">
        {MODES.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors',
                mode === m.id ? 'bg-brand-blue-soft text-ink-primary' : 'text-ink-muted hover:text-ink-secondary',
              )}
            >
              <Icon size={13} /> {m.label}
            </button>
          );
        })}
      </div>

      {mode === 'coords' && <CoordsMode value={value} onChange={onChange} />}
      {mode === 'address' && <AddressMode onChange={onChange} />}
      {mode === 'map' && (
        <MapMode value={value} onChange={onChange} center={value ? [value.lat, value.lng] : tenantCenter} />
      )}

      {/* Coordenada selecionada */}
      <p className="text-[11px] text-ink-muted">
        Local selecionado:{' '}
        {value ? (
          <span className="data-mono">
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </span>
        ) : (
          <span className="text-ink-muted">nenhum</span>
        )}
      </p>
    </div>
  );
}

function CoordsMode({ value, onChange }: LocationPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="form-label flex flex-col gap-1.5">
        Latitude
        <Input
          type="number"
          step="any"
          defaultValue={value?.lat}
          onChange={(e) => onChange({ lat: Number(e.target.value), lng: value?.lng ?? 0 })}
        />
      </label>
      <label className="form-label flex flex-col gap-1.5">
        Longitude
        <Input
          type="number"
          step="any"
          defaultValue={value?.lng}
          onChange={(e) => onChange({ lat: value?.lat ?? 0, lng: Number(e.target.value) })}
        />
      </label>
    </div>
  );
}

interface AddressFields {
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
}
const EMPTY_ADDRESS: AddressFields = {
  cep: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cidade: '',
  uf: '',
};

function AddressMode({ onChange }: { onChange: (c: Coordenadas) => void }) {
  const [fields, setFields] = useState<AddressFields>(EMPTY_ADDRESS);
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof AddressFields>(key: K, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  // Ao completar o CEP (8 dígitos), preenche logradouro/bairro/cidade/UF via ViaCEP.
  async function onCepBlur() {
    const digits = fields.cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setCepLoading(true);
    setError(null);
    try {
      const r = await lookupCep(digits);
      if (r) {
        setFields((f) => ({
          ...f,
          logradouro: r.logradouro || f.logradouro,
          bairro: r.bairro || f.bairro,
          cidade: r.cidade || f.cidade,
          uf: r.uf || f.uf,
        }));
      } else {
        setError('CEP não encontrado.');
      }
    } catch {
      /* silencioso — o usuário pode preencher manualmente */
    } finally {
      setCepLoading(false);
    }
  }

  async function buscar() {
    if (!fields.logradouro.trim() && !fields.cidade.trim() && !fields.cep.trim()) {
      setError('Preencha ao menos o CEP ou a cidade/logradouro.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await geocodeStructured(fields);
      if (!r) {
        setError('Endereço não encontrado. Ajuste os campos ou use o mapa.');
      } else {
        onChange({ lat: r.lat, lng: r.lng });
        setResult(r.label);
      }
    } catch {
      setError('Falha ao geocodificar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        <FormField label="CEP">
          <div className="relative">
            <Input
              inputMode="numeric"
              maxLength={9}
              placeholder="00000-000"
              value={fields.cep}
              onChange={(e) => set('cep', e.target.value)}
              onBlur={onCepBlur}
            />
            {cepLoading && (
              <Loader2 size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-ink-muted" />
            )}
          </div>
        </FormField>
        <div className="col-span-2">
          <FormField label="Logradouro">
            <Input
              placeholder="Rua / Avenida"
              value={fields.logradouro}
              onChange={(e) => set('logradouro', e.target.value)}
            />
          </FormField>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FormField label="Número">
          <Input placeholder="123" value={fields.numero} onChange={(e) => set('numero', e.target.value)} />
        </FormField>
        <div className="col-span-2">
          <FormField label="Bairro">
            <Input value={fields.bairro} onChange={(e) => set('bairro', e.target.value)} />
          </FormField>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <FormField label="Cidade">
            <Input value={fields.cidade} onChange={(e) => set('cidade', e.target.value)} />
          </FormField>
        </div>
        <FormField label="UF">
          <Input
            maxLength={2}
            placeholder="SP"
            className="uppercase"
            value={fields.uf}
            onChange={(e) => set('uf', e.target.value.toUpperCase())}
          />
        </FormField>
      </div>

      <button
        type="button"
        onClick={buscar}
        className="btn-secondary justify-center"
        disabled={loading}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        Buscar coordenadas do endereço
      </button>

      {result && <p className="text-[11px] text-green-400">✓ {result}</p>}
      {error && <p className="text-[11px] text-severity-critica">{error}</p>}
    </div>
  );
}

function ClickCapture({ onChange }: { onChange: (c: Coordenadas) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 13, { animate: true });
  }, [center, map]);
  return null;
}

function MapMode({
  value,
  onChange,
  center,
}: {
  value: Coordenadas | null;
  onChange: (c: Coordenadas) => void;
  center: [number, number] | null;
}) {
  const initial = value ? [value.lat, value.lng] : (center ?? FALLBACK_CENTER);
  return (
    <div>
      <div className="h-64 overflow-hidden rounded-lg border border-white/10">
        <MapContainer center={initial as [number, number]} zoom={13} className="h-full w-full">
          <TileLayer url={TILE_URL} attribution="&copy; OpenStreetMap" />
          <Recenter center={value ? null : center} />
          <ClickCapture onChange={onChange} />
          {value && (
            <CircleMarker
              center={[value.lat, value.lng]}
              radius={8}
              pathOptions={{ color: '#0F47BC', fillColor: '#3B82F6', fillOpacity: 0.8, weight: 2 }}
            />
          )}
        </MapContainer>
      </div>
      <p className="mt-1 text-[11px] text-ink-muted">Clique no mapa para marcar o local do evento.</p>
    </div>
  );
}
