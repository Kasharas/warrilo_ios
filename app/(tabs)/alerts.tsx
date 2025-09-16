import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, Pressable, ActivityIndicator, TextInput, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/src/styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';


import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useDeviceSync } from '@/src/hooks/useDeviceSync';
import { warrantyAlertService } from '@/src/services/warrantyAlertService';

export default function AlertsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { getLocalDevices } = useDeviceSync();
  
  // Mock data - no alerts yet
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // Filters removed
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [deleting, setDeleting] = useState(false);


  // Add inside AlertsScreen component, at the top after existing state
  const [warrantyAlerts, setWarrantyAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [warrantyAlertsError, setWarrantyAlertsError] = useState(null);
  const [deviceIdToName, setDeviceIdToName] = useState<Record<string, string>>({});

  // Add inside AlertsScreen component after state declarations
  // Move loadWarrantyAlerts outside useFocusEffect so it can be called by confirmDelete
  const loadWarrantyAlerts = useCallback(async () => {
    console.log('🔴 DEBUG: loadWarrantyAlerts called');
    setLoadingAlerts(true);
    setWarrantyAlertsError(null);
    try {
      console.log('🔴 DEBUG: Starting device mapping...');
      // Load devices and build id -> name map
      let deviceMap: Record<string, string> = {};
      try {
        const devices = await getLocalDevices();
        console.log('🔴 DEBUG: Retrieved devices:', devices.length);
        devices.forEach((d: any) => {
          if (d?.id) deviceMap[d.id] = d.name || 'Unknown device';
          if ((d as any)?.local_id) deviceMap[(d as any).local_id] = d.name || 'Unknown device';
        });
        setDeviceIdToName(deviceMap);
        console.log('🔍 Alerts: Device mapping built:', deviceMap);
      } catch (e) {
        // Non-fatal; alerts can still render
        console.log('Alerts: Failed to load devices for name mapping', e);
      }

      console.log('🔴 DEBUG: Reading warranty alerts...');
      const alerts = await readWarrantyAlerts();
      console.log('🔴 DEBUG: Retrieved alerts:', alerts.length);
      
      // Enrich ALL alerts with device_name (don't filter here - let getLatestWarrantyAlertsByDevice handle filtering)
      const enriched = alerts.map((a: any) => ({
        ...a,
        device_name: a.device_name || a.deviceName || deviceMap[a.device_id || a.deviceId] || 'Unknown device',
      }));
      console.log('🔍 Alerts: Enriched alerts with device names:', enriched);
      setWarrantyAlerts(enriched);
      console.log('🔴 DEBUG: loadWarrantyAlerts completed successfully');
    } catch (error) {
      console.error('Failed to load warranty alerts:', error);
      console.log('🔴 DEBUG: loadWarrantyAlerts error:', error.message, error.stack);
      setWarrantyAlertsError('Failed to load warranty alerts');
    } finally {
      console.log('🔴 DEBUG: Setting loadingAlerts to false');
      setLoadingAlerts(false);
    }
  }, [getLocalDevices]);

  useFocusEffect(
    useCallback(() => {
      loadWarrantyAlerts();
    }, [loadWarrantyAlerts])
  );

  // Add this function inside AlertsScreen component (don't call it yet)
  const readWarrantyAlerts = async () => {
    try {
      console.log('🔴 DEBUG: readWarrantyAlerts called');
      console.log('📖 Reading warranty alerts from local storage...');
      const alertsData = await AsyncStorage.getItem('warranty_alerts');
      console.log('🔴 DEBUG: AsyncStorage.getItem result:', alertsData ? 'data exists' : 'no data');
      
      if (alertsData) {
        const alerts = JSON.parse(alertsData);
        console.log(`Found ${alerts.length} warranty alerts in local storage`);
        console.log('🔴 DEBUG: Parsed alerts:', alerts);
        return alerts;
      }
      
      console.log('No warranty alerts found in local storage');
      console.log('🔴 DEBUG: Returning empty array');
      return [];
    } catch (error) {
      console.error('Error reading warranty alerts:', error);
      console.log('🔴 DEBUG: readWarrantyAlerts error:', error.message, error.stack);
      return [];
    }
  };

  // Date filtering is now handled inside getLatestWarrantyAlertsByDevice

  // Keep only the latest alert per device_id (by reminder_date) that is due today or in the past
  const getLatestWarrantyAlertsByDevice = (alerts) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const deviceIdToLatest = new Map();
    for (const alert of alerts) {
      const key = alert.device_id || alert.deviceId;
      if (!key) continue;
      
      // Check if alert is due (reminder_date <= today)
      if (!alert.reminder_date) continue;
      
      const reminderDate = new Date(alert.reminder_date);
      const alertDate = new Date(
        reminderDate.getFullYear(), 
        reminderDate.getMonth(), 
        reminderDate.getDate()
      );
      
      // Only consider alerts that are due today or in the past
      if (alertDate > today) continue;
      
      const existing = deviceIdToLatest.get(key);
      const currentDate = alert.reminder_date ? new Date(alert.reminder_date) : new Date(0);
      const existingDate = existing && existing.reminder_date ? new Date(existing.reminder_date) : new Date(0);
      
      // Keep the most recent alert that's due for each device
      if (!existing || currentDate > existingDate) {
        deviceIdToLatest.set(key, alert);
      }
    }
    
    console.log(`🔍 getLatestWarrantyAlertsByDevice called with alerts: ${alerts.length}`);
    console.log(`🔍 Alert device IDs:`, alerts.map(a => ({ device_id: a.device_id, device_name: a.device_name })));
    console.log(`🔍 getLatestWarrantyAlertsByDevice result: ${deviceIdToLatest.size} alerts`);
    console.log(`🔍 Result device IDs:`, Array.from(deviceIdToLatest.values()).map(a => ({ device_id: a.device_id, device_name: a.device_name })));
    
    // Return most recent first
    return Array.from(deviceIdToLatest.values()).sort((a, b) => {
      const da = a.reminder_date ? new Date(a.reminder_date).getTime() : 0;
      const db = b.reminder_date ? new Date(b.reminder_date).getTime() : 0;
      return db - da;
    });
  };

  // Add inside AlertsScreen component
  const renderWarrantyAlert = (alert, index) => (
    <View key={`warranty-${index}`} style={styles.notificationItem}>
      <Pressable 
        style={styles.notificationContentWrapper}
        onPress={() => {
          console.log('Warranty alert pressed, navigating to device details for device_id:', alert.device_id);
          router.push({
            pathname: '/device-details',
            params: { deviceId: alert.device_id }
          });
        }}
      >
        <View style={[styles.notificationIcon, { backgroundColor: '#f59e0b' }]}>
          <Text style={{ color: 'white', fontSize: theme.fontSize.lg }}>!</Text>
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>🚨 Warranty Alert</Text>
          {(() => {
            const deviceName = alert.device_name || alert.deviceName || 'Unknown device';
            return (
              <Text style={styles.notificationMessage}>{deviceName}</Text>
            );
          })()}
          <Text style={[styles.notificationTime, { color: theme.colors.systemRed, fontWeight: 'bold' }]}>
            Expires: {alert.warranty_expire_date ? new Date(alert.warranty_expire_date).toLocaleDateString() : 'Unknown'}
          </Text>
        </View>
      </Pressable>
      <Pressable 
        style={styles.alertDeleteButton}
        onPress={() => handleDeleteAlert(alert)}
      >
        <Text style={styles.alertDeleteButtonText}>Delete</Text>
      </Pressable>
    </View>
  );

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate refresh delay
    setTimeout(() => setLoading(false), 1000);
  };

  const handleDeleteAlert = (alert) => {
    setSelectedAlert(alert);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedAlert) return;
    
    setDeleting(true);
    
    try {
      // Delete from Supabase first
      await warrantyAlertService.deleteAlertsByDeviceId(selectedAlert.device_id);
      
      // Only delete from local storage if Supabase deletion succeeded
      const alertsData = await AsyncStorage.getItem('warranty_alerts');
      if (alertsData) {
        const alerts = JSON.parse(alertsData);
        const filteredAlerts = alerts.filter(a => a.device_id !== selectedAlert.device_id);
        await AsyncStorage.setItem('warranty_alerts', JSON.stringify(filteredAlerts));
      }
      
      // Refresh the alerts list
      await loadWarrantyAlerts();
      
      console.log('✅ Successfully deleted warranty alerts for device:', selectedAlert.device_id);
    } catch (error) {
      console.error('❌ Error deleting warranty alerts:', error);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setSelectedAlert(null);
    }
  };

  const cancelDelete = () => {
    if (deleting) return;
    setShowDeleteModal(false);
    setSelectedAlert(null);
  };

  const filters = [
    { label: 'All', count: alerts.length },
    { label: 'Expired warranty', count: alerts.filter(a => a.type === 'expired_warranty').length },
    { label: 'Expire soon', count: alerts.filter(a => a.type === 'expire_soon').length },
  ];

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    if (selectedFilter === 'Expired warranty') {
      matchesFilter = alert.type === 'expired_warranty';
    } else if (selectedFilter === 'Expire soon') {
      matchesFilter = alert.type === 'expire_soon';
    }
    // 'All' filter matches everything
    
    return matchesSearch && matchesFilter;
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'expired_warranty':
        return <Ionicons name="warning" size={20} color={theme.colors.systemRed} />;
      case 'expire_soon':
        return <Ionicons name="time" size={20} color={theme.colors.warning[500]} />;
      default:
        return <Ionicons name="notifications" size={20} color={theme.colors.neutral[500]} />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'expired_warranty':
        return theme.colors.systemRed;
      case 'expire_soon':
        return theme.colors.warning[100];
      default:
        return theme.colors.neutral[100];
    }
  };

  // Show loading only when initially loading and no alerts
  if (loading && alerts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.systemBlue} />
        <Text style={styles.loadingText}>Loading alerts...</Text>
      </View>
    );
  }

  // Show error only when there's an error and no alerts
  if (error && alerts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{error}</Text>
        <Text style={styles.emptySubtext}>Please try again later.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        <View style={styles.headerRight}>
          <Pressable style={styles.menuButton} onPress={() => router.push({
            pathname: '/settings',
            params: { fromScreen: 'alerts' }
          })}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </Pressable>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[
        styles.searchContainer,
        isSearchFocused && styles.searchContainerFocused
      ]}>
        <Ionicons name="search" size={20} color={theme.colors.neutral[400]} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search alerts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.neutral[400]}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
        />
      </View>

      {/* Filters removed */}

      {/* Content Area - Show alerts list or empty state */}
      {warrantyAlerts.length === 0 && filteredAlerts.length === 0 ? (
        // Empty state within the main layout
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications" size={64} color={theme.colors.neutral[300]} />
          <Text style={styles.emptyText}>No alerts found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery || selectedFilter !== 'All' 
              ? 'Try adjusting your search or filters' 
              : 'You\'re all caught up! No alerts at the moment.'}
          </Text>
        </View>
      ) : (
        // Alerts List
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.alertsListContent}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              colors={[theme.colors.systemBlue]}
              tintColor={theme.colors.systemBlue}
            />
          }
        >
          {/* NEW: Add warranty alerts first (latest per device) */}
          {getLatestWarrantyAlertsByDevice(warrantyAlerts).map((alert, index) => renderWarrantyAlert(alert, index))}
          
          {/* Loading indicator for warranty alerts */}
          {loadingAlerts && (
            <View style={{
              padding: theme.spacing.md,
              alignItems: 'center',
              backgroundColor: '#f9fafb',
              borderRadius: 12,
              marginBottom: 12
            }}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={{ marginTop: 8, color: theme.colors.neutral[500], fontSize: theme.fontSize.sm }}>
                Loading warranty alerts...
              </Text>
            </View>
          )}

          {/* Empty state for warranty alerts */}
          {!loadingAlerts && warrantyAlerts.length === 0 && !warrantyAlertsError && (
            <View style={{
              padding: theme.spacing.md,
              alignItems: 'center',
              backgroundColor: '#f0f9ff',
              borderRadius: 12,
              marginBottom: 12
            }}>
              <Text style={{ color: theme.colors.secondary[700], fontSize: theme.fontSize.sm, textAlign: 'center' }}>
                No warranty alerts at this time
              </Text>
            </View>
          )}

          {/* Error display for warranty alerts */}
          {warrantyAlertsError && (
            <View style={{
              padding: theme.spacing.md,
              backgroundColor: '#fef2f2',
              borderRadius: 12,
              marginBottom: 12
            }}>
              <Text style={{ color: theme.colors.systemRed, fontSize: theme.fontSize.sm, textAlign: 'center' }}>
                {warrantyAlertsError}
              </Text>
            </View>
          )}

          {/* EXISTING: Keep all existing static notification items below */}
          {alerts.map((item) => (
            <View key={item.id} style={[styles.alertCard, { backgroundColor: getAlertColor(item.type) }]}>
              <View style={styles.alertHeader}>
                {getAlertIcon(item.type)}
                <Text style={styles.alertType}>{item.type.replace('_', ' ').toUpperCase()}</Text>
                <Text style={styles.alertDate}>{item.date}</Text>
              </View>
              <Text style={styles.alertTitle}>{item.title}</Text>
              <Text style={styles.alertMessage}>{item.message}</Text>
              {item.action && (
                <Pressable style={styles.alertAction}>
                  <Text style={styles.alertActionText}>{item.action}</Text>
                </Pressable>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleting) {
            setShowDeleteModal(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Deletion</Text>
            <Text style={styles.modalMessage}>
              Are you absolutely sure you want to delete this warranty alert? This action cannot be undone and all warranty alerts for this device will be permanently lost.
            </Text>
            <View style={styles.modalButtons}>
              <Pressable 
                style={[styles.modalButton, styles.modalButtonCancel]} 
                onPress={cancelDelete}
                disabled={deleting}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.label }]}>No</Text>
              </Pressable>
              <Pressable 
                style={[
                  styles.modalButton, 
                  styles.modalButtonConfirm,
                  deleting && styles.modalButtonDisabled
                ]} 
                onPress={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <View style={styles.loadingButtonContent}>
                    <ActivityIndicator size="small" color={theme.colors.systemBackground} />
                    <Text style={[styles.modalButtonText, { marginLeft: 8, color: theme.colors.white }]}>Deleting...</Text>
                  </View>
                ) : (
                  <Text style={[styles.modalButtonText, { color: theme.colors.white }]}>Yes</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
    marginTop: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.fontSize.largeTitle,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.label,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    marginHorizontal: 0,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    ...theme.shadows.sm,
  },
  searchContainerFocused: {
    borderWidth: 2,
    borderColor: theme.colors.neutral[900],
  },
  searchIcon: {
    marginLeft: theme.spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[900],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  filtersContainer: {
    marginBottom: theme.spacing.lg,
    marginTop: -4,
    height: 40, // Fixed height for consistent layout
    justifyContent: 'center', // Center filters vertically
    // No padding or margins - let it fill the full container width
  },
  filtersContent: {
    gap: theme.spacing.sm,
    paddingHorizontal: 0,
  },
  filterChip: {
    backgroundColor: 'white',
    borderRadius: 18,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    height: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  filterChipActive: {
    backgroundColor: theme.colors.systemBlue,
    shadowColor: theme.colors.systemBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  filterChipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[500],
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  alertsListContent: {
    paddingBottom: 100,
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  loadingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[600],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
    flex: 1,
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[500],
    textAlign: 'center',
  },
  alertCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  alertType: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[700],
    flex: 1,
  },
  alertDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.neutral[500],
  },
  alertTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.sm,
  },
  alertMessage: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  alertAction: {
            backgroundColor: theme.colors.systemBlue,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
  },
  alertActionText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
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
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.xs,
  },
  notificationMessage: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.label,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.neutral[500],
  },
  notificationContentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertDeleteButton: {
    backgroundColor: theme.colors.systemRed,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    height: 40,
    borderWidth: 2,
    borderColor: theme.colors.systemRed,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  alertDeleteButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.blackA50,
  },
  modalContent: {
    backgroundColor: theme.colors.systemBackground,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    width: '80%',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.label,
    marginBottom: theme.spacing.md,
  },
  modalMessage: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[600],
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    textAlign: 'center',
  },
  modalButtonCancel: {
    backgroundColor: theme.colors.neutral[200],
  },
  modalButtonConfirm: {
    backgroundColor: theme.colors.systemRed,
  },
  modalButtonDisabled: {
    backgroundColor: theme.colors.neutral[400],
    opacity: 0.6,
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});