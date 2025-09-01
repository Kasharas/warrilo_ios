import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { ArrowLeft, Edit, Camera, Lightbulb, ChevronDown, Calendar, FolderOpen } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useDeviceSync } from '@/src/hooks/useDeviceSync';
import { LocalDevice } from '@/src/lib/localStorage';
import { useDeviceOperations } from '@/src/hooks/useDeviceOperations';

export default function DeviceDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { getLocalDevices } = useDeviceSync();
  const { deleteDevice } = useDeviceOperations();
  
  // Real device data
  const [device, setDevice] = useState<LocalDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDeviceData();
  }, [id]);

  const loadDeviceData = async () => {
    try {
      setLoading(true);
      const devices = await getLocalDevices();
      const foundDevice = devices.find(d => d.local_id === id || d.id === id);
      
      if (foundDevice) {
        setDevice(foundDevice);
      } else {
        console.error('Device not found with ID:', id);
      }
    } catch (error) {
      console.error('Error loading device data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDeviceData();
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleEditDevice = () => {
    if (!device) {
      Alert.alert('Error', 'Device data not available');
      return;
    }

    console.log('DeviceCard: Edit button pressed for device:', device);
    console.log('DeviceCard: invoice_url (receipt):', device.invoice_url);
    console.log('DeviceCard: photo_irl:', device.photo_irl);
    console.log('DeviceCard: identifiers (serial):', device.identifiers);

    // Prepare navigation parameters
    const navigationParams = {
      id: device.local_id || device.id,
      name: device.name,
      brand: '', // Not available in LocalDevice
      category: device.category || '',
      photo_irl: device.photo_irl || '',
      receipt_irl: device.invoice_url || '',
      serial_number: device.identifiers || '',
      purchase_price: device.purchase_price?.toString() || '',
      store_name: device.supplier || '',
      warranty_months: device.warranty_months?.toString() || '',
      warranty_end_date: device.warranty_end_date || '',
      notes: device.notes || '',
    };

    console.log('DeviceCard: Navigation params:', navigationParams);
    console.log('DeviceCard: serial_number param:', navigationParams.serial_number);

    // Navigate to edit-item screen with device data
    router.push({
      pathname: '/edit-item',
      params: navigationParams
    });
  };

  const handleDeleteDevice = () => {
    if (device) {
      console.log('🎯 FLOW TEST: Delete button pressed for device:', device?.name);
      console.log('🎯 FLOW TEST: Current navigation stack depth:', router.canGoBack());
      
      setDeleting(true);
      setError(null); // Clear any previous errors
      deleteDevice(device).catch((err) => {
        setError(err.message || 'Failed to delete device');
        setDeleting(false);
      });
    }
  };



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return `$${price.toLocaleString()}`;
  };

  const extractSerialNumber = (identifiers?: string | null) => {
    if (!identifiers) return null;
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(identifiers);
      
      // If it's an object, look for common serial number keys
      if (typeof parsed === 'object' && parsed !== null) {
        // Check for common serial number field names
        const serialKeys = ['serial', 'serialNumber', 'serial_number', 'id', 'identifier'];
        for (const key of serialKeys) {
          if (parsed[key] && typeof parsed[key] === 'string') {
            return parsed[key];
          }
        }
        
        // If no specific key found, return the first string value
        const values = Object.values(parsed);
        const firstString = values.find(val => typeof val === 'string');
        if (firstString) {
          return firstString;
        }
      }
      
      // If parsing failed or it's not an object, return as is
      return identifiers;
    } catch (error) {
      // If it's not JSON, return the original string
      return identifiers;
    }
  };



  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.systemBlue} />
          <Text style={styles.loadingText}>Loading device details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={handleBackPress}>
            <ArrowLeft size={24} color={theme.colors.label} />
          </Pressable>
          <Text style={styles.headerTitle}>Item Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Device not found</Text>
          <Text style={styles.errorSubtext}>The device you're looking for doesn't exist or has been removed.</Text>
          <Pressable style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBackPress}>
          <ArrowLeft size={24} color={theme.colors.label} />
        </Pressable>
        <Text style={styles.headerTitle}>Item Details</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.actionButton} onPress={handleEditDevice}>
            <Edit size={20} color={theme.colors.systemBlue} />
          </Pressable>
        </View>
      </View>

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
        {/* Images Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Images</Text>
          
          {/* Device Image */}
          <View style={styles.uploadRow}>
            <View style={styles.uploadZone}>
              {device.photo_irl ? (
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ uri: device.photo_irl }} 
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View style={styles.uploadContent}>
                  <Camera size={32} color={theme.colors.systemGray} />
                  <Text style={styles.uploadText}>No Device Image</Text>
                </View>
              )}
            </View>
            
            {/* Receipt Image */}
            <View style={styles.uploadZone}>
              {device.invoice_url ? (
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ uri: device.invoice_url }} 
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View style={styles.uploadContent}>
                  <FolderOpen size={32} color={theme.colors.systemGray} />
                  <Text style={styles.uploadText}>No Receipt</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Device Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.textInput}>
              {device.name || 'No device name'}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.textInput}>
              {device.supplier || 'No supplier'}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.textInput}>
              {extractSerialNumber(device.identifiers) || 'No serial number'}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.textInput}>
              {device.category || 'No category'}
            </Text>
          </View>
        </View>

        {/* Purchase Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchase & Creation Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.textInput}>
              {device.purchase_date ? formatDate(device.purchase_date) : 'No purchase date'}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.textInput}>
              {device.purchase_price ? formatPrice(device.purchase_price) : 'No purchase price'}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.textInput}>
              {device.created_at ? formatDate(device.created_at) : 'No creation date'}
            </Text>
          </View>
        </View>

        {/* Warranty Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warranty Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.textInput}>
              {device.warranty_months ? `${device.warranty_months} months` : 'No warranty duration'}
            </Text>
          </View>

          <View style={styles.warrantyExpiryInfo}>
            {device.warranty_end_date ? (
              <View style={styles.warrantyStatusRow}>
                <View style={[
                  styles.warrantyBadge,
                  { backgroundColor: new Date(device.warranty_end_date) < new Date() ? theme.colors.systemRed : '#10b981' }
                ]}>
                  <Text style={styles.warrantyBadgeText}>
                    {new Date(device.warranty_end_date) < new Date() ? 'Expired' : 'Active'}
                  </Text>
                </View>
                <Text style={styles.warrantyDateText}>
                  {formatDate(device.warranty_end_date)}
                </Text>
              </View>
            ) : (
              <Text style={styles.warrantyPlaceholderText}>
                No warranty end date
              </Text>
            )}
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}>
              {device.notes || 'No additional notes'}
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
        
        {/* Error Display */}
        {error && (
          <View style={[styles.section, { 
            backgroundColor: theme.colors.systemBackground, 
            borderColor: '#ef4444', 
            borderWidth: 1
          }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ 
                color: '#dc2626', 
                fontSize: 14,
                flex: 1
              }}>{error}</Text>
            </View>
          </View>
        )}
        
        {/* Delete Button */}
        <View style={styles.deleteButtonContainer}>
          <Pressable 
            style={styles.deleteButton} 
            onPress={handleDeleteDevice}
            disabled={deleting}
          >
            <Text style={styles.deleteButtonText}>Delete Item</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.systemBackground,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.fontSize.title2,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.label,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: theme.spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: theme.colors.systemBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: theme.fontSize.title3,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.label,
    marginBottom: theme.spacing.lg,
  },
  uploadRow: {
    flexDirection: 'column',
    gap: theme.spacing.lg,
  },
  uploadZone: {
    width: '100%',
    backgroundColor: theme.colors.systemBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    shadowColor: theme.colors.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    width: '100%',
    backgroundColor: theme.colors.systemBackground,
    borderRadius: theme.borderRadius.md,
    shadowColor: theme.colors.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: theme.borderRadius.md,
  },
  uploadContent: {
    alignItems: 'center',
  },
  uploadText: {
    fontSize: theme.fontSize.body,
    color: theme.colors.systemGray,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.systemBackground,
    fontSize: theme.fontSize.body,
    color: theme.colors.label,
    minHeight: 48,
    shadowColor: theme.colors.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  warrantyExpiryInfo: {
    backgroundColor: theme.colors.systemBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  warrantyExpiryLabel: {
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.systemGreen,
  },
  warrantyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  warrantyBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  warrantyBadgeText: {
    fontSize: theme.fontSize.footnote,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.systemBackground,
  },
  warrantyDateText: {
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.label,
  },
  warrantyPlaceholderText: {
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.placeholderText,
  },
  bottomSpacing: {
    height: theme.spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.callout,
    color: theme.colors.secondaryLabel,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxxl,
  },
  errorText: {
    fontSize: theme.fontSize.title2,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.label,
    marginBottom: theme.spacing.md,
  },
  errorSubtext: {
    fontSize: theme.fontSize.callout,
    color: theme.colors.secondaryLabel,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.systemBlue,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.systemBackground,
  },
  deleteButtonContainer: {
    marginTop: -30, // Move button 30px up
    marginBottom: theme.spacing.xl,
  },
  deleteButton: {
    backgroundColor: theme.colors.systemRed,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    shadowColor: theme.colors.systemRed,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.systemBackground,
  },
});