import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text, StyleSheet} from 'react-native';
import {useAppSelector} from '../store';
import {UserRole} from '../types';
import {Colors, FontSize} from '../theme';

// Stacks
import {OrdersNavigator} from './navigators/OrdersNavigator';
import {MaterialsNavigator} from './navigators/MaterialsNavigator';
import {QualityNavigator} from './navigators/QualityNavigator';
import {ExpeditionNavigator} from './navigators/ExpeditionNavigator';
import {HRNavigator} from './navigators/HRNavigator';
import {ProfileNavigator} from './navigators/ProfileNavigator';

// Screens
import {DashboardScreen} from '../screens/dashboard/DashboardScreen';

const Tab = createBottomTabNavigator();

// Tabs disponíveis por perfil
const tabsByRole: Record<UserRole, string[]> = {
  direcao: ['Dashboard', 'Orders', 'Materials', 'Quality', 'Expedition', 'HR', 'Profile'],
  rh: ['Dashboard', 'HR', 'Profile'],
  planeamento: ['Dashboard', 'Orders', 'Profile'],
  armazem: ['Dashboard', 'Materials', 'Profile'],
  producao: ['Dashboard', 'Orders', 'Materials', 'Profile'],
  qualidade: ['Dashboard', 'Orders', 'Quality', 'Profile'],
  expedicao: ['Dashboard', 'Orders', 'Expedition', 'Profile'],
  montagem: ['Dashboard', 'Orders', 'Profile'],
};

const tabConfig: Record<
  string,
  {label: string; icon: string; component: React.ComponentType<any>}
> = {
  Dashboard: {label: 'Início', icon: '🏠', component: DashboardScreen},
  Orders: {label: 'OPs', icon: '📋', component: OrdersNavigator},
  Materials: {label: 'Armazém', icon: '📦', component: MaterialsNavigator},
  Quality: {label: 'Qualidade', icon: '✅', component: QualityNavigator},
  Expedition: {label: 'Expedição', icon: '🚚', component: ExpeditionNavigator},
  HR: {label: 'RH', icon: '👥', component: HRNavigator},
  Profile: {label: 'Perfil', icon: '👤', component: ProfileNavigator},
};

export const MainNavigator: React.FC = () => {
  const user = useAppSelector(s => s.auth.user);
  const role = (user?.perfil ?? 'producao') as UserRole;
  const allowedTabs = tabsByRole[role] ?? ['Dashboard', 'Profile'];

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#E87D28',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarLabelStyle: styles.tabLabel,
      }}>
      {allowedTabs.map(tabKey => {
        const config = tabConfig[tabKey];
        return (
          <Tab.Screen
            key={tabKey}
            name={tabKey}
            component={config.component}
            options={{
              tabBarLabel: config.label,
              tabBarIcon: ({color}) => (
                <Text style={[styles.tabIcon, {color}]}>{config.icon}</Text>
              ),
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.primary,
    borderTopColor: 'transparent',
    height: 56,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabLabel: {fontSize: FontSize.xs, fontWeight: '600'},
  tabIcon: {fontSize: 18},
});
