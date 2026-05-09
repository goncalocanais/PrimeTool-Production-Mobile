import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useAppSelector} from '../../store';
import {Colors, FontSize, Spacing} from '../../theme';

export const OfflineBanner: React.FC = () => {
  const {isConnected, queue} = useAppSelector(s => s.offline);

  if (isConnected) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        Sem ligação à internet{queue.length > 0 ? ` · ${queue.length} ação(ões) pendente(s)` : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.warning,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
  },
  text: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: '600',
  },
});
