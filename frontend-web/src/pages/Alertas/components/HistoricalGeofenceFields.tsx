import { FormField } from '@/components/ui';
import type { GeofenceMode } from '@/types/api';

interface Props {
  modes: GeofenceMode[];
  toggleMode: (mode: GeofenceMode) => void;
  lastHours: number | undefined;
  setLastHours: (v: number | undefined) => void;
  frequentMinDays: number | undefined;
  setFrequentMinDays: (v: number | undefined) => void;
  frequentLastDays: number | undefined;
  setFrequentLastDays: (v: number | undefined) => void;
}

/**
 * Componente reutilizável para os dois modos de geofence baseados em histórico
 * de localização (Fase 2C). Inclui chip seletor + inputs condicionais + banner LGPD.
 */
export function HistoricalGeofenceFields({
  modes,
  toggleMode,
  lastHours,
  setLastHours,
  frequentMinDays,
  setFrequentMinDays,
  frequentLastDays,
  setFrequentLastDays,
}: Props) {
  const passed = modes.includes('PASSED_THROUGH');
  const frequent = modes.includes('FREQUENT');
  const anyActive = passed || frequent;

  return (
    <div className="space-y-3 rounded-md border border-white/10 bg-bg-elevated/40 p-3">
      <p className="text-[12px] font-medium text-ink-primary">Modos baseados em histórico</p>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <label
          className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-[12px] ${
            passed
              ? 'border-brand-orange/60 bg-brand-orange/10 text-ink-primary'
              : 'border-white/10 text-ink-secondary hover:border-white/20'
          }`}
        >
          <input
            type="checkbox"
            checked={passed}
            onChange={() => toggleMode('PASSED_THROUGH')}
          />
          Passou pela área (últimas X horas)
        </label>
        <label
          className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-[12px] ${
            frequent
              ? 'border-brand-orange/60 bg-brand-orange/10 text-ink-primary'
              : 'border-white/10 text-ink-secondary hover:border-white/20'
          }`}
        >
          <input
            type="checkbox"
            checked={frequent}
            onChange={() => toggleMode('FREQUENT')}
          />
          Frequentemente presente na área
        </label>
      </div>

      {passed && (
        <FormField label="PASSED_THROUGH: últimas N horas" hint="Default 24h. Olha registros do histórico nesta janela.">
          <input
            type="number"
            className="input"
            min={1}
            max={168}
            value={lastHours ?? ''}
            placeholder="24"
            onChange={(e) => setLastHours(e.target.value ? Number(e.target.value) : undefined)}
          />
        </FormField>
      )}

      {frequent && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FormField label="FREQUENT: pelo menos N dias distintos" hint="Default 5. Dias diferentes com registro na área.">
            <input
              type="number"
              className="input"
              min={1}
              max={30}
              value={frequentMinDays ?? ''}
              placeholder="5"
              onChange={(e) => setFrequentMinDays(e.target.value ? Number(e.target.value) : undefined)}
            />
          </FormField>
          <FormField label="Dentro dos últimos N dias" hint="Default 30. Janela total para contagem.">
            <input
              type="number"
              className="input"
              min={1}
              max={30}
              value={frequentLastDays ?? ''}
              placeholder="30"
              onChange={(e) => setFrequentLastDays(e.target.value ? Number(e.target.value) : undefined)}
            />
          </FormField>
        </div>
      )}

      {anyActive && (
        <p className="rounded-md border border-brand-orange/30 bg-brand-orange/5 p-2 text-[11px] text-ink-secondary">
          <strong>LGPD:</strong> esses modos usam o histórico de localização compartilhado
          pelos usuários (retido por 7 dias). Base legal — Art. 7º VII (interesses vitais).
          Ative apenas para emergências legítimas: o uso fica registrado em auditoria.
        </p>
      )}
    </div>
  );
}
