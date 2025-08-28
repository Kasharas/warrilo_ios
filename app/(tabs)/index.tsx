import React, { useState, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Image } from 'react-native';
import { Plus, Eye, Clock, Smartphone, Laptop, Watch, Headphones, AlertTriangle } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { iosFonts, iosColors, iosSpacing, iosRadius } from '@/src/styles/iosDesignSystem';
import { FabButton } from '@/src/components/FabButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSync } from '@/contexts/SyncContext';
import { useDeviceSync } from '@/src/hooks/useDeviceSync';
import { LocalDevice } from '@/src/lib/localStorage';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, syncReady } = useAuth();
  const { syncStatus, triggerSync } = useSync(); // NEW: Use sync context instead of local state
  const { getLocalDevices } = useDeviceSync();
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<LocalDevice[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [deviceCount, setDeviceCount] = useState(0);
  const [isFocusRefresh, setIsFocusRefresh] = useState(false);

  const handleDevicePress = (deviceId: string) => {
    router.push(`/device-details?id=${deviceId}`);
  };

  // Phase 1: Load local data first (fast UI)
  useEffect(() => {
    loadDevices();
  }, []);

  // Phase 2: Trigger sync when ready
  useEffect(() => {
    if (user && syncReady && syncStatus.status === 'idle') {
      console.log('=== PHASE 2: SYNC READY ===');
      console.log('User:', user.id, 'SyncReady:', syncReady, 'Status:', syncStatus.status);
      triggerSync();
    }
  }, [user, syncReady, syncStatus.status, triggerSync]);

  // Phase 3: Reload devices after successful sync
  useEffect(() => {
    if (syncStatus.status === 'success' && syncStatus.operationsCompleted > 0) {
      console.log('=== PHASE 3: SYNC SUCCESS ===');
      console.log('Operations completed:', syncStatus.operationsCompleted);
      loadDevices(); // Reload to show updated data
    }
  }, [syncStatus.status, syncStatus.operationsCompleted]);

  // Safe focus refresh strategy
  useFocusEffect(
    React.useCallback(() => {
      // Only refresh if we're coming back from another screen
      if (isFocusRefresh) {
        console.log('🔄 Dashboard: Focus refresh triggered');
        console.log('🔍 FOCUS VERIFICATION: Dashboard screen gained focus, refresh triggered');
        console.log('🎯 FLOW TEST: Dashboard focus detected - should refresh after delete');
        loadDevices();
      } else {
        console.log('ℹ️ Dashboard: Initial focus, skipping refresh');
        setIsFocusRefresh(true);
      }
    }, [isFocusRefresh])
  );



  const loadDevices = async () => {
    try {
      console.log('📱 Dashboard: Loading devices from storage...');
      console.log('🎯 FLOW TEST: Dashboard data reload - checking for deleted device');
      setLoading(true);
      const localDevices = await getLocalDevices();
      console.log('Loaded devices:', localDevices);
      console.log('Device count:', localDevices.length);
      
      setDevices(localDevices);
      setDeviceCount(localDevices.length);
      
      console.log(`✅ Dashboard: Loaded ${localDevices.length} devices`);
      
      // Verification: Check state update and device details
      console.log('🔍 DASHBOARD VERIFICATION: State updated with', localDevices.length, 'devices');
      if (localDevices.length === 0) {
        console.log('ℹ️ DASHBOARD VERIFICATION: No devices found - showing empty state');
      } else {
        console.log('📋 DASHBOARD VERIFICATION: Device names:', localDevices.map(d => d.name));
      }
      
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
            colors={[iosColors.systemBlue]}
            tintColor={iosColors.systemBlue}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={styles.headerRight}>
            {/* NEW: Sync Status Indicator */}
            <View style={[styles.syncIndicator, styles[`sync${syncStatus.status.charAt(0).toUpperCase() + syncStatus.status.slice(1)}`]]}>
              <Text style={styles.syncStatusText}>
                {syncStatus.status === 'syncing' ? 'Syncing...' : 
                 syncStatus.status === 'success' ? '✓ Synced' : 
                 syncStatus.status === 'error' ? '⚠ Error' : 'Ready'}
              </Text>
            </View>
            <Pressable style={styles.menuButton} onPress={() => router.push('/settings')}>
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
            </Pressable>
          </View>
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

        {/* All Devices Section */}
        {devices.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Devices ({devices.length})</Text>
              <Pressable onPress={() => router.push('/devices')}>
                <Text style={styles.viewAllText}>View All</Text>
              </Pressable>
            </View>
            
            <View style={styles.deviceGrid}>
              {devices.filter(device => device && device.name).map((device) => {
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
                
                // Map status color to iOS system colors
                const getThemeColor = (status: string) => {
                  switch (status) {
                    case 'success': return iosColors.systemGreen;
                    case 'warning': return iosColors.systemOrange;
                    case 'error': return iosColors.systemRed;
                    default: return iosColors.systemGray;
                  }
                };
                
                return (
                  <Pressable 
                    key={device.local_id || device.id || `device-${Math.random()}`} 
                    style={styles.deviceCard}
                    onPress={() => handleDevicePress(device.local_id || device.id)}
                  >
                    {/* Device Image or Icon */}
                    {device.photo_irl ? (
                      <View style={styles.deviceImageContainer}>
                        <Image 
                          source={{ uri: device.photo_irl }} 
                          style={styles.deviceImage}
                          resizeMode="cover"
                        />
                      </View>
                    ) : (
                      <View style={styles.deviceIconContainer}>
                        <IconComponent size={24} color={iosColors.systemBlue} />
                      </View>
                    )}
                    
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
    backgroundColor: iosColors.systemBackground,
    paddingHorizontal: iosSpacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: iosSpacing.xxxl,
    marginTop: iosSpacing.lg,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosSpacing.md,
  },
  headerTitle: {
    fontSize: iosFonts.largeTitle,
    fontWeight: iosFonts.bold,
    color: iosColors.label,
    fontFamily: iosFonts.system,
  },
  menuButton: {
    width: iosSpacing.minTouch,
    height: iosSpacing.minTouch,
    borderRadius: iosRadius.md,
    backgroundColor: iosColors.systemBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLine: {
    width: 20,
    height: 2,
    backgroundColor: iosColors.systemBackground,
    borderRadius: 1,
    marginVertical: 1,
  },
  syncIndicator: {
    paddingHorizontal: iosSpacing.sm,
    paddingVertical: iosSpacing.xs,
    borderRadius: iosRadius.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  syncIdle: {
    backgroundColor: iosColors.systemGray5,
  },
  syncSyncing: {
    backgroundColor: iosColors.systemBlue,
  },
  syncSuccess: {
    backgroundColor: iosColors.systemGreen,
  },
  syncError: {
    backgroundColor: iosColors.systemRed,
  },
  syncStatusText: {
    fontSize: iosFonts.caption2,
    fontWeight: iosFonts.medium,
    color: iosColors.systemBackground,
    fontFamily: iosFonts.system,
  },
  warrantyValueCard: {
    backgroundColor: iosColors.systemBlue,
    borderRadius: iosRadius.xl,
    padding: iosSpacing.xxxl,
    marginBottom: iosSpacing.lg,
    elevation: 3,
    shadowColor: iosColors.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  warrantyValueTitle: {
    fontSize: iosFonts.callout,
    color: iosColors.systemBackground,
    opacity: 0.9,
    marginBottom: iosSpacing.sm,
    fontFamily: iosFonts.system,
    fontWeight: iosFonts.medium,
  },
  warrantyValueAmount: {
    fontSize: iosFonts.largeTitle,
    fontWeight: iosFonts.bold,
    color: iosColors.systemBackground,
    marginBottom: iosSpacing.xs,
    fontFamily: iosFonts.system,
  },
  warrantyValueSubtitle: {
    fontSize: iosFonts.footnote,
    color: iosColors.systemBackground,
    opacity: 0.8,
    fontFamily: iosFonts.system,
    fontWeight: iosFonts.regular,
  },
  alertCard: {
    backgroundColor: iosColors.systemYellow,
    borderColor: iosColors.systemOrange,
    borderWidth: 1,
    borderRadius: iosRadius.md,
    padding: iosSpacing.lg,
    marginBottom: iosSpacing.lg,
    elevation: 3,
    shadowColor: iosColors.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: iosSpacing.sm,
  },
  alertTitle: {
    fontSize: iosFonts.callout,
    fontWeight: iosFonts.semibold,
    color: iosColors.systemOrange,
    marginLeft: iosSpacing.sm,
    fontFamily: iosFonts.system,
  },
  alertMessage: {
    fontSize: iosFonts.footnote,
    color: iosColors.systemOrange,
    marginBottom: iosSpacing.md,
    fontFamily: iosFonts.system,
    fontWeight: iosFonts.regular,
  },
  alertActions: {
    flexDirection: 'row',
    gap: iosSpacing.sm,
  },
  alertButton: {
    backgroundColor: iosColors.systemOrange,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: iosSpacing.lg,
    paddingVertical: iosSpacing.sm,
    borderRadius: iosRadius.sm,
    gap: iosSpacing.xs,
    minHeight: iosSpacing.minTouch,
  },
  alertButtonSecondary: {
    backgroundColor: 'transparent',
  },
  alertButtonText: {
    fontSize: iosFonts.footnote,
    fontWeight: iosFonts.medium,
    color: iosColors.systemBackground,
    fontFamily: iosFonts.system,
  },
  alertButtonSecondaryText: {
    color: iosColors.systemOrange,
    fontFamily: iosFonts.system,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: iosSpacing.lg,
  },
  sectionTitle: {
    fontSize: iosFonts.title3,
    fontWeight: iosFonts.semibold,
    color: iosColors.label,
    fontFamily: iosFonts.system,
  },
  viewAllText: {
    fontSize: iosFonts.footnote,
    color: iosColors.systemBlue,
    fontWeight: iosFonts.medium,
    fontFamily: iosFonts.system,
  },
  deviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: iosSpacing.md,
    justifyContent: 'space-between',
    marginBottom: 120, // Space for FAB and tab bar
    paddingBottom: iosSpacing.xl,
  },
  deviceCard: {
    width: '48%',
    backgroundColor: iosColors.systemBackground,
    borderRadius: iosRadius.lg,
    padding: iosSpacing.lg,
    alignItems: 'center',
    elevation: 2,
    shadowColor: iosColors.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    minHeight: 160, // Ensure consistent card height
  },
  deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: iosColors.systemGray6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: iosSpacing.md,
  },
  deviceImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: iosRadius.md,
    overflow: 'hidden',
    marginBottom: iosSpacing.md,
    backgroundColor: iosColors.systemGray6,
  },
  deviceImage: {
    width: '100%',
    height: '100%',
  },
  deviceName: {
    fontSize: iosFonts.headline,
    fontWeight: iosFonts.semibold,
    color: iosColors.label,
    textAlign: 'center',
    marginBottom: iosSpacing.xs,
    fontFamily: iosFonts.system,
  },
  deviceStatus: {
    fontSize: iosFonts.footnote,
    fontWeight: iosFonts.medium,
    marginBottom: iosSpacing.xs,
    fontFamily: iosFonts.system,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: iosSpacing.xxxl,
    marginBottom: 120, // Space for FAB and tab bar
  },
  emptyStateTitle: {
    fontSize: iosFonts.title3,
    fontWeight: iosFonts.semibold,
    color: iosColors.secondaryLabel,
    marginBottom: iosSpacing.sm,
    fontFamily: iosFonts.system,
  },
  emptyStateSubtitle: {
    fontSize: iosFonts.callout,
    color: iosColors.placeholderText,
    textAlign: 'center',
    fontFamily: iosFonts.system,
    fontWeight: iosFonts.regular,
  },
});