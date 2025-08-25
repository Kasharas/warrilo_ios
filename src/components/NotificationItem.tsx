import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '@/src/styles/theme';

interface NotificationItemProps {
  title: string;
  message: string;
  timestamp: string;
  type: 'warning' | 'success' | 'error' | 'info';
}

export function NotificationItem({ title, message, timestamp, type }: NotificationItemProps) {
  const getIconColor = () => {
    switch (type) {
      case 'warning':
        return theme.colors.warning[500];
      case 'success':
        return theme.colors.success[500];
      case 'error':
        return theme.colors.error[500];
      case 'info':
        return theme.colors.secondary[500];
      default:
        return theme.colors.neutral[500];
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return '⚠';
      case 'success':
        return '✓';
      case 'error':
        return '!';
      case 'info':
        return '🔧';
      default:
        return 'ℹ';
    }
  };

  return (
    <Pressable style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: getIconColor() }]}>
        <Text style={styles.icon}>{getIcon()}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: theme.fontSize.base,
    color: theme.colors.white,
    fontWeight: theme.fontWeight.bold,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.xs,
  },
  message: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing.xs,
  },
  timestamp: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.neutral[500],
  },
});