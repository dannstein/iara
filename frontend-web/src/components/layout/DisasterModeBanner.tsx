import { AlertTriangle } from 'lucide-react';
import { useAppConfig } from '@/hooks/useAppConfig';

/**
 * Banner persistente quando disaster_mode está ativo. Fica logo abaixo do
 * Topbar; visível para todos os usuários — não só ADMIN — para que saibam
 * que jobs/automações estão pausados.
 */
export function DisasterModeBanner() {
  const { data } = useAppConfig();
  if (!data?.disasterModeAtivo) return null;

  return (
    <div className="sticky top-14 z-30 flex items-center gap-3 border-b border-rose-500/40 bg-rose-500/10 px-6 py-2 text-[12px] text-rose-300 backdrop-blur-sm">
      <AlertTriangle size={15} className="flex-shrink-0" />
      <span>
        <strong>Modo desastre ativo.</strong> Agendamentos pausados, alertas automáticos
        silenciados, expansão de raio em standby. Alertas manuais continuam operando.
      </span>
    </div>
  );
}
