import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, ActivityIndicator, TextInput, Modal, RefreshControl } from 'react-native';
import { Plus, Search, Filter, Shield } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { iosColors, iosFonts, iosSpacing, iosRadius } from '@/src/styles/iosDesignSystem';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { DeviceCard } from '@/src/components/DeviceCard';
import { FabButton } from '@/src/components/FabButton';
import { useDeviceSync } from '@/src/hooks/useDeviceSync';
import { useDeviceOperations } from '@/src/hooks/useDeviceOperations';
import { LocalDevice } from '@/src/lib/localStorage';

export default function DeviceListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { getLocalDevices } = useDeviceSync();
  const { deleteDevice } = useDeviceOperations();
  
  // Real device data from local storage
  const [devices, setDevices] = useState<LocalDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load devices from local storage
  const loadDevices = async () => {
    try {
      console.log('📱 Devices Screen: Loading devices from local storage...');
      setLoading(true);
      setError(null);
      
      const localDevices = await getLocalDevices();
      console.log('📱 Devices Screen: Loaded devices:', localDevices.length);
      
      setDevices(localDevices);
      
      console.log('✅ Devices Screen: Devices loaded successfully');
    } catch (error) {
      console.error('❌ Devices Screen: Error loading devices:', error);
      setError('Failed to load devices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load devices on component mount
  useEffect(() => {
    if (user) {
      console.log('🔄 Devices Screen: Component mounted, loading devices...');
      loadDevices();
    }
  }, [user]);

  // Refresh devices when screen gains focus (e.g., returning from add-device)
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        console.log('🔄 Devices Screen: Screen focused, refreshing devices...');
        loadDevices();
      }
    }, [user])
  );

  const handleRefresh = async () => {
    console.log('🔄 Devices Screen: Manual refresh triggered');
    await loadDevices();
  };

  const filters = [
    { label: 'All', count: devices.length },
    { label: 'Electronics', count: devices.filter(d => d.category === 'Electronics').length },
    { label: 'Cloth', count: devices.filter(d => d.category === 'Cloth').length },
    { label: 'Automotive', count: devices.filter(d => d.category === 'Automotive').length },
    { label: 'Other', count: devices.filter(d => d.category === 'Other').length },
  ];

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (device.brand && device.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = selectedFilter === 'All' || device.category === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  // Debug logging for device filtering
  useEffect(() => {
    console.log('🔍 Devices Screen: Filtering results:', {
      totalDevices: devices.length,
      searchQuery,
      selectedFilter,
      filteredCount: filteredDevices.length,
      deviceNames: filteredDevices.map(d => d.name)
    });
  }, [devices, searchQuery, selectedFilter, filteredDevices]);

  const handleDevicePress = (deviceId: string) => {
    router.push(`/device-details?id=${deviceId}`);
  };

  const handleDeleteDevice = (deviceId: string) => {
    console.log('Delete button pressed for device:', deviceId);
    
    // Show custom delete confirmation modal
    setDeviceToDelete(deviceId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deviceToDelete) return;
    
    console.log('🎯 Devices Screen: User confirmed deletion for device:', deviceToDelete);
    setDeleting(true);
    
    try {
      // Find the device to delete
      const deviceToDeleteObj = devices.find(d => d.id === deviceToDelete);
      if (!deviceToDeleteObj) {
        throw new Error('Device not found');
      }
      
      console.log('🗑️ Devices Screen: Starting deletion process for:', deviceToDeleteObj.name);
      
      // Call the proper delete hook
      await deleteDevice(deviceToDeleteObj);
      
      console.log('✅ Devices Screen: Device deleted successfully, updating local state');
      
      // Remove from local state
      setDevices(devices.filter(d => d.id !== deviceToDelete));
      
      // Show success message
      Alert.alert('Success', 'Item deleted successfully!');
      
    } catch (error) {
      console.error('❌ Devices Screen: Error deleting device:', error);
      Alert.alert('Error', 'Failed to delete item. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeviceToDelete(null);
    }
  };

  const cancelDelete = () => {
    if (deleting) {
      console.log('Devices Screen: Cannot cancel during deletion');
      return;
    }
    
    console.log('Devices Screen: User chose to keep the item');
    setShowDeleteModal(false);
    setDeviceToDelete(null);
  };

  // Show loading only when initially loading and no devices
  if (loading && devices.length === 0) {
    return (
      <View style={styles.loadingContainer}>
                 <ActivityIndicator size="large" color={iosColors.systemBlue} />
        <Text style={styles.loadingText}>Loading devices...</Text>
      </View>
    );
  }

  // Show error only when there's an error and no devices
  if (error && devices.length === 0) {
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
        <Text style={styles.headerTitle}>My Items</Text>
        <View style={styles.headerRight}>
          <Pressable style={styles.menuButton} onPress={() => router.push({
            pathname: '/settings',
            params: { fromScreen: 'devices' }
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
                 <Search size={20} color={iosColors.systemGray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
                     placeholderTextColor={iosColors.placeholderText}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          renderItem={({ item }) => (
            <Pressable
              key={item.label}
              style={[
                styles.filterChip,
                selectedFilter === item.label && styles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(item.label)}
            >
              <Text style={[
                styles.filterChipText,
                selectedFilter === item.label && styles.filterChipTextActive
              ]} numberOfLines={1}>
                {item.label} ({item.count})
              </Text>
            </Pressable>
          )}
          keyExtractor={(item) => item.label}
          contentContainerStyle={styles.filtersContent}
          snapToAlignment="start"
          decelerationRate="fast"
          bounces={false}
        />
      </View>

      {/* Content Area - Show devices list or empty state */}
      {filteredDevices.length === 0 ? (
        // Empty state within the main layout
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery || selectedFilter !== 'All' 
              ? 'Try adjusting your search or filters' 
              : devices.length === 0 
                ? 'Add your first item to get started'
                : `No devices match your current filters (${devices.length} total devices available)`}
          </Text>
        </View>
      ) : (
        // Device List
        <FlatList 
          data={filteredDevices}
          renderItem={({ item }) => (
            <View key={item.id} style={styles.deviceCardWrapper}>
              <DeviceCard
                device={item}
                onPress={() => handleDevicePress(item.id)}
                onDelete={() => handleDeleteDevice(item.id)}
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.deviceListContent}
          scrollEventThrottle={16}
                       refreshControl={
               <RefreshControl
                 refreshing={loading}
                 onRefresh={handleRefresh}
                 colors={[iosColors.systemBlue]}
                 tintColor={iosColors.systemBlue}
               />
             }
        />
      )}

      <FabButton onPress={() => router.push({
        pathname: '/add-device',
        params: { fromScreen: 'devices' }
      })} />

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
              Are you absolutely sure you want to delete this item? This action cannot be undone and all warranty information will be permanently lost.
            </Text>
            <View style={styles.modalButtons}>
              <Pressable 
                style={[styles.modalButton, styles.modalButtonCancel]} 
                onPress={cancelDelete}
                disabled={deleting}
              >
                                 <Text style={[styles.modalButtonText, { color: iosColors.label }]}>No, Keep It</Text>
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
                                         <ActivityIndicator size="small" color={iosColors.systemBackground} />
                    <Text style={[styles.modalButtonText, { marginLeft: 8 }]}>Deleting...</Text>
                  </View>
                ) : (
                  <Text style={styles.modalButtonText}>Yes, Delete It</Text>
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
    paddingHorizontal: theme.spacing.lg, // This creates the left/right boundaries
    height: '100%', // Ensure container takes full height
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: iosSpacing.xxxl,
    marginTop: iosSpacing.lg,
  },
  headerTitle: {
    fontSize: iosFonts.largeTitle,
    fontWeight: iosFonts.bold,
    color: iosColors.label,
    fontFamily: iosFonts.system,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosSpacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: iosColors.systemBackground,
    borderRadius: iosRadius.lg,
    marginBottom: iosSpacing.md,
    // No horizontal margins - let it fill the full container width
    borderWidth: 1,
    borderColor: iosColors.systemGray5,
    ...theme.shadows.sm,
  },
  searchContainerFocused: {
    borderWidth: 2,
    borderColor: iosColors.systemBlue,
  },
  searchIcon: {
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: iosFonts.body,
    color: iosColors.label,
    paddingHorizontal: iosSpacing.lg,
    paddingVertical: iosSpacing.md,
    borderWidth: 0,
    borderColor: 'transparent',
    outlineStyle: 'none',
    fontFamily: iosFonts.system,
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
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  filterChipText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  deviceList: {
    flex: 1,
    marginBottom: 0, // Remove bottom margin to allow full height
    paddingBottom: 0, // Remove padding to allow full height
    minHeight: 500, // Ensure minimum height to fill remaining space
  },
  deviceListContent: {
    paddingBottom: 200, // Keep padding at bottom for FAB clearance
    flexGrow: 1, // Allow content to grow and fill available space
    justifyContent: 'flex-start', // Align content to top
    alignItems: 'stretch', // Stretch items to full width
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  loadingText: {
    fontSize: iosFonts.body,
    color: iosColors.secondaryLabel,
    fontFamily: iosFonts.system,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  emptyText: {
    fontSize: iosFonts.title3,
    fontWeight: iosFonts.semibold,
    color: iosColors.label,
    marginBottom: iosSpacing.sm,
    fontFamily: iosFonts.system,
  },
  emptySubtext: {
    fontSize: iosFonts.subhead,
    color: iosColors.secondaryLabel,
    textAlign: 'center',
    fontFamily: iosFonts.system,
  },
  deviceCardWrapper: {
    marginBottom: 5, // Set to exactly 5px for very tight spacing
  },
  lastUpdatedContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  lastUpdatedText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.neutral[500],
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: iosColors.systemBackground,
    borderRadius: iosRadius.xl,
    padding: iosSpacing.lg,
    width: '80%',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  modalTitle: {
    fontSize: iosFonts.title3,
    fontWeight: iosFonts.bold,
    color: iosColors.label,
    marginBottom: iosSpacing.md,
    fontFamily: iosFonts.system,
  },
  modalMessage: {
    fontSize: iosFonts.body,
    color: iosColors.secondaryLabel,
    textAlign: 'center',
    marginBottom: iosSpacing.lg,
    fontFamily: iosFonts.system,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: iosSpacing.md,
    paddingHorizontal: iosSpacing.lg,
    borderRadius: iosRadius.md,
    marginHorizontal: iosSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: iosFonts.body,
    fontWeight: iosFonts.semibold,
    textAlign: 'center',
    fontFamily: iosFonts.system,
  },
  modalButtonCancel: {
    backgroundColor: iosColors.systemGray5,
  },
  modalButtonConfirm: {
    backgroundColor: iosColors.systemRed,
  },
  modalButtonDisabled: {
    backgroundColor: iosColors.systemGray3,
    opacity: 0.6,
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
});