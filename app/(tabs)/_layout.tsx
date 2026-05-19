import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { useAppSelector } from '../../src/store';
import { UserRole } from '../../src/types';
import { Colors, FontSize } from '../../src/theme';

const ORANGE = '#E87D28';

const ALL_TABS = [
  { name: 'index', label: 'Início', icon: '🏠', roles: ['direcao', 'planeamento', 'armazem', 'producao', 'qualidade', 'expedicao', 'montagem'] },
  { name: 'orders', label: 'OPs', icon: '📋', roles: ['direcao', 'planeamento', 'producao', 'qualidade', 'expedicao', 'montagem'] },
  { name: 'materials', label: 'Armazém', icon: '📦', roles: ['direcao', 'armazem', 'producao'] },
  { name: 'quality', label: 'Qualidade', icon: '✅', roles: ['direcao', 'qualidade'] },
  { name: 'expedition', label: 'Expedição', icon: '🚚', roles: ['direcao', 'expedicao'] },
  { name: 'profile', label: 'Perfil', icon: '👤', roles: ['direcao', 'planeamento', 'armazem', 'producao', 'qualidade', 'expedicao', 'montagem'] },
] as const;

export default function TabsLayout() {
  const user = useAppSelector(s => s.auth.user);
  const role = (user?.perfil ?? 'producao') as UserRole;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {display: 'none'},
      }}>
      {ALL_TABS.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            href: tab.roles.includes(role as any) ? undefined : null,
            tabBarIcon: ({ color }) => (
              <Text style={[styles.tabIcon, { color }]}>{tab.icon}</Text>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.primary,
    borderTopColor: 'transparent',
    height: 56,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabLabel: { fontSize: FontSize.xs, fontWeight: '600' },
  tabIcon: { fontSize: 18 },
});
