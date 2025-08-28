import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image, ActivityIndicator } from 'react-native';
import { ArrowLeft, Trash2, Edit, Camera, Lightbulb, ChevronDown, Calendar, FolderOpen } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { iosFonts, iosColors, iosSpacing, iosRadius } from '@/src/styles/iosDesignSystem';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function DeviceDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  
  // Mock data - no more Supabase fetching
  const [device, setDevice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading and mock data
    setTimeout(() => {
      setDevice({
        id: id,
        name: 'Sample Device',
        brand: 'Sample Brand',
        serialNumber: 'SN123456789',
        category: 'Electronics',
        purchase_price: 999.99,
        purchase_date: '2024-01-15',
        store_name: 'Sample Store',
        warranty_duration: 36,
        notes: 'This is a sample device for demonstration purposes.',
        photo_irl: null,
        receipt_url: null,
        created_at: '2024-01-15T00:00:00Z'
      });
      
      setLoading(false);
    }, 1000);
  }, [id]);

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

  const calculateWarrantyExpiry = (purchaseDate: string, warrantyMonths: number) => {
    const purchase = new Date(purchaseDate);
    const expiry = new Date(purchase);
    expiry.setMonth(expiry.getMonth() + warrantyMonths);
    return expiry.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Device not found</Text>
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
              {device.receipt_url ? (
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ uri: device.receipt_url }} 
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
          <Text style={styles.sectionTitle}>Device Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.textInput}>
              {device.name || 'No device name'}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.textInput}>
              {device.brand || 'No brand name'}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.textInput}>
              {device.serialNumber || 'No serial number'}
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
          <Text style={styles.sectionTitle}>Purchase Details</Text>
          
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
              {device.store_name || 'No store name'}
            </Text>
          </View>
        </View>

        {/* Warranty Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warranty Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.textInput}>
              {device.warranty_duration ? `${device.warranty_duration} months` : 'No warranty duration'}
            </Text>
          </View>

          <View style={styles.warrantyExpiryInfo}>
            <Text style={styles.warrantyExpiryLabel}>
              {device.purchase_date && device.warranty_duration 
                ? `Active until ${calculateWarrantyExpiry(device.purchase_date, device.warranty_duration)}`
                : 'Select purchase date and duration'
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
  },
  errorText: {
    fontSize: iosFonts.title2,
    fontWeight: iosFonts.bold,
    color: iosColors.label,
    marginBottom: iosSpacing.md,
  },
});