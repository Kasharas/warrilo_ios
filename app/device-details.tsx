import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Modal, Alert } from 'react-native';
import { ArrowLeft, Menu, CreditCard as Edit, Plus, Trash2 } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useData } from '../contexts/DataContext';
import { WarrantyBadge } from '../src/components/WarrantyBadge';
import { supabase } from '../lib/supabaseClient';

// Debug theme access
console.log('Theme object:', theme);
console.log('Theme colors:', theme?.colors);
console.log('Theme error colors:', theme?.colors?.error);

export default function DeviceDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { devices, deleteDevice } = useData();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageType, setSelectedImageType] = useState<'item' | 'receipt'>('item');
  const [warrantyData, setWarrantyData] = useState<any>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const device = devices.find(d => d.id === id);
  
  // Fetch warranty and receipt data
  useEffect(() => {
    const fetchDeviceData = async () => {
      if (!device?.id) return;
      
      try {
        setLoading(true);
        
        // Fetch warranty data
        const { data: warranty, error: warrantyError } = await supabase
          .from('warranties')
          .select('*')
          .eq('device_id', device.id)
          .single();
        
        if (!warrantyError && warranty) {
          setWarrantyData(warranty);
        }
        
        // Fetch receipt data
        const { data: receipt, error: receiptError } = await supabase
          .from('receipts')
          .select('*')
          .eq('device_id', device.id)
          .single();
        
        if (!receiptError && receipt) {
          setReceiptData(receipt);
        }
        
      } catch (error) {
        console.error('Error fetching device data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDeviceData();
  }, [device?.id]);
  
  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Device not found</Text>
          <Text style={styles.notFoundSubtext}>The device you're looking for doesn't exist or has been removed.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate warranty status based on real data
  const getWarrantyStatus = () => {
    if (!warrantyData) return 'no-warranty';
    
    const endDate = new Date(warrantyData.end_date);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) return 'expired';
    if (daysRemaining <= 30) return 'expiring';
    return 'active';
  };

  const getCategoryEmoji = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'electronics': return '📱';
      case 'cloth': return '👕';
      case 'automotive': return '🚗';
      case 'other': return '📦';
      default: return '📦';
    }
  };

  const warrantyStatus = getWarrantyStatus();
  const warrantyProgress = warrantyStatus === 'active' ? 100 : 
                          warrantyStatus === 'expiring' ? 25 : 0;

  const daysRemaining = warrantyData ? 
    Math.ceil((new Date(warrantyData.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const handleDeleteDevice = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteDevice(device.id);
      console.log('Item deleted successfully');
      setShowDeleteModal(false);
      // Navigate back to the previous screen
      router.back();
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item. Please try again.');
      setShowDeleteModal(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const openImageModal = (imageUrl: string, type: 'item' | 'receipt') => {
    setSelectedImage(imageUrl);
    setSelectedImageType(type);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.colors.neutral[900]} />
        </Pressable>
        <Text style={styles.headerTitle}>Item Details</Text>
        <View style={styles.menuButton}>
          <Menu size={20} color={theme.colors.white} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Device Info */}
        <View style={styles.deviceInfo}>
          <Pressable onPress={() => device.image_url && openImageModal(device.image_url, 'item')}>
            <View style={styles.deviceImage}>
              {device.image_url ? (
                <Image 
                  source={{ uri: device.image_url }} 
                  style={styles.deviceImageContent}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.deviceEmoji}>{getCategoryEmoji(device.category)}</Text>
              )}
            </View>
          </Pressable>
          <Text style={styles.deviceName}>{device.name}</Text>
          <Text style={styles.deviceBrand}>
            {device.brand || 'No brand'} • {device.category || 'Uncategorized'}
          </Text>
        </View>

        {/* Warranty Status */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Warranty Status</Text>
            <WarrantyBadge status={warrantyStatus} />
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Warranty Information</Text>
            <Text style={styles.infoValue}>
              {warrantyData ? `Ends on ${new Date(warrantyData.end_date).toLocaleDateString()}` : 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>
              {warrantyStatus === 'active' ? 'Active' : warrantyStatus === 'expiring' ? 'Expiring Soon' : 'Expired'}
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${warrantyProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{daysRemaining} days remaining</Text>
          </View>
        </View>

        {/* Purchase Information */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Purchase Price</Text>
            <Text style={styles.infoValue}>
              ${(device.purchase_price || 0).toLocaleString()}.00
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Category</Text>
            <Text style={styles.infoValue}>{device.category || 'Uncategorized'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Purchase Date</Text>
            <Text style={styles.infoValue}>
              {device.created_at ? new Date(device.created_at).toLocaleDateString() : 'Not specified'}
            </Text>
          </View>
        </View>

        {/* Receipts */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Receipts</Text>
          </View>
          
          <View style={styles.receiptsContainer}>
            {receiptData ? (
              <View style={styles.receiptInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Store</Text>
                  <Text style={styles.infoValue}>{receiptData.store_name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Amount</Text>
                  <Text style={styles.infoValue}>${receiptData.total_amount?.toLocaleString()}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>
                    {new Date(receiptData.purchase_date).toLocaleDateString()}
                  </Text>
                </View>
                {receiptData.image_url && (
                  <Pressable onPress={() => openImageModal(receiptData.image_url, 'receipt')}>
                    <View style={styles.receiptThumbnail}>
                      <Image 
                        source={{ uri: receiptData.image_url }} 
                        style={styles.receiptImage}
                        resizeMode="cover"
                      />
                    </View>
                  </Pressable>
                )}
              </View>
            ) : (
              <View style={styles.noReceiptsContainer}>
                <Text style={styles.noReceiptsText}>No receipt uploaded yet</Text>
              </View>
            )}
          </View>
        </View>

        {/* Edit Button */}
        <Pressable style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit Item</Text>
        </Pressable>

        {/* Delete Button */}
        <Pressable style={styles.deleteButton} onPress={handleDeleteDevice}>
          <Text style={styles.deleteButtonText}>Delete Item</Text>
        </Pressable>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={cancelDelete}
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
                <Text style={[styles.modalButtonText, { color: theme.colors.white }]}>Yes, Delete It</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full Screen Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.imageModalOverlay}>
          <Pressable 
            style={styles.imageModalCloseButton} 
            onPress={closeImageModal}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.imageModalCloseText}>✕</Text>
          </Pressable>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
          <Text style={styles.imageModalTitle}>
            {selectedImageType === 'item' ? 'Item Image' : 'Receipt Image'}
          </Text>
        </View>
      </Modal>
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
});