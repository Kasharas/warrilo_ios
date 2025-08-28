import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, ActivityIndicator, TextInput, Modal, RefreshControl } from 'react-native';
import { Plus, Search, Filter, Shield } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { DeviceCard } from '@/src/components/DeviceCard';
import { FabButton } from '@/src/components/FabButton';
import { useDeviceSync } from '@/src/hooks/useDeviceSync';
import { LocalDevice } from '@/src/lib/localStorage';

export default function DeviceListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { getLocalDevices } = useDeviceSync();
  
  // Real device data from local storage
  const [devices, setDevices] = useState<LocalDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
    
    console.log('User confirmed deletion');
    try {
      // Mock deletion - just remove from local state
      setDevices(devices.filter(d => d.id !== deviceToDelete));
      Alert.alert('Success', 'Item deleted successfully!');
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item. Please try again.');
    } finally {
      setShowDeleteModal(false);
      setDeviceToDelete(null);
    }
  };

  const cancelDelete = () => {
    console.log('User chose to keep the item');
    setShowDeleteModal(false);
    setDeviceToDelete(null);
  };

  // Show loading only when initially loading and no devices
  if (loading && devices.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
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

      {/* Search Bar */}
      <View style={[
        styles.searchContainer,
        isSearchFocused && styles.searchContainerFocused
      ]}>
        <Search size={20} color={theme.colors.neutral[400]} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.neutral[400]}
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
              ]}>
                {item.label} ({item.count})
              </Text>
            </Pressable>
          )}
          keyExtractor={(item) => item.label}
          contentContainerStyle={styles.filtersContent}
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
              colors={[theme.colors.primary[600]]}
              tintColor={theme.colors.primary[600]}
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
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Deletion</Text>
            <Text style={styles.modalMessage}>
              Are you absolutely sure you want to delete this item? This action cannot be undone and all warranty information will be permanently lost.
            </Text>
            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalButton, styles.modalButtonCancel]} onPress={cancelDelete}>
                <Text style={[styles.modalButtonText, { color: theme.colors.neutral[700] }]}>No, Keep It</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.modalButtonConfirm]} onPress={confirmDelete}>
                <Text style={styles.modalButtonText}>Yes, Delete It</Text>
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
    height: '100%', // Ensure container takes full height
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[900],
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
    borderColor: '#000000',
  },
  searchIcon: {
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[900],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 0,
    borderColor: 'transparent',
    outlineStyle: 'none',
  },
  filtersContainer: {
    marginBottom: theme.spacing.lg,
    paddingHorizontal: 0,
    marginTop: -4,
    marginLeft: 0,
  },
  filtersContent: {
    gap: theme.spacing.sm,
    paddingHorizontal: 0,
  },
  filterChip: {
    backgroundColor: theme.colors.neutral[100],
    borderRadius: 18,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    height: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[500],
    textAlign: 'center',
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
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '80%',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.md,
  },
  modalMessage: {
    fontSize: theme.fontSize.base,
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
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    textAlign: 'center',
  },
  modalButtonCancel: {
    backgroundColor: theme.colors.neutral[200],
  },
  modalButtonConfirm: {
    backgroundColor: theme.colors.error[500],
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
});