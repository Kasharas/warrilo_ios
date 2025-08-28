import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { ArrowLeft, Trash2, Edit, Camera, Lightbulb, ChevronDown, Calendar, FolderOpen } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { iosFonts, iosColors, iosSpacing, iosRadius } from '@/src/styles/iosDesignSystem';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useDeviceSync } from '@/src/hooks/useDeviceSync';
import { LocalDevice } from '@/src/lib/localStorage';

export default function DeviceDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { getLocalDevices } = useDeviceSync();
  
  // Real device data
  const [device, setDevice] = useState<LocalDevice | null>(null);
  const [loading, setLoading] = useState(true);

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
    Alert.alert(
      'Delete Device',
      'Are you sure you want to delete this device? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          console.log('Device deleted (mock)');
          router.back();
        }}
      ]
    );
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
          <Pressable style={styles.actionButton} onPress={handleDeleteDevice}>
            <Trash2 size={20} color={iosColors.systemRed} />
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
              {device.identifiers || 'No identifiers'}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: iosColors.systemBackground,
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
    paddingHorizontal: iosSpacing.lg,
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
    flexDirection: 'row',
    gap: iosSpacing.md,
  },
  uploadZone: {
    flex: 1,
    backgroundColor: iosColors.systemGray6,
    borderRadius: iosRadius.md,
    padding: iosSpacing.lg,
    borderWidth: 1,
    borderColor: iosColors.systemGray5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowColor: iosColors.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowColor: iosColors.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imagePreview: {
    width: '100%',
    height: 200,
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
});