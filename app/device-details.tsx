import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image, ActivityIndicator } from 'react-native';
import { ArrowLeft, Trash2, Edit, Calendar, DollarSign, Store, FileText, Shield } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { WarrantyBadge } from '@/src/components/WarrantyBadge';

export default function DeviceDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  
  // Mock data - no more Supabase fetching
  const [device, setDevice] = useState<any>(null);
  const [warranty, setWarranty] = useState<any>(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading and mock data
    setTimeout(() => {
      setDevice({
        id: id,
        name: 'Sample Device',
        brand: 'Sample Brand',
        model: 'Sample Model',
        category: 'Electronics',
        purchase_price: 999.99,
        purchase_date: '2024-01-15',
        store_name: 'Sample Store',
        notes: 'This is a sample device for demonstration purposes.',
        image_url: null,
        created_at: '2024-01-15T00:00:00Z'
      });
      
      setWarranty({
        id: 'warranty-1',
        warranty_type: 'Manufacturer',
        provider_name: 'Sample Brand',
        start_date: '2024-01-15',
        end_date: '2027-01-15',
        duration_months: 36,
        is_active: true
      });
      
      setReceipt({
        id: 'receipt-1',
        store_name: 'Sample Store',
        purchase_date: '2024-01-15',
        total_amount: 999.99,
        notes: 'Sample receipt for demonstration'
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[600]} />
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
          <ArrowLeft size={24} color={theme.colors.neutral[900]} />
        </Pressable>
        <Text style={styles.headerTitle}>Device Details</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.actionButton} onPress={handleEditDevice}>
            <Edit size={20} color={theme.colors.primary[600]} />
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleDeleteDevice}>
            <Trash2 size={20} color={theme.colors.error[500]} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Device Image */}
        <View style={styles.imageSection}>
          {device.image_url ? (
            <Image source={{ uri: device.image_url }} style={styles.deviceImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Shield size={48} color={theme.colors.neutral[400]} />
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </View>

        {/* Device Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Information</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Shield size={20} color={theme.colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{device.name}</Text>
            </View>
          </View>

          {device.brand && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Shield size={20} color={theme.colors.secondary[600]} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Brand</Text>
                <Text style={styles.infoValue}>{device.brand}</Text>
              </View>
            </View>
          )}

          {device.model && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Shield size={20} color={theme.colors.warning[600]} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Model</Text>
                <Text style={styles.infoValue}>{device.model}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Shield size={20} color={theme.colors.neutral[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{device.category}</Text>
            </View>
          </View>
        </View>

        {/* Purchase Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchase Information</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Calendar size={20} color={theme.colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Purchase Date</Text>
              <Text style={styles.infoValue}>{formatDate(device.purchase_date)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <DollarSign size={20} color={theme.colors.success[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Purchase Price</Text>
              <Text style={styles.infoValue}>{formatPrice(device.purchase_price)}</Text>
            </View>
          </View>

          {device.store_name && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Store size={20} color={theme.colors.secondary[600]} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Store</Text>
                <Text style={styles.infoValue}>{device.store_name}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Warranty Information */}
        {warranty && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Warranty Information</Text>
            
            <WarrantyBadge warranty={warranty} />
            
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Shield size={20} color={theme.colors.warning[600]} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Provider</Text>
                <Text style={styles.infoValue}>{warranty.provider_name}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Calendar size={20} color={theme.colors.success[600]} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Start Date</Text>
                <Text style={styles.infoValue}>{formatDate(warranty.start_date)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Calendar size={20} color={theme.colors.error[600]} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>End Date</Text>
                <Text style={styles.infoValue}>{formatDate(warranty.end_date)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Shield size={20} color={theme.colors.primary[600]} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>{warranty.duration_months} months</Text>
              </View>
            </View>
          </View>
        )}

        {/* Receipt Information */}
        {receipt && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Receipt Information</Text>
            
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <FileText size={20} color={theme.colors.secondary[600]} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Store</Text>
                <Text style={styles.infoValue}>{receipt.store_name}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Calendar size={20} color={theme.colors.primary[600]} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Purchase Date</Text>
                <Text style={styles.infoValue}>{formatDate(receipt.purchase_date)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <DollarSign size={20} color={theme.colors.success[600]} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Total Amount</Text>
                <Text style={styles.infoValue}>{formatPrice(receipt.total_amount)}</Text>
              </View>
            </View>

            {receipt.notes && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FileText size={20} color={theme.colors.neutral[600]} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Notes</Text>
                  <Text style={styles.infoValue}>{receipt.notes}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Notes */}
        {device.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{device.notes}</Text>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[900],
  },
  saveButton: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary[600],
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  deviceInfo: {
    alignItems: 'center',
    marginBottom: theme.spacing['3xl'],
  },
  deviceImage: {
    width: 240, // Increased from 120 to 240 (twice as big)
    height: 240, // Increased from 120 to 240 (twice as big)
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  deviceImageContent: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.xl,
  },
  deviceEmoji: {
    fontSize: 96, // Increased from 48 to 96 (twice as big to match larger image container)
  },
  deviceName: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.sm,
  },
  deviceBrand: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  notFoundText: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.md,
  },
  notFoundSubtext: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  infoLabel: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
  },
  infoValue: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.neutral[900],
  },
  progressContainer: {
    marginTop: theme.spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.success[500],
    borderRadius: theme.borderRadius.sm,
  },
  progressText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.neutral[600],
    textAlign: 'center',
  },
  receiptsContainer: {
    width: '100%',
  },
  receiptThumbnail: {
    width: '100%',
    height: 150, // Reverted back to original size
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  noReceiptsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  noReceiptsText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
  },
  editButton: {
    borderColor: theme.colors.primary[600],
    borderWidth: 2,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  editButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary[600],
  },
  deleteButton: {
    backgroundColor: theme?.colors?.error?.[600] || '#dc2626',
    borderWidth: 0,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing['4xl'],
  },
  deleteButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
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
    padding: theme.spacing.xl,
    alignItems: 'center',
    width: '80%',
    ...theme.shadows.md,
  },
  modalTitle: {
    fontSize: theme.fontSize['2xl'],
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
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm,
  },
  modalButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  modalButtonCancel: {
    backgroundColor: theme.colors.neutral[300],
  },
  modalButtonConfirm: {
    backgroundColor: theme?.colors?.error?.[600] || '#dc2626',
  },
  imageModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  imageModalCloseText: {
    fontSize: 20,
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.lg,
  },
  imageModalTitle: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    textAlign: 'center',
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: theme.spacing.md,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  placeholderImage: {
    width: 240,
    height: 240,
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
  },
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  infoIcon: {
    width: 40,
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.neutral[900],
  },
  notesText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
    marginTop: theme.spacing.md,
  },
  bottomSpacing: {
    height: theme.spacing['4xl'], // Add some space at the bottom
  },
});