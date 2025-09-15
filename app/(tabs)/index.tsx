import React, { useState, useEffect } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Icon components for different categories
const Smartphone = (props: any) => <Ionicons name="phone-portrait" {...props} />;
const Laptop = (props: any) => <Ionicons name="laptop" {...props} />;
const Watch = (props: any) => <Ionicons name="watch" {...props} />;
import { theme } from '@/src/styles/theme';

import { FabButton } from '@/src/components/FabButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSync } from '@/contexts/SyncContext';
import { useDeviceSync } from '@/src/hooks/useDeviceSync';
import { LocalDevice } from '@/src/lib/localStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';

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
  
  // Warranty alerts state
  const [warrantyAlerts, setWarrantyAlerts] = useState<any[]>([]);
  
  // Get navigation parameters to detect device addition
  const params = useLocalSearchParams();

  const handleDevicePress = (deviceId: string) => {
    router.push(`/device-details?id=${deviceId}`);
  };

  // Function to read warranty alerts from AsyncStorage
  const readWarrantyAlerts = async () => {
    try {
      console.log('📖 Dashboard: Reading warranty alerts from local storage...');
      const alertsData = await AsyncStorage.getItem('warranty_alerts');
      
      if (alertsData) {
        const alerts = JSON.parse(alertsData);
        console.log(`📖 Dashboard: Found ${alerts.length} warranty alerts in local storage`);
        return alerts;
      }
      
      console.log('📖 Dashboard: No warranty alerts found in local storage');
      return [];
    } catch (error) {
      console.error('📖 Dashboard: Error reading warranty alerts:', error);
      return [];
    }
  };

  // Function to filter current warranty alerts (same logic as alerts screen)
  const filterCurrentWarrantyAlerts = (alerts: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return alerts.filter(alert => {
      if (!alert.reminder_date) return false;
      
      const reminderDate = new Date(alert.reminder_date);
      const alertDate = new Date(
        reminderDate.getFullYear(), 
        reminderDate.getMonth(), 
        reminderDate.getDate()
      );
      
      console.log(`📖 Dashboard: Alert check: ${alert.reminder_date} <= ${today.toDateString()} = ${alertDate <= today}`);
      
      return alertDate <= today;
    });
  };

  // Function to get the most urgent warranty alert
  const getMostUrgentWarrantyAlert = () => {
    console.log(`📖 Dashboard: getMostUrgentWarrantyAlert called with ${warrantyAlerts?.length || 0} alerts`);
    
    if (!warrantyAlerts || warrantyAlerts.length === 0) {
      console.log('📖 Dashboard: No warranty alerts available');
      return null;
    }

    const urgentAlerts = filterCurrentWarrantyAlerts(warrantyAlerts);
    console.log(`📖 Dashboard: Filtered warranty alerts:`, urgentAlerts);

    // Sort by reminder date (most urgent first) and return the first one
    const sortedAlerts = urgentAlerts.sort((a, b) => 
      new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime()
    );

    const mostUrgent = sortedAlerts.length > 0 ? sortedAlerts[0] : null;
    console.log(`📖 Dashboard: Most urgent alert:`, mostUrgent);
    
    return mostUrgent;
  };

  // Function to get device name from device ID
  const getDeviceNameFromAlert = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId || d.local_id === deviceId);
    return device?.name || 'Unknown Device';
  };

  // Function to calculate days until warranty expires
  const getDaysUntilExpiry = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Phase 1: Load local data first (fast UI)
  useEffect(() => {
    loadDevices();
  }, []);

  // Function to load warranty alerts
  const loadWarrantyAlerts = async () => {
    try {
      console.log('📖 Dashboard: Loading warranty alerts...');
      const alerts = await readWarrantyAlerts();
      console.log(`📖 Dashboard: Loaded ${alerts.length} warranty alerts`);
      setWarrantyAlerts(alerts);
    } catch (error) {
      console.error('📖 Dashboard: Failed to load warranty alerts:', error);
    }
  };

  // Load warranty alerts when component mounts and when devices change
  useEffect(() => {
    loadWarrantyAlerts();
  }, []);

  // Reload warranty alerts when devices change (in case new alerts were created)
  useEffect(() => {
    if (devices.length > 0) {
      loadWarrantyAlerts();
    }
  }, [devices]);

  // Reload warranty alerts when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('📖 Dashboard: Screen focused - reloading warranty alerts');
      loadWarrantyAlerts();
    }, [])
  );

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
        return theme.colors.systemRed;
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
            colors={[theme.colors.systemBlue]}
            tintColor={theme.colors.systemBlue}
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
        
        {/* Warranty Alert - Dynamic */}
        {(() => {
          const urgentAlert = getMostUrgentWarrantyAlert();
          if (!urgentAlert) return null;

          const deviceName = getDeviceNameFromAlert(urgentAlert.device_id);
          const daysUntilExpiry = getDaysUntilExpiry(urgentAlert.warranty_expire_date);
          
          return (
            <View style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <View style={styles.alertIconContainer}>
                  <Ionicons name="warning" size={24} color={theme.colors.warning[500]} />
                </View>
                <View style={styles.alertTitleContainer}>
                  <Text style={styles.alertTitle}>Warranty Expiring Soon</Text>
                  <Text style={styles.alertSubtitle}>Action Required</Text>
                </View>
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertMessage}>
                  Your {deviceName} warranty expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.alertActions}>
                <Pressable 
                  style={styles.alertButton}
                  onPress={() => handleDevicePress(urgentAlert.device_id)}
                >
                  <Ionicons name="eye" size={18} color={theme.colors.white} />
                  <Text style={styles.alertButtonText}>View Details</Text>
                </Pressable>
              </View>
            </View>
          );
        })()}

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
                    case 'success': return theme.colors.success[500];
                    case 'warning': return theme.colors.warning[500];
                    case 'error': return theme.colors.systemRed;
                    default: return theme.colors.neutral[500];
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
                          resizeMode="contain"
                        />
                      </View>
                    ) : (
                      <View style={styles.deviceIconContainer}>
                        <IconComponent size={24} color={theme.colors.systemBlue} />
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
    backgroundColor: theme.colors.systemBackground,
    paddingHorizontal: theme.spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
    marginTop: theme.spacing.lg,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.fontSize.largeTitle,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.label,
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.systemBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLine: {
    width: 20,
    height: 2,
    backgroundColor: theme.colors.systemBackground,
    borderRadius: 1,
    marginVertical: 1,
  },
  syncIndicator: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  syncIdle: {
    backgroundColor: theme.colors.neutral[200],
  },
  syncSyncing: {
    backgroundColor: theme.colors.systemBlue,
  },
  syncSuccess: {
    backgroundColor: theme.colors.systemGreen,
  },
  syncError: {
    backgroundColor: theme.colors.systemRed,
  },
  syncStatusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.systemBackground,
  },
  warrantyValueCard: {
    backgroundColor: theme.colors.systemBlue,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    elevation: 8,
    shadowColor: theme.colors.systemBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  warrantyValueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
  },
  warrantyValueIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  warrantyValueIcon: {
    fontSize: theme.fontSize.lg,
  },
  warrantyValueTitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.whiteA90,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  warrantyValueAmount: {
    fontSize: theme.fontSize['5xl'],
    fontWeight: '800',
    color: theme.colors.white,
    marginBottom: 14,
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
    backgroundColor: theme.colors.whiteA20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  deviceCountText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.white,
    fontWeight: '600',
  },
  priceCountBadge: {
    backgroundColor: theme.colors.whiteA15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  priceCountText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.whiteA90,
    fontWeight: '500',
  },
  alertCard: {
    backgroundColor: theme.colors.warning[50],
    borderColor: theme.colors.warning[200],
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    elevation: 8,
    shadowColor: theme.colors.warning[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 11,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  alertIconContainer: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.warning[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
    shadowColor: theme.colors.warning[500],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  alertTitleContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.warning[500],
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  alertSubtitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: '500',
    color: theme.colors.warning[500],
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  alertContent: {
    marginBottom: 14,
  },
  alertMessage: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.warning[700],
    marginBottom: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  alertUrgencyBadge: {
    backgroundColor: theme.colors.warning[500],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
    shadowColor: theme.colors.warning[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  alertUrgencyText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.white,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
  },
  alertButton: {
    backgroundColor: theme.colors.warning[500],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 11,
    gap: 6,
    minHeight: 31,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  alertButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.warning[500],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.lg,
    gap: 8,
    minHeight: 44,
  },
  alertButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.white,
    letterSpacing: 0.3,
  },
  alertButtonSecondaryText: {
    color: theme.colors.warning[500],
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.label,
  },
  viewAllText: {
    fontSize: theme.fontSize.sm,
            color: theme.colors.systemBlue,
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
    backgroundColor: theme.colors.systemBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    elevation: 2,
    shadowColor: theme.colors.label,
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
    backgroundColor: theme.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  deviceImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.neutral[100],
  },
  deviceImage: {
    width: '100%',
    height: '100%',
  },
  deviceName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.label,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  deviceStatus: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    marginBottom: theme.spacing.xs,
  },
  warrantyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    minWidth: 60,
    alignItems: 'center',
    zIndex: 1,
  },
  warrantyBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxxl,
    marginBottom: 120, // Space for FAB and tab bar
  },
  emptyStateTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing.sm,
  },
  emptyStateSubtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[500],
    textAlign: 'center',
    fontWeight: theme.fontWeight.normal,
  },
});