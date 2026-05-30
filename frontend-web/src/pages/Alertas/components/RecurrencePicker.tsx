import { FormField, Select } from '@/components/ui';
import type { RecurrenceType } from '@/types/api';

export interface RecurrenceValue {
  tipoRecorrencia: RecurrenceType;
  inicio: string;       // datetime-local format
  fim?: string;
  horario?: string;     // HH:mm
  diaSemana?: number;   // 0..6
  diaMes?: number;      // 1..31
  intervaloHoras?: number;
}

interface Props {
  value: RecurrenceValue;
  onChange: (v: RecurrenceValue) => void;
}

const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

const TIPOS: { value: RecurrenceType; label: string; description: string }[] = [
  { value: 'ONE_TIME', label: 'Uma vez', description: 'Dispara apenas na data/hora indicada e desativa.' },
  { value: 'HOURLY', label: 'A cada N horas', description: 'A partir do início, a cada X horas.' },
  { value: 'DAILY', label: 'Diariamente', description: 'Todo dia no mesmo horário.' },
  { value: 'WEEKLY', label: 'Semanalmente', description: 'Todo determinado dia da semana no horário escolhido.' },
  { value: 'MONTHLY', label: 'Mensalmente', description: 'Todo dia X do mês no horário escolhido.' },
];

export function RecurrencePicker({ value, onChange }: Props) {
  const set = (patch: Partial<RecurrenceValue>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <FormField label="Tipo de recorrência" required>
        <Select
          value={value.tipoRecorrencia}
          onChange={(e) => set({ tipoRecorrencia: e.target.value as RecurrenceType })}
        >
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </Select>
        <p className="form-hint">{TIPOS.find((t) => t.value === value.tipoRecorrencia)?.description}</p>
      </FormField>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          label={value.tipoRecorrencia === 'ONE_TIME' ? 'Quando disparar' : 'Início da janela'}
          required
        >
          <input
            type="datetime-local"
            className="input"
            value={value.inicio}
            onChange={(e) => set({ inicio: e.target.value })}
          />
        </FormField>
        {value.tipoRecorrencia !== 'ONE_TIME' && (
          <FormField label="Fim (opcional)" hint="Sem fim definido, repete indefinidamente.">
            <input
              type="datetime-local"
              className="input"
              value={value.fim ?? ''}
              onChange={(e) => set({ fim: e.target.value || undefined })}
            />
          </FormField>
        )}
      </div>

      {(value.tipoRecorrencia === 'DAILY' ||
        value.tipoRecorrencia === 'WEEKLY' ||
        value.tipoRecorrencia === 'MONTHLY') && (
        <FormField label="Horário" required>
          <input
            type="time"
            className="input"
            value={value.horario ?? ''}
            onChange={(e) => set({ horario: e.target.value })}
          />
        </FormField>
      )}

      {value.tipoRecorrencia === 'WEEKLY' && (
        <FormField label="Dia da semana" required>
          <Select
            value={value.diaSemana ?? ''}
            onChange={(e) => set({ diaSemana: e.target.value !== '' ? Number(e.target.value) : undefined })}
          >
            <option value="">Selecione…</option>
            {DIAS_SEMANA.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </Select>
        </FormField>
      )}

      {value.tipoRecorrencia === 'MONTHLY' && (
        <FormField label="Dia do mês" required hint="Se o mês for mais curto, usa o último dia disponível.">
          <input
            type="number"
            className="input"
            min={1}
            max={31}
            value={value.diaMes ?? ''}
            onChange={(e) => set({ diaMes: e.target.value ? Number(e.target.value) : undefined })}
          />
        </FormField>
      )}

      {value.tipoRecorrencia === 'HOURLY' && (
        <FormField label="Intervalo em horas" required>
          <input
            type="number"
            className="input"
            min={1}
            value={value.intervaloHoras ?? ''}
            onChange={(e) =>
              set({ intervaloHoras: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </FormField>
      )}
    </div>
  );
}

/** Resumo legível para mostrar em listas. Aceita null nos campos opcionais. */
export function describeRecurrence(v: {
  tipoRecorrencia: RecurrenceType;
  horario?: string | null;
  diaSemana?: number | null;
  diaMes?: number | null;
  intervaloHoras?: number | null;
}): string {
  const dia = (n: number | null | undefined) =>
    n != null ? DIAS_SEMANA.find((d) => d.value === n)?.label : '';
  switch (v.tipoRecorrencia) {
    case 'ONE_TIME': return 'Uma vez';
    case 'HOURLY': return `A cada ${v.intervaloHoras ?? '?'} h`;
    case 'DAILY': return `Diariamente às ${v.horario?.slice(0, 5) ?? '?'}`;
    case 'WEEKLY': return `Toda ${dia(v.diaSemana) ?? '?'} às ${v.horario?.slice(0, 5) ?? '?'}`;
    case 'MONTHLY': return `Todo dia ${v.diaMes ?? '?'} às ${v.horario?.slice(0, 5) ?? '?'}`;
    default: return v.tipoRecorrencia;
  }
}
