import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { EventosPage } from '@/pages/Eventos/EventosPage';
import { EventoDetailPage } from '@/pages/Eventos/EventoDetailPage';
import { MapaPage } from '@/pages/Mapa/MapaPage';
import { PontosColetaPage } from '@/pages/PontosColeta/PontosColetaPage';
import { AbrigosPage } from '@/pages/Abrigos/AbrigosPage';
import { TenantsPage } from '@/pages/Tenants/TenantsPage';
import { HospitaisPage } from '@/pages/Hospitais/HospitaisPage';
import { UsuariosPage } from '@/pages/Usuarios/UsuariosPage';
import { ZonasRiscoPage } from '@/pages/ZonasRisco/ZonasRiscoPage';
import { PontosApoioPage } from '@/pages/PontosApoio/PontosApoioPage';
import { PrevencaoPage } from '@/pages/Prevencao/PrevencaoPage';
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
          { path: 'abrigos', element: <AbrigosPage /> },
          { path: 'hospitais', element: <HospitaisPage /> },
          { path: 'pontos-apoio', element: <PontosApoioPage /> },
          { path: 'usuarios', element: <UsuariosPage /> },
          { path: 'zonas-risco', element: <ZonasRiscoPage /> },
          { path: 'tenants', element: <TenantsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
