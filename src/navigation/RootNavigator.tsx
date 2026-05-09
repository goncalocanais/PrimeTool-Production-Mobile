import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {useAppSelector, useAppDispatch} from '../store';
import {restoreSession} from '../store/slices/authSlice';
import {offlineQueue} from '../utils/offlineQueue';
import {useNetworkSync} from '../hooks';
import {AuthNavigator} from './AuthNavigator';
import {AppNavigator} from './AppNavigator';
import {LoadingOverlay} from '../components/common';
import {View} from 'react-native';
import {Colors} from '../theme';

export const RootNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const {isAuthenticated, isLoading} = useAppSelector(s => s.auth);

  // Gestão de rede e sincronização offline
  useNetworkSync();

  useEffect(() => {
    dispatch(restoreSession());
    offlineQueue.loadFromStorage();
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={{flex: 1, backgroundColor: Colors.primary}}>
        <LoadingOverlay visible message="A carregar..." />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
