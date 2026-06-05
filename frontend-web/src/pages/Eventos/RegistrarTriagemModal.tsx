import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal, Button, Input } from '@/components/ui';
import { useRegistrarTriagem } from '@/hooks/useEventos';
import { apiErrorMessage } from '@/lib/api';
import type { Classificacao, Coordenadas, RegistrarTriagemInput } from '@/types/api';

interface Props {
  eventoId: string;
  open: boolean;
  onClose: () => void;
}

const COR_BY_CLASSIFICACAO: Record<Classificacao, { hex: string; label: string; description: string }> = {
  VERMELHO: { hex: '#EF4444', label: 'VERMELHO', description: 'Crítico — atendimento imediato' },
  AMARELO:  { hex: '#EAB308', label: 'AMARELO',  description: 'Urgente — pode aguardar minutos' },
  VERDE:    { hex: '#22C55E', label: 'VERDE',    description: 'Leve — pode aguardar horas' },
  PRETO:    { hex: '#9CA3AF', label: 'PRETO',    description: 'Sem sinais vitais' },
};

const CLASSIFICACOES: Classificacao[] = ['VERMELHO', 'AMARELO', 'VERDE', 'PRETO'];

type RespiraValue = 'sim' | 'nao' | 'desconhecido';

export function RegistrarTriagemModal({ eventoId, open, onClose }: Props) {
  const registrar = useRegistrarTriagem(eventoId);
  const [codigoCampo, setCodigoCampo] = useState('');
  const [nomeProvisorio, setNomeProvisorio] = useState('');
  const [idadeEstimada, setIdadeEstimada] = useState<string>('');
  const [classificacao, setClassificacao] = useState<Classificacao | ''>('');
  const [respira, setRespira] = useState<RespiraValue>('desconhecido');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');

  // Limpa o formulário ao abrir o modal.
  useEffect(() => {
    if (open) {
      setCodigoCampo('');
      setNomeProvisorio('');
      setIdadeEstimada('');
      setClassificacao('');
      setRespira('desconhecido');
      setLat('');
      setLng('');
    }
  }, [open]);

  // RN14: se respira=false (não respira mesmo após abertura de vias aéreas), força PRETO.
  useEffect(() => {
    if (respira === 'nao') {
      setClassificacao('PRETO');
    }
  }, [respira]);

  const respiraIsNao = respira === 'nao';

  async function submit() {
    if (!codigoCampo.trim()) {
      toast.error('Código de campo é obrigatório');
      return;
    }
    if (!classificacao) {
      toast.error('Selecione uma classificação');
      return;
    }

    const respiraBool: boolean | undefined =
      respira === 'sim' ? true : respira === 'nao' ? false : undefined;

    let coordenadas: Coordenadas | undefined;
    if (lat.trim() && lng.trim()) {
      const latNum = Number(lat);
      const lngNum = Number(lng);
      if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
        coordenadas = { lat: latNum, lng: lngNum };
      }
    }

    const payload: RegistrarTriagemInput = {
      codigoCampo: codigoCampo.trim(),
      nomeProvisorio: nomeProvisorio.trim() || undefined,
      idadeEstimada: idadeEstimada.trim() ? Number(idadeEstimada) : undefined,
      classificacao,
      respiraAposAbertura: respiraBool,
      coordenadas,
    };

    try {
      await registrar.mutateAsync(payload);
      toast.success('Triagem registrada');
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function fillFromGeolocation() {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não disponível no navegador');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
      },
      () => toast.error('Permissão de geolocalização negada'),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar triagem START">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[12px] text-ink-secondary">
              Código de campo <span className="text-rose-400">*</span>
            </label>
            <Input
              value={codigoCampo}
              onChange={(e) => setCodigoCampo(e.target.value.toUpperCase())}
              maxLength={20}
              placeholder="V001"
            />
            <p className="mt-1 text-[10px] text-ink-muted">
              Identificador da vítima em campo (máx. 20 caracteres).
            </p>
          </div>
          <div>
            <label className="mb-1 block text-[12px] text-ink-secondary">Nome provisório</label>
            <Input
              value={nomeProvisorio}
              onChange={(e) => setNomeProvisorio(e.target.value)}
              maxLength={150}
              placeholder="Opcional"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[12px] text-ink-secondary">Idade estimada (anos)</label>
          <Input
            type="number"
            min={0}
            max={120}
            value={idadeEstimada}
            onChange={(e) => setIdadeEstimada(e.target.value)}
            placeholder="Opcional"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12px] text-ink-secondary">
            Respira após abertura das vias aéreas?
          </label>
          <div className="flex gap-2">
            {([
              { v: 'sim', label: 'Sim' },
              { v: 'nao', label: 'Não' },
              { v: 'desconhecido', label: 'Não avaliado' },
            ] as { v: RespiraValue; label: string }[]).map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setRespira(opt.v)}
                className={`flex-1 rounded-md border px-3 py-2 text-[12px] transition-colors ${
                  respira === opt.v
                    ? 'border-brand-light bg-brand-blue-soft text-ink-primary'
                    : 'border-white/10 text-ink-secondary hover:border-white/20'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {respiraIsNao && (
            <p className="mt-1 text-[10px] text-rose-300">
              RN14: ausência de respiração após abertura força classificação PRETO.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-[12px] text-ink-secondary">
            Classificação <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {CLASSIFICACOES.map((c) => {
              const cfg = COR_BY_CLASSIFICACAO[c];
              const selected = classificacao === c;
              const disabled = respiraIsNao && c !== 'PRETO';
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => !disabled && setClassificacao(c)}
                  disabled={disabled}
                  className={`rounded-md border-2 px-3 py-2 text-[12px] font-bold uppercase transition-all ${
                    selected
                      ? 'border-white text-white'
                      : disabled
                      ? 'border-white/5 text-ink-muted opacity-40'
                      : 'border-white/10 text-ink-secondary hover:border-white/30'
                  }`}
                  style={{
                    background: selected ? cfg.hex : `${cfg.hex}22`,
                    color: selected ? '#fff' : cfg.hex,
                  }}
                  title={cfg.description}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
          {classificacao && (
            <p className="mt-1 text-[10px] text-ink-muted">
              {COR_BY_CLASSIFICACAO[classificacao].description}
            </p>
          )}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[12px] text-ink-secondary">Local encontrado (opcional)</label>
            <button
              type="button"
              onClick={fillFromGeolocation}
              className="text-[11px] text-brand-light hover:underline"
            >
              Usar minha localização
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="Latitude"
              inputMode="decimal"
            />
            <Input
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="Longitude"
              inputMode="decimal"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={registrar.isPending}>
            Registrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
