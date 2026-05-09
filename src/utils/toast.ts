import Toast from 'react-native-toast-message';

export const toast = {
  success: (message: string, title = 'Sucesso') => {
    Toast.show({type: 'success', text1: title, text2: message, visibilityTime: 3000});
  },
  error: (message: string, title = 'Erro') => {
    Toast.show({type: 'error', text1: title, text2: message, visibilityTime: 4000});
  },
  info: (message: string, title = 'Informação') => {
    Toast.show({type: 'info', text1: title, text2: message, visibilityTime: 3000});
  },
  offline: () => {
    Toast.show({
      type: 'info',
      text1: 'Sem ligação',
      text2: 'A ação será enviada quando a ligação for restabelecida',
      visibilityTime: 4000,
    });
  },
};
