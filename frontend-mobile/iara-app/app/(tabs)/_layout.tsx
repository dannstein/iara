import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { CustomTabBar } from '../../components/CustomTabBar';
import { useAuth, type UserRole } from '../../context/AuthContext';

// ── Navegador swipeável ──────────────────────────────────────

const { Navigator } = createMaterialTopTabNavigator();
const SwipeableTabs = withLayoutContext(Navigator);

// ── Abas visíveis por role ───────────────────────────────────

const ALL_TABS = ['home', 'events', 'report', 'pontos', 'profile'] as const;

const TABS_BY_ROLE: Record<string, readonly string[]> = {
  DOADOR:          ['home', 'events', 'pontos', 'profile'],
  USUARIO_SIMPLES: ['home', 'events', 'pontos', 'profile'],
  COORDENADOR:     ['home', 'events', 'pontos', 'profile'],
  TECNICO:         ['home', 'events', 'report', 'pontos', 'profile'],
  MONITOR:         ['home', 'events', 'report', 'pontos', 'profile'],
  GESTOR:          ['home', 'events', 'report', 'pontos', 'profile'],
  ADMIN:           ['home', 'events', 'report', 'pontos', 'profile'],
};

const TAB_TITLES: Record<string, string> = {
  home:    'Home',
  events:  'Eventos',
  report:  'Reportar',
  pontos:  'Locais',
  profile: 'Perfil',
};

// Fallback mínimo para null role — evita mostrar abas indevidas durante race condition pós-login
const SAFE_FALLBACK: readonly string[] = ['home', 'profile'];

function getVisibleTabs(role: UserRole): readonly string[] {
  if (!role) return SAFE_FALLBACK;
  return TABS_BY_ROLE[role] ?? SAFE_FALLBACK;
}

// ── Layout ───────────────────────────────────────────────────

export default function TabLayout() {
  // Auth já foi resolvido pelo AuthGate em app/_layout.tsx — sem isLoading aqui.
  const { role } = useAuth();
  const visibleTabs = getVisibleTabs(role);

  return (
    <SwipeableTabs
      tabBarPosition="bottom"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        swipeEnabled: false,
        animationEnabled: true,
      }}
    >
      {(ALL_TABS as readonly string[]).filter((tab) => visibleTabs.includes(tab)).map((tab) => (
        <SwipeableTabs.Screen
          key={tab}
          name={tab}
          options={{ title: TAB_TITLES[tab] }}
        />
      ))}
    </SwipeableTabs>
  );
}
