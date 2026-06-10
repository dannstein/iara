import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { EventosPage } from '@/pages/Eventos/EventosPage';
import { EventoDetailPage } from '@/pages/Eventos/EventoDetailPage';
import { MapaPage } from '@/pages/Mapa/MapaPage';
import { PontosColetaPage } from '@/pages/PontosColeta/PontosColetaPage';
import { MeuPcPage } from '@/pages/MeuPc/MeuPcPage';
import { AbrigosPage } from '@/pages/Abrigos/AbrigosPage';
import { TenantsPage } from '@/pages/Tenants/TenantsPage';
import { HospitaisPage } from '@/pages/Hospitais/HospitaisPage';
import { UsuariosPage } from '@/pages/Usuarios/UsuariosPage';
import { ZonasRiscoPage } from '@/pages/ZonasRisco/ZonasRiscoPage';
import { PontosApoioPage } from '@/pages/PontosApoio/PontosApoioPage';
import { PrevencaoPage } from '@/pages/Prevencao/PrevencaoPage';
import { AlertasCommandCenter } from '@/pages/Alertas/AlertasCommandCenter';
import { NovoAlertaPage } from '@/pages/Alertas/NovoAlertaPage';
import { AlertaDetailPage } from '@/pages/Alertas/AlertaDetailPage';
import { AgendamentosPage } from '@/pages/Alertas/AgendamentosPage';
import { NovoAgendamentoPage } from '@/pages/Alertas/NovoAgendamentoPage';
import { AlertasAutomaticosPage } from '@/pages/Alertas/AlertasAutomaticosPage';
import { NotificacaoPrefsPage } from '@/pages/Perfil/NotificacaoPrefsPage';
import { AppConfigPage } from '@/pages/Admin/AppConfigPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'eventos', element: <EventosPage /> },
          { path: 'eventos/:id', element: <EventoDetailPage /> },
          { path: 'mapa', element: <MapaPage /> },
          { path: 'prevencao', element: <PrevencaoPage /> },
          { path: 'pontos-coleta', element: <PontosColetaPage /> },
          { path: 'meu-pc', element: <MeuPcPage /> },
          { path: 'abrigos', element: <AbrigosPage /> },
          { path: 'hospitais', element: <HospitaisPage /> },
          { path: 'pontos-apoio', element: <PontosApoioPage /> },
          { path: 'usuarios', element: <UsuariosPage /> },
          { path: 'zonas-risco', element: <ZonasRiscoPage /> },
          { path: 'tenants', element: <TenantsPage /> },
          { path: 'alertas', element: <AlertasCommandCenter /> },
          { path: 'alertas/novo', element: <NovoAlertaPage /> },
          { path: 'alertas/agendamentos', element: <AgendamentosPage /> },
          { path: 'alertas/agendamentos/novo', element: <NovoAgendamentoPage /> },
          { path: 'alertas/automaticos', element: <AlertasAutomaticosPage /> },
          { path: 'alertas/:id', element: <AlertaDetailPage /> },
          { path: 'perfil/notificacoes', element: <NotificacaoPrefsPage /> },
          { path: 'admin/app-config', element: <AppConfigPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
