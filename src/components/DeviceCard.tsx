import React, { memo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../styles/theme';

// Define interface for real device data from local storage
interface Device {
  id: string;
  name: string;
  supplier?: string; // Store name from local storage
  category?: string;
  photo_irl?: string | null; // Device photo URL from local storage
  invoice_url?: string | null; // Receipt photo URL from local storage (matches LocalDevice)
  created_at: string;
  warranty_end_date?: string; // Add warranty end date
  warranty_months?: number; // Add warranty months
  purchase_price?: number; // Purchase price
  identifiers?: string; // Serial number from local storage
  notes?: string; // Notes
}

interface DeviceCardProps {
  device: Device;
  onPress: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  compact?: boolean;
}

export function DeviceCard({ device, onPress, onDelete, onEdit, compact = false }: DeviceCardProps) {
  const router = useRouter();
  console.log('DeviceCard rendered with onDelete:', !!onDelete);
  
  // Helper function to check if image URL is valid
  const isValidImageUrl = (url?: string) => {
    if (!url) return false;
    // Check if it's a base64 data URL or a valid HTTP/HTTPS URL
    return url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://');
  };

  // Helper function to get image source
  const getImageSource = (imageUrl?: string) => {
    if (!imageUrl) return null;
    
    // If it's a base64 data URL, use it directly
    if (imageUrl.startsWith('data:')) {
      return { uri: imageUrl };
    }
    
    // If it's a Supabase Storage URL, use it
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return { uri: imageUrl };
    }
    
    return null;
  };

  // State for image loading errors
  const [imageLoadError, setImageLoadError] = useState(false);

  // Handle edit button press
  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      console.log('DeviceCard: Edit button pressed for device:', device);
      console.log('DeviceCard: invoice_url (receipt):', device.invoice_url);
      console.log('DeviceCard: photo_irl:', device.photo_irl);
      console.log('DeviceCard: identifiers (serial):', device.identifiers);
      
      // Default navigation to edit-item screen with device data
      const editParams = {
        id: device.id,
        name: device.name,
        brand: device.supplier || '', // Map supplier to brand
        category: device.category || '',
        photo_irl: device.photo_irl || '',
        receipt_irl: device.invoice_url || '', // Map invoice_url to receipt_irl
        warranty_end_date: device.warranty_end_date || '',
        warranty_months: device.warranty_months?.toString() || '',
        created_at: device.created_at,
        // Add more fields that might be available
        purchase_price: device.purchase_price?.toString() || '',
        store_name: device.supplier || '', // Map supplier to store_name
        serial_number: device.identifiers || '', // Map identifiers to serial_number
        notes: device.notes || '',
      };
      
      console.log('DeviceCard: Navigation params:', editParams);
      console.log('DeviceCard: serial_number param:', editParams.serial_number);
      
      router.push({
        pathname: '/edit-item',
        params: editParams
      });
    }
  };

  // Reset image error when image URL changes
  React.useEffect(() => {
    setImageLoadError(false);
    
    // Test if the image URL is actually accessible
    if (device.photo_irl && isValidImageUrl(device.photo_irl)) {
      console.log('=== TESTING IMAGE ACCESSIBILITY ===');
      console.log('Testing URL:', device.photo_irl);
      
      // Test fetch to see if image is accessible
      fetch(device.photo_irl)
        .then(response => {
          console.log('Image fetch response status:', response.status);
          console.log('Image fetch response ok:', response.ok);
          if (!response.ok) {
            console.log('Image not accessible, setting error');
            setImageLoadError(true);
          }
        })
        .catch(error => {
          console.log('Image fetch error:', error);
          setImageLoadError(true);
        });
    }
  }, [device.photo_irl]);

  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'electronics':
        return '#007AFF'; // iOS system blue
      case 'automotive':
        return theme.colors.warning[500];
      case 'clothing':
      case 'cloth':
        return theme.colors.secondary[500];
      default:
        return theme.colors.neutral[500];
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'electronics':
        return '🔌';
      case 'automotive':
        return '🚗';
      case 'clothing':
      case 'cloth':
        return '👕';
      default:
        return '📦';
    }
  };

  // Helper function to get warranty status and color
  const getWarrantyStatus = () => {
    if (!device.warranty_end_date) return { status: 'No Warranty', color: theme.colors.neutral[500] };
    
    const endDate = new Date(device.warranty_end_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'Expired', color: theme.colors.error[500] };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'Expiring', color: theme.colors.warning[500] };
    } else {
      return { status: 'Active', color: theme.colors.success[500] };
    }
  };

  if (compact) {
    return (
      <View style={styles.compactCard}>
        <Pressable style={styles.compactCardContent} onPress={onPress}>
          <View style={styles.compactCardLeft}>
            <Text style={styles.compactDeviceName} numberOfLines={1}>
              {device.name}
            </Text>
            <Text style={styles.compactDeviceBrand} numberOfLines={1}>
              {device.brand || 'Unknown Brand'}
            </Text>
          </View>
          <View style={styles.compactCardRight}>
            {/* Compact view - no additional info needed */}
          </View>
        </Pressable>
        
        {/* Action Buttons for Compact View */}
        <View style={styles.compactActionButtonsContainer}>
          {/* Edit Button */}
          <View style={styles.editButtonContainer}>
            <Pressable style={styles.editButton} onPress={handleEdit}>
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          </View>
          
          {/* Delete Button */}
          {onDelete && (
            <View style={styles.deleteButtonContainer}>
              <Pressable style={styles.deleteButton} onPress={onDelete}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  }

  const warrantyStatus = getWarrantyStatus();

  return (
    <View style={styles.card}>
      {/* Warranty Status Badge - Top Right Corner of Entire Card */}
      <View style={[styles.warrantyBadge, { backgroundColor: warrantyStatus.color }]}>
        <Text style={styles.warrantyBadgeText}>{warrantyStatus.status}</Text>
      </View>

      <Pressable style={styles.cardContent} onPress={onPress}>
        {/* Device Image */}
        <View style={styles.imageContainer}>
          {device.photo_irl && isValidImageUrl(device.photo_irl) && !imageLoadError ? (
            <Image
              source={getImageSource(device.photo_irl)!}
              style={styles.deviceImage}
              resizeMode="cover"
              onError={() => setImageLoadError(true)}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>
                {getCategoryIcon(device.category)}
              </Text>
            </View>
          )}
          

        </View>

        {/* Device Info */}
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName} numberOfLines={2}>
            {device.name}
          </Text>
          
          {device.brand && (
            <Text style={styles.deviceBrand} numberOfLines={1}>
              {device.brand}
            </Text>
          )}
        </View>
      </Pressable>

      {/* Action Buttons - Bottom Right Corner */}
      <View style={styles.actionButtonsContainer}>
        {/* Edit Button */}
        <View style={styles.editButtonContainer}>
          <Pressable style={styles.editButton} onPress={handleEdit}>
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        </View>
        
        {/* Delete Button */}
        {onDelete && (
          <View style={styles.deleteButtonContainer}>
            <Pressable style={styles.deleteButton} onPress={onDelete}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white || '#ffffff',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.neutral?.[200] || '#e5e7eb',
    ...theme.shadows?.sm,
    position: 'relative', // Add this for absolute positioning of badges and delete button
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  imageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    backgroundColor: theme.colors.neutral?.[100] || '#f3f4f6',
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  deviceImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.md,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.neutral?.[200] || '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  placeholderText: {
    fontSize: 48,
  },

  warrantyBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  warrantyBadgeText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral?.[900] || '#111827',
    marginBottom: theme.spacing.xs,
  },
  deviceBrand: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral?.[600] || '#4b5563',
    marginBottom: theme.spacing.xs,
  },

  actionButtonsContainer: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  
  editButtonContainer: {
    // Container for edit button positioning
  },
  
  editButton: {
    backgroundColor: '#007AFF', // iOS system blue
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    height: 40,
    borderWidth: 2,
    borderColor: '#0056CC', // Darker iOS blue for border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  
  editButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },

  deleteButtonContainer: {
    // Container for delete button positioning
  },

  deleteButton: {
    backgroundColor: theme.colors.error?.[500] || '#ef4444', // Fallback to hex color
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    height: 40,
    borderWidth: 2,
    borderColor: theme.colors.error?.[600] || '#dc2626', // Fallback to hex color
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  compactCard: {
    backgroundColor: theme.colors.white || '#ffffff',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    width: '48%',
    minHeight: 120, // Ensure consistent height for all compact cards
    borderWidth: 1,
    borderColor: theme.colors.neutral?.[200] || '#e5e7eb',
    ...theme.shadows?.sm,
    position: 'relative', // For absolute positioning of action buttons
  },
  compactCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  compactCardLeft: {
    flex: 1,
  },
  compactCardRight: {
    alignItems: 'flex-end',
  },
  
  compactActionButtonsContainer: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  compactDeviceName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral?.[900] || '#111827',
    marginBottom: theme.spacing.xs,
  },
  compactDeviceBrand: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.neutral?.[600] || '#4b5563',
  },

});