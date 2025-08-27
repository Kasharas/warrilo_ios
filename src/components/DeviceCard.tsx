import React, { memo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Platform } from 'react-native';
import { MoreVertical } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { WarrantyBadge } from './WarrantyBadge';

// Define interface for real device data from Supabase
interface Device {
  id: string;
  name: string;
  brand?: string;

  category?: string;
  purchase_price?: number;
  image_url?: string; // Direct URL to device image
  created_at: string;
}

interface DeviceCardProps {
  device: Device;
  onPress: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

export function DeviceCard({ device, onPress, onDelete, compact = false }: DeviceCardProps) {
  console.log('DeviceCard rendered with onDelete:', !!onDelete);
  
  // Mock warranty data - no more Supabase fetching
  const [warrantyData] = useState<any>(null);
  
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

  // Reset image error when image URL changes
  React.useEffect(() => {
    setImageLoadError(false);
    
    // Test if the image URL is actually accessible
    if (device.image_url && isValidImageUrl(device.image_url)) {
      console.log('=== TESTING IMAGE ACCESSIBILITY ===');
      console.log('Testing URL:', device.image_url);
      
      // Test fetch to see if image is accessible
      fetch(device.image_url)
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
  }, [device.image_url]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return `$${price.toLocaleString()}`;
  };

  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'electronics':
        return theme.colors.primary[500];
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

  if (compact) {
    return (
      <Pressable style={styles.compactCard} onPress={onPress}>
        <View style={styles.compactCardContent}>
          <View style={styles.compactCardLeft}>
            <Text style={styles.compactDeviceName} numberOfLines={1}>
              {device.name}
            </Text>
            <Text style={styles.compactDeviceBrand} numberOfLines={1}>
              {device.brand || 'Unknown Brand'}
            </Text>
          </View>
          <View style={styles.compactCardRight}>
            <Text style={styles.compactDevicePrice}>
              {formatPrice(device.purchase_price)}
            </Text>
            <WarrantyBadge warranty={warrantyData} compact />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      <Pressable style={styles.cardContent} onPress={onPress}>
        {/* Device Image */}
        <View style={styles.imageContainer}>
          {device.image_url && isValidImageUrl(device.image_url) && !imageLoadError ? (
            <Image
              source={getImageSource(device.image_url)!}
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
          
          {/* Category Badge */}
          {device.category && (
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(device.category) }]}>
              <Text style={styles.categoryBadgeText}>{device.category}</Text>
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
          

          
          <View style={styles.deviceMeta}>
            <Text style={styles.devicePrice}>
              {formatPrice(device.purchase_price)}
            </Text>
            <Text style={styles.deviceDate}>
              {formatDate(device.created_at)}
            </Text>
          </View>
        </View>

        {/* Warranty Badge */}
        <View style={styles.warrantyContainer}>
          <WarrantyBadge warranty={warrantyData} />
        </View>
      </Pressable>

      {/* Action Buttons */}
      {onDelete && (
        <View style={styles.actionButtons}>
          <Pressable style={styles.deleteButton} onPress={onDelete}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white || '#ffffff',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows?.sm,
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
  },
  placeholderText: {
    fontSize: 48,
  },
  categoryBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    zIndex: 1,
  },
  categoryBadgeText: {
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

  deviceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  devicePrice: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral?.[900] || '#111827',
  },
  deviceDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.neutral?.[500] || '#6b7280',
  },
  warrantyContainer: {
    marginTop: theme.spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.md,
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
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.error?.[500] || '#ef4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
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
    ...theme.shadows?.sm,
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
  compactDevicePrice: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral?.[900] || '#111827',
  },
});