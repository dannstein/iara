import { Calendar, ListChecks, HandHeart, Warehouse, Users } from 'lucide-react';
import { Card } from '@/components/ui';
import {
  useDemandas,
  useDoacoesPendentesPc,
  useEstoque,
  useHelpers,
  usePcEventos,
} from '@/hooks/usePcs';
import type { PcDTO } from '@/types/api';

export function VisaoGeralTab({ pc }: { pc: PcDTO }) {
  const eventos = usePcEventos(pc.id);
  const demandas = useDemandas(pc.id);
  const doacoes = useDoacoesPendentesPc(pc.id);
  const estoque = useEstoque(pc.id);
  const helpers = useHelpers(pc.id, 'CONFIRMADO');

  const eventosAtivos = eventos.data?.filter((e) => e.status === 'ACEITO').length ?? 0;
  const demandasOpen =
    demandas.data?.filter((d) => d.status === 'OPEN' || d.status === 'PARTIALLY_FULFILLED')
      .length ?? 0;
  const intencoesPendentes = doacoes.data?.filter((d) => d.status === 'PENDENTE').length ?? 0;
  const estoqueTotal = estoque.data?.reduce((s, e) => s + e.quantidade, 0) ?? 0;
  const workersConfirmados = helpers.data?.length ?? 0;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat icon={<Calendar size={18} />} label="Eventos aceitos" value={eventosAtivos} />
        <Stat
          icon={<ListChecks size={18} />}
          label="Demandas abertas"
          value={demandasOpen}
        />
        <Stat
          icon={<HandHeart size={18} />}
          label="Intenções pendentes"
          value={intencoesPendentes}
        />
        <Stat icon={<Warehouse size={18} />} label="Estoque total" value={estoqueTotal} />
        <Stat
          icon={<Users size={18} />}
          label="Workers confirmados"
          value={workersConfirmados}
        />
      </div>

      {pc.pcDesc && (
        <Card className="mt-5 p-5">
          <h3 className="mb-2 text-[13px] font-semibold text-ink-primary">Descrição</h3>
          <p className="text-[13px] text-ink-secondary">{pc.pcDesc}</p>
        </Card>
      )}
    </>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2 text-ink-muted">
        {icon}
        <span className="text-[11px] uppercase tracking-[0.06em]">{label}</span>
      </div>
      <p className="data-mono text-[22px] font-bold text-ink-primary">{value}</p>
    </Card>
  );
}
