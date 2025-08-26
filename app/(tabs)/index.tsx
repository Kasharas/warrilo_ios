import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Plus, Bell, Shield, TrendingUp, Calendar, DollarSign, Store, FileText } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { SummaryCard } from '@/src/components/SummaryCard';
import { DeviceCard } from '@/src/components/DeviceCard';
import { FabButton } from '@/src/components/FabButton';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Mock data - no more Supabase fetching
  const [devices] = useState<any[]>([]);
  const [totalValue] = useState(0);
  const [deviceCount] = useState(0);

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate refresh delay
    setTimeout(() => setLoading(false), 1000);
  };

  const handleAddDevice = () => {
    router.push('/add-device');
  };

  const handleDevicePress = (deviceId: string) => {
    router.push(`/device-details?id=${deviceId}`);
  };

  const handleDeleteDevice = (deviceId: string) => {
    Alert.alert(
      'Delete Device',
      'Are you sure you want to delete this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete device:', deviceId) }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary[600]]}
            tintColor={theme.colors.primary[600]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.email?.split('@')[0] || 'User'}!</Text>
            <Text style={styles.subtitle}>Manage your warranties and devices</Text>
          </View>
          <Pressable style={styles.notificationButton} onPress={() => router.push('/alerts')}>
            <Bell size={24} color={theme.colors.neutral[600]} />
          </Pressable>
        </View>

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <SummaryCard
            icon={Shield}
            title="Total Items"
            value={deviceCount.toString()}
            subtitle="Devices tracked"
            color={theme.colors.primary[500]}
          />
          <SummaryCard
            icon={DollarSign}
            title="Total Value"
            value={`$${totalValue.toLocaleString()}`}
            subtitle="Worth of items"
            color={theme.colors.success[500]}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <Pressable style={styles.quickActionCard} onPress={() => router.push('/add-device')}>
              <Plus size={24} color={theme.colors.primary[600]} />
              <Text style={styles.quickActionText}>Add Device</Text>
            </Pressable>
            <Pressable style={styles.quickActionCard} onPress={() => router.push('/alerts')}>
              <Bell size={24} color={theme.colors.warning[500]} />
              <Text style={styles.quickActionText}>View Alerts</Text>
            </Pressable>
            <Pressable style={styles.quickActionCard} onPress={() => router.push('/profile')}>
              <Store size={24} color={theme.colors.secondary[500]} />
              <Text style={styles.quickActionText}>Profile</Text>
            </Pressable>
            <Pressable style={styles.quickActionCard} onPress={() => router.push('/settings')}>
              <FileText size={24} color={theme.colors.neutral[500]} />
              <Text style={styles.quickActionText}>Settings</Text>
            </Pressable>
          </View>
        </View>

        {/* Recent Devices */}
        <View style={styles.recentDevicesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Devices</Text>
            <Pressable onPress={() => router.push('/devices')}>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>
          
          {devices.length === 0 ? (
            <View style={styles.emptyState}>
              <Shield size={48} color={theme.colors.neutral[400]} />
              <Text style={styles.emptyStateTitle}>No devices yet</Text>
              <Text style={styles.emptyStateSubtitle}>Add your first device to get started</Text>
              <Pressable style={styles.addFirstDeviceButton} onPress={handleAddDevice}>
                <Text style={styles.addFirstDeviceButtonText}>Add Your First Device</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.devicesList}>
              {devices.slice(0, 3).map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onPress={() => handleDevicePress(device.id)}
                  onDelete={() => handleDeleteDevice(device.id)}
                  compact
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <FabButton onPress={handleAddDevice} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
    marginTop: theme.spacing.lg,
  },
  greeting: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[900],
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
    marginTop: theme.spacing.xs,
  },
  notificationButton: {
    padding: theme.spacing.sm,
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  quickActionsSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: theme.spacing.md,
  },
  quickActionCard: {
    width: '45%', // Adjust as needed for two columns
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  quickActionText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.neutral[900],
    marginTop: theme.spacing.xs,
  },
  recentDevicesSection: {
    marginBottom: theme.spacing.lg,
  },
  devicesList: {
    gap: theme.spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  emptyStateTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[700],
    marginTop: theme.spacing.md,
  },
  emptyStateSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[500],
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  addFirstDeviceButton: {
    backgroundColor: theme.colors.primary[600],
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  addFirstDeviceButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
  },
  viewAllText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.fontWeight.medium,
  },
});