import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/src/styles/theme';

export interface SyncStatusBarProps {
  pending: number;
  failed: number;
  isSyncing: boolean;
  lastSync: string | null;
  onManualSync?: () => void;
  onRetryFailed?: () => void;
  compact?: boolean;
}

export const SyncStatusBar: React.FC<SyncStatusBarProps> = ({
  pending,
  failed,
  isSyncing,
  lastSync,
  onManualSync,
  onRetryFailed,
  compact = false,
}) => {
  // Don't show if no pending or failed items
  if (pending === 0 && failed === 0 && !isSyncing) {
    return null;
  }

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getStatusColor = () => {
    if (failed > 0) return theme.colors.systemRed;
    if (pending > 0) return theme.colors.warning[500];
    return theme.colors.success[500];
  };

  const getStatusIcon = () => {
    if (isSyncing) return <Ionicons name="refresh" size={16} color={"#007AFF"} />;
    if (failed > 0) return <Ionicons name="alert-circle" size={16} color={theme.colors.systemRed} />;
    if (pending > 0) return <Ionicons name="time" size={16} color={theme.colors.warning[500]} />;
    return <Ionicons name="checkmark-circle" size={16} color={theme.colors.success[500]} />;
  };

  const getStatusText = () => {
    if (isSyncing) return 'Syncing...';
    if (failed > 0) return `${failed} failed`;
    if (pending > 0) return `${pending} pending`;
    return 'All synced';
  };

  if (compact) {
    return (
      <View style={[styles.container, styles.compact]}>
        <View style={styles.statusRow}>
          {getStatusIcon()}
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
        
        {(pending > 0 || failed > 0) && (
          <View style={styles.actionRow}>
            {pending > 0 && onManualSync && (
              <Pressable style={styles.actionButton} onPress={onManualSync}>
                <Text style={styles.actionButtonText}>Sync Now</Text>
              </Pressable>
            )}
            {failed > 0 && onRetryFailed && (
              <Pressable style={styles.actionButton} onPress={onRetryFailed}>
                <Text style={styles.actionButtonText}>Retry</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusRow}>
          {getStatusIcon()}
          <Text style={styles.title}>Sync Status</Text>
        </View>
        
        {lastSync && (
          <Text style={styles.lastSync}>
            Last sync: {formatLastSync(lastSync)}
          </Text>
        )}
      </View>

      <View style={styles.details}>
        {pending > 0 && (
          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color={theme.colors.warning[500]} />
            <Text style={styles.detailText}>
              {pending} device{pending !== 1 ? 's' : ''} pending sync
            </Text>
          </View>
        )}
        
        {failed > 0 && (
          <View style={styles.detailRow}>
            <Ionicons name="alert-circle" size={16} color={theme.colors.systemRed} />
            <Text style={styles.detailText}>
              {failed} device{failed !== 1 ? 's' : ''} failed to sync
            </Text>
          </View>
        )}
        
        {isSyncing && (
          <View style={styles.detailRow}>
            <Ionicons name="refresh" size={16} color={"#007AFF"} />
            <Text style={styles.detailText}>Synchronizing with database...</Text>
          </View>
        )}
      </View>

      {(pending > 0 || failed > 0) && (
        <View style={styles.actions}>
          {pending > 0 && onManualSync && (
            <Pressable 
              style={[styles.actionButton, styles.primaryButton]} 
              onPress={onManualSync}
              disabled={isSyncing}
            >
              <Text style={styles.primaryButtonText}>Sync Now</Text>
            </Pressable>
          )}
          
          {failed > 0 && onRetryFailed && (
            <Pressable 
              style={[styles.actionButton, styles.secondaryButton]} 
              onPress={onRetryFailed}
              disabled={isSyncing}
            >
              <Text style={styles.secondaryButtonText}>Retry Failed</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    ...theme.shadows?.sm,
  },
  compact: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
  },
  lastSync: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[600],
  },
  details: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  detailText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[700],
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  actionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    backgroundColor: theme.colors.white,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.neutral[300],
  },
  actionButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.neutral[700],
  },
  primaryButtonText: {
    color: theme.colors.white,
  },
  secondaryButtonText: {
    color: theme.colors.neutral[700],
  },
  statusText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
});
