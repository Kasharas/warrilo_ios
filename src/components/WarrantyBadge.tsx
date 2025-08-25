import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/src/styles/theme';

interface WarrantyBadgeProps {
  status: 'active' | 'expiring' | 'expired';
}

export function WarrantyBadge({ status }: WarrantyBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return theme.colors.success[500];
      case 'expiring':
        return theme.colors.warning[500];
      case 'expired':
        return theme.colors.error[500];
      default:
        return theme.colors.neutral[500];
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'active':
        return 'ACTIVE';
      case 'expiring':
        return 'EXPIRING';
      case 'expired':
        return 'EXPIRED';
      default:
        return 'UNKNOWN';
    }
  };

  return (
    <View style={[styles.badge, { backgroundColor: getStatusColor() }]}>
      <Text style={styles.badgeText}>{getStatusText()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
  },
});