import React, { useState, useEffect } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
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
  const [devicesWithPrices, setDevicesWithPrices] = useState<LocalDevice[]>([]);
  const [isFocusRefresh, setIsFocusRefresh] = useState(false);
  
  // Get navigation parameters to detect device addition
  const params = useLocalSearchParams();

  const handleDevicePress = (deviceId: string) => {
    router.push(`/device-details?id=${deviceId}`);
  };

  // Phase 1: Load local data first (fast UI)
  useEffect(() => {
    loadDevices();
  }, []);

  // Additional refresh on mount to catch any new devices
  useEffect(() => {
    const refreshOnMount = async () => {
      console.log('🔄 Dashboard: Mount refresh - checking for new devices');
      await loadDevices();
    };
    refreshOnMount();
  }, []);

  // Detect navigation parameters indicating device addition
  useEffect(() => {
    console.log('🔍 Dashboard: Checking navigation parameters:', params);
    if (params.refresh === 'true') {
      console.log('🔄 Dashboard: Refresh parameter detected - device was added, refreshing immediately');
      console.log('🎯 FLOW TEST: Navigation parameter refresh triggered - should show new device');
      forceRefresh();
      // Clear the parameter to prevent repeated refreshes
      router.setParams({ refresh: undefined, timestamp: undefined });
    }
  }, [params.refresh, params.timestamp]);

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

  // Enhanced refresh: Also reload when sync status changes to catch new devices
  useEffect(() => {
    if (syncStatus.status === 'idle' && syncStatus.lastSyncTime) {
      console.log('🔄 Dashboard: Sync completed, refreshing devices to catch new additions');
      loadDevices();
    }
  }, [syncStatus.status, syncStatus.lastSyncTime]);

  // Enhanced focus refresh strategy with immediate refresh detection
  useFocusEffect(
    React.useCallback(() => {
      // Always refresh when gaining focus to catch new devices
      console.log('🔄 Dashboard: Focus detected - refreshing devices');
      console.log('🔍 FOCUS VERIFICATION: Dashboard screen gained focus, refresh triggered');
      console.log('🎯 FLOW TEST: Dashboard focus detected - should refresh after device addition');
      loadDevices();
    }, [])
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
      
      // Calculate total purchase value from actual device purchase prices
      const devicesWithValidPrices = localDevices.filter(device => 
        device.purchase_price && typeof device.purchase_price === 'number' && device.purchase_price > 0
      );
      
      const totalPurchaseValue = devicesWithValidPrices.reduce((total, device) => {
        return total + (device.purchase_price || 0);
      }, 0);
      
      console.log('🔍 DASHBOARD VERIFICATION: Total devices:', localDevices.length);
      console.log('🔍 DASHBOARD VERIFICATION: Devices with valid prices:', devicesWithValidPrices.length);
      console.log('🔍 DASHBOARD VERIFICATION: Purchase prices found:', devicesWithValidPrices.map(d => ({ name: d.name, price: d.purchase_price })));
      console.log('🔍 DASHBOARD VERIFICATION: Total purchase value calculated:', totalPurchaseValue);
      
      setTotalValue(totalPurchaseValue);
      setDevicesWithPrices(devicesWithValidPrices);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Force refresh function for immediate updates
  const forceRefresh = async () => {
    console.log('🔄 Dashboard: Force refresh triggered');
    console.log('🎯 FLOW TEST: Force refresh executing - should load new device from local storage');
    await loadDevices();
    console.log('✅ Dashboard: Force refresh completed');
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
                          colors={['#007AFF']}
              tintColor={'#007AFF'}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={styles.headerRight}>
            <Pressable style={styles.menuButton} onPress={() => router.push('/settings')}>
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
            </Pressable>
          </View>
        </View>

        {/* Total Purchase Value Card */}
        <View style={styles.warrantyValueCard}>
          <View style={styles.warrantyValueHeader}>
            <View style={styles.warrantyValueIconContainer}>
              <Text style={styles.warrantyValueIcon}>💰</Text>
            </View>
            <Text style={styles.warrantyValueTitle}>Total Purchase Value</Text>
          </View>
          <Text style={styles.warrantyValueAmount}>
            {totalValue > 0 ? `$${totalValue.toLocaleString()}` : 'No prices set'}
          </Text>
          <View style={styles.warrantyValueFooter}>
            <View style={styles.deviceCountBadge}>
              <Text style={styles.deviceCountText}>{deviceCount} devices</Text>
            </View>
            {devicesWithPrices.length !== deviceCount && (
              <View style={styles.priceCountBadge}>
                <Text style={styles.priceCountText}>{devicesWithPrices.length} with prices</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Warranty Alert */}
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <View style={styles.alertIconContainer}>
              <AlertTriangle size={24} color="#FF9500" />
            </View>
            <View style={styles.alertTitleContainer}>
              <Text style={styles.alertTitle}>Warranty Expiring Soon</Text>
              <Text style={styles.alertSubtitle}>Action Required</Text>
            </View>
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertMessage}>
              Your MacBook Pro warranty expires in 15 days
            </Text>
          </View>
          <View style={styles.alertActions}>
            <Pressable style={styles.alertButton}>
              <Eye size={18} color="#FFFFFF" />
              <Text style={styles.alertButtonText}>View Details</Text>
            </Pressable>
            <Pressable style={styles.alertButtonSecondary}>
              <Clock size={18} color="#FF9500" />
              <Text style={styles.alertButtonSecondaryText}>Remind Later</Text>
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
                    case 'success': return '#10b981'; // Same green as DeviceCard
                    case 'warning': return '#f59e0b'; // Same orange as DeviceCard
                    case 'error': return '#ef4444'; // Same red as DeviceCard
                    default: return '#6b7280'; // Same gray as DeviceCard
                  }
                };
                
                return (
                  <Pressable 
                    key={device.local_id || device.id || `device-${Math.random()}`} 
                    style={styles.deviceCard}
                    onPress={() => handleDevicePress(device.local_id || device.id)}
                  >
                    {/* Warranty Status Badge - Top Right Corner */}
                    <View style={[styles.warrantyBadge, { backgroundColor: getThemeColor(statusColor) }]}>
                      <Text style={styles.warrantyBadgeText}>{statusText}</Text>
                    </View>

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
                        <IconComponent size={24} color="#007AFF" />
                      </View>
                    )}
                    
                    <Text style={styles.deviceName}>{device.name}</Text>
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
    width: 32,
    height: 32,
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
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: iosSpacing.lg,
    elevation: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  warrantyValueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  warrantyValueIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  warrantyValueIcon: {
    fontSize: 18,
  },
  warrantyValueTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: iosFonts.system,
    fontWeight: iosFonts.medium,
    letterSpacing: 0.5,
  },
  warrantyValueAmount: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
    fontFamily: iosFonts.system,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  warrantyValueFooter: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  deviceCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  deviceCountText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: iosFonts.system,
  },
  priceCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  priceCountText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    fontFamily: iosFonts.system,
  },
  alertCard: {
    backgroundColor: '#FFF9E6',
    borderColor: '#FFE5B3',
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    marginBottom: iosSpacing.lg,
    elevation: 12,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  alertTitleContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9500',
    marginBottom: 4,
    fontFamily: iosFonts.system,
    letterSpacing: 0.3,
  },
  alertSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FF9500',
    opacity: 0.8,
    fontFamily: iosFonts.system,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  alertContent: {
    marginBottom: 20,
  },
  alertMessage: {
    fontSize: 15,
    color: '#8B4513',
    marginBottom: 16,
    fontFamily: iosFonts.system,
    fontWeight: '500',
    lineHeight: 22,
  },
  alertUrgencyBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  alertUrgencyText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: iosFonts.system,
    letterSpacing: 0.5,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
  },
  alertButton: {
    backgroundColor: '#FF9500',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
    minHeight: 44,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  alertButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF9500',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
    minHeight: 44,
  },
  alertButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: iosFonts.system,
    letterSpacing: 0.3,
  },
  alertButtonSecondaryText: {
    color: '#FF9500',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: iosFonts.system,
    letterSpacing: 0.3,
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
            color: '#007AFF',
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
    position: 'relative', // Needed for absolute positioning of the badge
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
  warrantyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
    zIndex: 1,
  },
  warrantyBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
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