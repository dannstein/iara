import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button, SectionHeader } from '@/components/ui';
import type { AlertaCategoria, AlertaDTO } from '@/types/api';
import { CATEGORIA, SEVERITY } from './components/severity';
import { DangerZoneForm } from './categories/DangerZoneForm';
import { EventZoneForm } from './categories/EventZoneForm';
import { TenantBroadcastForm } from './categories/TenantBroadcastForm';
import { TechnicalRequestForm } from './categories/TechnicalRequestForm';
import { SupportPointsForm } from './categories/SupportPointsForm';
import { CollectionPointsForm } from './categories/CollectionPointsForm';
import { MonitorsForm } from './categories/MonitorsForm';
import { PersonalizedForm } from './categories/PersonalizedForm';

const CATEGORIES: AlertaCategoria[] = [
  'DANGER_ZONE', 'EVENT_ZONE', 'TENANT_BROADCAST', 'TECHNICAL_REQUEST',
  'SUPPORT_POINTS', 'COLLECTION_POINTS', 'MONITORS', 'PERSONALIZED',
];

export function NovoAlertaPage() {
  const navigate = useNavigate();
  const [categoria, setCategoria] = useState<AlertaCategoria | null>(null);

  function handleSuccess(alerta: AlertaDTO) {
    if (alerta.merged) {
      toast.info(`Mesclado com alerta existente (${alerta.mergedCount}× absorvido)`, {
        description: 'A janela de expiração foi estendida.',
      });
    } else {
      toast.success('Alerta criado com sucesso');
    }
    navigate(`/alertas/${alerta.id}`);
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Comunicação"
        title={categoria ? `Novo alerta — ${CATEGORIA[categoria].label}` : 'Novo alerta'}
        action={
          <Button
            variant="secondary"
            onClick={() => (categoria ? setCategoria(null) : navigate('/alertas'))}
          >
            <ArrowLeft size={14} /> {categoria ? 'Trocar categoria' : 'Voltar'}
          </Button>
        }
      />

      {!categoria && (
        <>
          <p className="mb-5 text-[13px] text-ink-secondary">
            Escolha a categoria que melhor representa o alerta. Cada categoria tem regras de
            targeting, cooldown e severidade próprias.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const meta = CATEGORIA[cat];
              const Icon = meta.icon;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoria(cat)}
                  className="group flex items-start gap-3 rounded-xl border border-white/[0.08] bg-bg-secondary p-4 text-left transition-all hover:-translate-y-px hover:border-white/14"
                >
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ background: SEVERITY.SOLICITATION.glow, color: SEVERITY.SOLICITATION.color }}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[14px] font-semibold text-ink-primary">{meta.label}</h3>
                    <p className="mt-0.5 text-[12px] text-ink-secondary">{meta.description}</p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="mt-2 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </button>
              );
            })}
          </div>
        </>
      )}

      {categoria === 'DANGER_ZONE' && <DangerZoneForm onSuccess={handleSuccess} />}
      {categoria === 'EVENT_ZONE' && <EventZoneForm onSuccess={handleSuccess} />}
      {categoria === 'TENANT_BROADCAST' && <TenantBroadcastForm onSuccess={handleSuccess} />}
      {categoria === 'TECHNICAL_REQUEST' && <TechnicalRequestForm onSuccess={handleSuccess} />}
      {categoria === 'SUPPORT_POINTS' && <SupportPointsForm onSuccess={handleSuccess} />}
      {categoria === 'COLLECTION_POINTS' && <CollectionPointsForm onSuccess={handleSuccess} />}
      {categoria === 'MONITORS' && <MonitorsForm onSuccess={handleSuccess} />}
      {categoria === 'PERSONALIZED' && <PersonalizedForm onSuccess={handleSuccess} />}
    </div>
  );
}
