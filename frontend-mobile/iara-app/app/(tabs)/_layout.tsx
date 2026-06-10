import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { CustomTabBar } from '../../components/CustomTabBar';
import { useAuth, type UserRole } from '../../context/AuthContext';

const { Navigator } = createMaterialTopTabNavigator();
const SwipeableTabs = withLayoutContext(Navigator);

const ALL_TABS = ['home', 'events', 'report', 'meupc', 'pontos', 'menu', 'profile'] as const;

const TABS_BY_ROLE: Record<string, readonly string[]> = {
  DOADOR:          ['home', 'events', 'pontos', 'menu'],
  USUARIO_SIMPLES: ['home', 'events', 'pontos', 'menu'],
  COORDENADOR:     ['home', 'events', 'meupc', 'pontos', 'menu'],
  TECNICO:         ['home', 'events', 'pontos', 'menu'],
  MONITOR:         ['home', 'events', 'report', 'pontos', 'menu'],
  GESTOR:          ['home', 'events', 'report', 'pontos', 'menu'],
  ADMIN:           ['home', 'events', 'report', 'pontos', 'menu'],
};

const TAB_TITLES: Record<string, string> = {
  home:    'Home',
  events:  'Eventos',
  report:  'Reportar',
  meupc:   'Meu PC',
  pontos:  'Locais',
  menu:    'Menu',
  profile: 'Perfil',
};

function getVisibleTabs(role: UserRole): readonly string[] {
  if (!role) return [];
  return TABS_BY_ROLE[role] ?? [];
}

export default function TabLayout() {
  const { role } = useAuth();
  const visibleTabs = getVisibleTabs(role);

  return (
    <SwipeableTabs
      key={role ?? 'loading'}
      tabBarPosition="bottom"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        swipeEnabled: false,
        animationEnabled: true,
      }}
    >
      {(ALL_TABS as readonly string[]).map((tab) => (
        <SwipeableTabs.Screen
          key={tab}
          name={tab}
          options={{
            title: TAB_TITLES[tab],
            href: visibleTabs.includes(tab) ? undefined : null,
          }}
        />
      ))}
    </SwipeableTabs>
  );
}
