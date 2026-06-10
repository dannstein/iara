import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ListChecks,
  HandHeart,
  Warehouse,
  Users,
  CheckCircle2,
  History,
  CalendarClock,
} from 'lucide-react';
import { LoadingBlock, EmptyState, ErrorState } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useMeuPc } from '@/hooks/usePcs';
import { VisaoGeralTab } from './tabs/VisaoGeralTab';
import { EventosTab } from './tabs/EventosTab';
import { DemandasTab } from './tabs/DemandasTab';
import { RecebimentosTab } from './tabs/RecebimentosTab';
import { EstoqueTab } from './tabs/EstoqueTab';
import { WorkersTab } from './tabs/WorkersTab';
import { EncerramentoTab } from './tabs/EncerramentoTab';
import { HistoricoTab } from './tabs/HistoricoTab';

const TABS = [
  { key: 'visao', label: 'Visão geral', icon: Package },
  { key: 'eventos', label: 'Eventos', icon: CalendarClock },
  { key: 'demandas', label: 'Demandas', icon: ListChecks },
  { key: 'recebimentos', label: 'Recebimentos', icon: HandHeart },
  { key: 'estoque', label: 'Estoque', icon: Warehouse },
  { key: 'workers', label: 'Workers', icon: Users },
  { key: 'encerramento', label: 'Encerramento', icon: CheckCircle2 },
  { key: 'historico', label: 'Histórico', icon: History },
] as const;
type TabKey = (typeof TABS)[number]['key'];

export function MeuPcPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: pc, isLoading, isError } = useMeuPc(user?.userId);
  const [tab, setTab] = useState<TabKey>('visao');

  const visibleTabs = useMemo(() => TABS, []);

  if (isLoading) return <LoadingBlock />;
  if (isError) return <ErrorState />;
  if (!pc) {
    return (
      <EmptyState
        icon={<Package size={28} />}
        title="Você ainda não tem um Ponto de Coleta ativo"
        description="Cadastre-se como coordenador para começar ou peça ao seu gestor para vincular você a um PC."
        action={
          <button className="btn-primary" onClick={() => navigate('/pontos-coleta')}>
            Ver Pontos de Coleta
          </button>
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Meu PC</p>
          <h1 className="text-[22px] font-bold text-ink-primary">{pc.pcNome}</h1>
          <p className="mt-1 text-[12px] text-ink-muted">
            {pc.pcTipo} · {pc.statusVerificacao.replace(/_/g, ' ')}
            {pc.pcContato && <> · {pc.pcContato}</>}
          </p>
        </div>
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-white/5">
        {visibleTabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                active
                  ? 'border-brand-dark text-ink-primary'
                  : 'border-transparent text-ink-muted hover:text-ink-secondary'
              }`}
            >
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'visao' && <VisaoGeralTab pc={pc} />}
      {tab === 'eventos' && <EventosTab pcId={pc.id} />}
      {tab === 'demandas' && <DemandasTab pcId={pc.id} />}
      {tab === 'recebimentos' && <RecebimentosTab pcId={pc.id} />}
      {tab === 'estoque' && <EstoqueTab pcId={pc.id} />}
      {tab === 'workers' && <WorkersTab pcId={pc.id} />}
      {tab === 'encerramento' && <EncerramentoTab pcId={pc.id} />}
      {tab === 'historico' && <HistoricoTab pcId={pc.id} />}
    </div>
  );
}
