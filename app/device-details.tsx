import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { ArrowLeft, Edit, Camera, Lightbulb, ChevronDown, Calendar, FolderOpen } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { iosFonts, iosColors, iosSpacing, iosRadius } from '@/src/styles/iosDesignSystem';
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
    // Mock edit functionality
    Alert.alert('Edit Device', 'Edit functionality would be implemented here');
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
          <ActivityIndicator size="large" color={iosColors.systemBlue} />
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
            <ArrowLeft size={24} color={iosColors.label} />
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
          <ArrowLeft size={24} color={iosColors.label} />
        </Pressable>
        <Text style={styles.headerTitle}>Item Details</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.actionButton} onPress={handleEditDevice}>
            <Edit size={20} color={iosColors.systemBlue} />
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
            colors={[iosColors.systemBlue]}
            tintColor={iosColors.systemBlue}
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
                  <Camera size={32} color={iosColors.systemGray} />
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
                  <FolderOpen size={32} color={iosColors.systemGray} />
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
            <Text style={styles.warrantyExpiryLabel}>
              {device.warranty_end_date 
                ? `Active until ${formatDate(device.warranty_end_date)}`
                : 'No warranty end date'
              }
            </Text>
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
            backgroundColor: '#fee2e2', 
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
    backgroundColor: iosColors.systemBackground,
    paddingHorizontal: iosSpacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: iosSpacing.lg,
    paddingVertical: iosSpacing.lg,
  },
  headerTitle: {
    fontSize: iosFonts.title2,
    fontWeight: iosFonts.bold,
    color: iosColors.label,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: iosSpacing.md,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: iosColors.systemBackground,
    borderRadius: iosRadius.lg,
    padding: iosSpacing.xl,
    marginBottom: iosSpacing.lg,
    shadowColor: iosColors.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: iosFonts.title3,
    fontWeight: iosFonts.semibold,
    color: iosColors.label,
    marginBottom: iosSpacing.lg,
  },
  uploadRow: {
    flexDirection: 'column',
    gap: iosSpacing.lg,
  },
  uploadZone: {
    width: '100%',
    backgroundColor: iosColors.systemGray6,
    borderRadius: iosRadius.md,
    padding: iosSpacing.lg,
    borderWidth: 1,
    borderColor: iosColors.systemGray5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    shadowColor: iosColors.label,
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
    shadowColor: iosColors.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: iosRadius.md,
  },
  uploadContent: {
    alignItems: 'center',
  },
  uploadText: {
    fontSize: iosFonts.body,
    color: iosColors.systemGray,
    marginTop: iosSpacing.sm,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: iosSpacing.lg,
  },
  textInput: {
    borderWidth: 1,
    borderColor: iosColors.systemGray5,
    borderRadius: iosRadius.md,
    paddingHorizontal: iosSpacing.lg,
    paddingVertical: iosSpacing.lg,
    backgroundColor: iosColors.systemGray6,
    fontSize: iosFonts.body,
    color: iosColors.label,
    minHeight: 48,
  },
  warrantyExpiryInfo: {
    backgroundColor: iosColors.systemGray6,
    borderRadius: iosRadius.md,
    padding: iosSpacing.lg,
    borderWidth: 1,
    borderColor: iosColors.systemGray5,
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: iosColors.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  warrantyExpiryLabel: {
    fontSize: iosFonts.body,
    fontWeight: iosFonts.medium,
    color: iosColors.systemGreen,
  },
  bottomSpacing: {
    height: iosSpacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: iosSpacing.lg,
  },
  loadingText: {
    marginTop: iosSpacing.md,
    fontSize: iosFonts.callout,
    color: iosColors.secondaryLabel,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: iosSpacing.lg,
    paddingVertical: iosSpacing.xxxl,
  },
  errorText: {
    fontSize: iosFonts.title2,
    fontWeight: iosFonts.bold,
    color: iosColors.label,
    marginBottom: iosSpacing.md,
  },
  errorSubtext: {
    fontSize: iosFonts.callout,
    color: iosColors.secondaryLabel,
    textAlign: 'center',
    marginBottom: iosSpacing.lg,
  },
  retryButton: {
    backgroundColor: iosColors.systemBlue,
    borderRadius: iosRadius.md,
    paddingVertical: iosSpacing.md,
    paddingHorizontal: iosSpacing.lg,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: iosFonts.body,
    fontWeight: iosFonts.semibold,
    color: iosColors.systemBackground,
  },
  deleteButtonContainer: {
    marginTop: -30, // Move button 30px up
    marginBottom: iosSpacing.xl,
  },
  deleteButton: {
    backgroundColor: iosColors.systemRed,
    borderRadius: iosRadius.md,
    paddingVertical: iosSpacing.md,
    alignItems: 'center',
    shadowColor: iosColors.systemRed,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    fontSize: iosFonts.body,
    fontWeight: iosFonts.semibold,
    color: iosColors.systemBackground,
  },
});