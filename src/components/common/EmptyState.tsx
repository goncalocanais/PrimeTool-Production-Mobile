import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors, FontSize, Spacing} from '../../theme';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({title, description, action}) => (
  <View style={styles.container}>
    <Text style={styles.icon}>📭</Text>
    <Text style={styles.title}>{title}</Text>
    {description && <Text style={styles.description}>{description}</Text>}
    {action && <View style={styles.action}>{action}</View>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['3xl'],
  },
  icon: {fontSize: 48, marginBottom: Spacing.base},
  title: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.gray700,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    textAlign: 'center',
    lineHeight: 20,
  },
  action: {marginTop: Spacing.lg},
});
