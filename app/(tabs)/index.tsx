import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Plus, Eye, Clock, Smartphone, Laptop, Watch, Headphones, AlertTriangle } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { FabButton } from '@/src/components/FabButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useDeviceSync } from '@/src/hooks/useDeviceSync';
import { LocalDevice } from '@/src/lib/localStorage';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { getLocalDevices } = useDeviceSync();
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<LocalDevice[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [deviceCount, setDeviceCount] = useState(0);

  const handleDevicePress = (deviceId: string) => {
    router.push(`/device-details?id=${deviceId}`);
  };

  // Load devices from local storage
  useEffect(() => {
    loadDevices();
  }, []);



  const loadDevices = async () => {
    try {
      setLoading(true);
      const localDevices = await getLocalDevices();
      console.log('Loaded devices:', localDevices);
      console.log('Device count:', localDevices.length);
      
      setDevices(localDevices);
      setDeviceCount(localDevices.length);
      
      // Calculate total warranty value (mock calculation for now)
      // In a real app, you'd sum up actual purchase prices
      const mockTotalValue = localDevices.length * 500; // $500 per device average
      setTotalValue(mockTotalValue);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDevices();
  };

  const getStatusColor = (statusColor: string) => {
    switch (statusColor) {
      case 'success':
        return theme.colors.success[600];
      case 'warning':
        return theme.colors.warning[600];
      case 'error':
        return theme.colors.error[600];
      default:
        return theme.colors.neutral[600];
    }
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
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Pressable style={styles.menuButton} onPress={() => router.push('/settings')}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </Pressable>
        </View>

        {/* Total Warranty Value Card */}
        <View style={styles.warrantyValueCard}>
          <Text style={styles.warrantyValueTitle}>Total Warranty Value</Text>
          <Text style={styles.warrantyValueAmount}>${totalValue.toLocaleString()}</Text>
          <Text style={styles.warrantyValueSubtitle}>{deviceCount} active warranties</Text>
        </View>
        
        {/* Warranty Alert */}
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <AlertTriangle size={20} color={theme.colors.warning[600]} />
            <Text style={styles.alertTitle}>Warranty Expiring Soon</Text>
          </View>
          <Text style={styles.alertMessage}>
            Your MacBook Pro warranty expires in 15 days
          </Text>
          <View style={styles.alertActions}>
            <Pressable style={styles.alertButton}>
              <Eye size={16} color={theme.colors.white} />
              <Text style={styles.alertButtonText}>View Details</Text>
            </Pressable>
            <Pressable style={[styles.alertButton, styles.alertButtonSecondary]}>
              <Clock size={16} color={theme.colors.warning[600]} />
              <Text style={[styles.alertButtonText, styles.alertButtonSecondaryText]}>
                Remind Later
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Recent Devices Section */}
        {devices.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Devices</Text>
              <Pressable onPress={() => router.push('/devices')}>
                <Text style={styles.viewAllText}>View All</Text>
              </Pressable>
            </View>
            
            <View style={styles.deviceGrid}>
              {devices.slice(0, 4).filter(device => device && device.name).map((device) => {
                const getIconComponent = (category?: string) => {
                  switch (category?.toLowerCase()) {
                    case 'electronics': return Smartphone;
                    case 'automotive': return Laptop;
                    case 'clothing':
                    case 'cloth': return Watch;
                    default: return Smartphone;
                  }
                };
                
                const getStatusColor = (device: LocalDevice) => {
                  if (!device.warranty_end_date) return 'neutral';
                  
                  const endDate = new Date(device.warranty_end_date);
                  const today = new Date();
                  const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  if (daysUntilExpiry < 0) return 'error'; // Expired
                  if (daysUntilExpiry <= 30) return 'warning'; // Expiring soon
                  return 'success'; // Active
                };
                
                const getStatusText = (device: LocalDevice) => {
                  if (!device.warranty_end_date) return 'Unknown';
                  
                  const endDate = new Date(device.warranty_end_date);
                  const today = new Date();
                  const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  if (daysUntilExpiry < 0) return 'Expired';
                  if (daysUntilExpiry <= 30) return 'Expiring';
                  return 'Active';
                };
                
                const IconComponent = getIconComponent(device.category);
                const statusColor = getStatusColor(device);
                const statusText = getStatusText(device);
                
                // Map status color to theme color
                const getThemeColor = (status: string) => {
                  switch (status) {
                    case 'success': return theme.colors.success[600];
                    case 'warning': return theme.colors.warning[600];
                    case 'error': return theme.colors.error[600];
                    default: return theme.colors.neutral[600];
                  }
                };
                
                return (
                  <Pressable 
                    key={device.local_id || device.id || `device-${Math.random()}`} 
                    style={styles.deviceCard}
                    onPress={() => handleDevicePress(device.local_id || device.id)}
                  >
                    <View style={styles.deviceIconContainer}>
                      <IconComponent size={24} color={theme.colors.primary[500]} />
                    </View>
                    <Text style={styles.deviceName}>{device.name}</Text>
                    <Text style={[styles.deviceStatus, { color: getThemeColor(statusColor) }]}>
                      {statusText}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
        
        {/* Empty State */}
        {devices.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No devices yet</Text>
            <Text style={styles.emptyStateSubtitle}>Add your first device to get started</Text>
          </View>
        )}
      </ScrollView>

      <FabButton onPress={() => router.push('/add-device')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
    marginTop: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[900],
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLine: {
    width: 20,
    height: 2,
    backgroundColor: theme.colors.white,
    borderRadius: 1,
    marginVertical: 1,
  },
  warrantyValueCard: {
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing['2xl'],
    marginBottom: theme.spacing.lg,
    elevation: 3,
  },
  warrantyValueTitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.white,
    opacity: 0.9,
    marginBottom: theme.spacing.sm,
  },
  warrantyValueAmount: {
    fontSize: theme.fontSize['4xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  warrantyValueSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.8,
  },
  alertCard: {
    backgroundColor: '#fef3c7',
    borderColor: theme.colors.warning[500],
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  alertTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: '#92400e',
    marginLeft: theme.spacing.sm,
  },
  alertMessage: {
    fontSize: theme.fontSize.sm,
    color: '#92400e',
    marginBottom: theme.spacing.md,
  },
  alertActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  alertButton: {
    backgroundColor: theme.colors.warning[500],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  alertButtonSecondary: {
    backgroundColor: 'transparent',
  },
  alertButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
  },
  alertButtonSecondaryText: {
    color: theme.colors.warning[600],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
  },
  viewAllText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.fontWeight.medium,
  },
  deviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
    marginBottom: 120, // Space for FAB and tab bar
    paddingBottom: theme.spacing.xl,
  },
  deviceCard: {
    width: '48%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  deviceName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  deviceStatus: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['3xl'],
    marginBottom: 120, // Space for FAB and tab bar
  },
  emptyStateTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing.sm,
  },
  emptyStateSubtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[500],
    textAlign: 'center',
  },
});