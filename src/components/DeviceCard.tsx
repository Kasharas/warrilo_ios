import React, { memo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Platform } from 'react-native';
import { MoreVertical } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { WarrantyBadge } from './WarrantyBadge';
import { supabase } from '../../lib/supabaseClient';

// Define interface for real device data from Supabase
interface Device {
  id: string;
  name: string;
  brand?: string;
  model?: string; // Added model field
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
  
  const [warrantyData, setWarrantyData] = useState<any>(null);
  
  // Fetch warranty data for this device
  useEffect(() => {
    const fetchWarranty = async () => {
      try {
        const { data: warranty, error } = await supabase
          .from('warranties')
          .select('*')
          .eq('device_id', device.id)
          .single();
        
        if (!error && warranty) {
          setWarrantyData(warranty);
        }
      } catch (error) {
        console.error('Error fetching warranty:', error);
      }
    };
    
    fetchWarranty();
  }, [device.id]);
  
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
          console.log('Image not accessible, setting error');
          setImageLoadError(true);
        });
    }
  }, [device.image_url]);

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

  const warrantyStatus = getWarrantyStatus();
  const getCategoryEmoji = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'electronics': return '📱';
      case 'cloth': return '👕';
      case 'automotive': return '🚗';
      case 'other': return '📦';
      default: return '📦';
    }
  };

  // Now that all functions are defined, we can safely call them in console.log
  console.log('=== DEVICE CARD DEBUG ===');
  console.log('Device ID:', device.id);
  console.log('Device name:', device.name);
  console.log('Device image_url:', device.image_url);
  console.log('Device image_url type:', typeof device.image_url);
  console.log('Device image_url length:', device.image_url?.length);
  console.log('isValidImageUrl result:', isValidImageUrl(device.image_url));
  console.log('getImageSource result:', getImageSource(device.image_url));
  console.log('imageLoadError state:', imageLoadError);

  if (compact) {
    return (
      <Pressable style={styles.compactCard} onPress={onPress}>
        <View style={styles.compactImage}>
          {isValidImageUrl(device.image_url) && !imageLoadError ? (
            <Image 
              source={getImageSource(device.image_url)!}
              style={styles.compactImageContent}
              resizeMode="cover"
              onError={(error) => {
                console.log('=== IMAGE LOAD ERROR ===');
                console.log('Error loading image:', error);
                console.log('Image source:', getImageSource(device.image_url));
                console.log('Setting imageLoadError to true');
                setImageLoadError(true);
              }}
              onLoad={() => {
                console.log('=== IMAGE LOAD SUCCESS ===');
                console.log('Image loaded successfully for device:', device.name);
                console.log('Image source:', getImageSource(device.image_url));
              }}
            />
          ) : (
            <Text style={styles.compactEmoji}>{getCategoryEmoji(device.category)}</Text>
          )}
        </View>
        <Text style={styles.compactName}>{device.name}</Text>
        <Text style={[
          styles.compactStatus,
          warrantyStatus === 'active' && { color: theme.colors.success?.[500] || '#10b981' },
          warrantyStatus === 'expiring' && { color: theme.colors.warning?.[500] || '#f59e0b' },
          warrantyStatus === 'expired' && { color: theme.colors.error?.[500] || '#ef4444' },
          warrantyStatus === 'no-warranty' && { color: theme.colors.neutral?.[500] || '#6b7280' },
        ]}>
          {warrantyStatus === 'active' ? 'Active' : 
           warrantyStatus === 'expiring' ? 'Expiring' : 
           warrantyStatus === 'expired' ? 'Expired' : 'No Warranty'}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardContent}>
        <View style={styles.deviceImage}>
          {isValidImageUrl(device.image_url) && !imageLoadError ? (
            <Image 
              source={getImageSource(device.image_url)!}
              style={styles.deviceImageContent}
              resizeMode="cover"
              onError={(error) => {
                console.log('=== IMAGE LOAD ERROR (REGULAR) ===');
                console.log('Error loading image:', error);
                console.log('Image source:', getImageSource(device.image_url));
                console.log('Setting imageLoadError to true');
                setImageLoadError(true);
              }}
              onLoad={() => {
                console.log('=== IMAGE LOAD SUCCESS (REGULAR) ===');
                console.log('Image loaded successfully for device:', device.name);
                console.log('Image source:', getImageSource(device.image_url));
              }}
            />
          ) : (
            <Text style={styles.deviceEmoji}>{getCategoryEmoji(device.category)}</Text>
          )}
        </View>
        
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{device.name}</Text>
          <Text style={styles.deviceDetails}>
            {device.brand || 'No brand'} • ${(device.purchase_price || 0).toLocaleString()}
          </Text>
          <Text style={[
            styles.warrantyText,
            warrantyStatus === 'active' && { color: theme.colors.success?.[500] || '#10b981' },
            warrantyStatus === 'expiring' && { color: theme.colors.warning?.[500] || '#f59e0b' },
            warrantyStatus === 'expired' && { color: theme.colors.error?.[500] || '#ef4444' },
            warrantyStatus === 'no-warranty' && { color: theme.colors.neutral?.[500] || '#6b7280' },
          ]}>
            {warrantyStatus === 'active' && warrantyData && 
              `Warranty active until ${new Date(warrantyData.end_date).toLocaleDateString()}`}
            {warrantyStatus === 'expiring' && warrantyData && 
              `⚠ Expires in ${Math.ceil((new Date(warrantyData.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`}
            {warrantyStatus === 'expired' && 'Warranty expired'}
            {warrantyStatus === 'no-warranty' && 'No warranty information'}
          </Text>
        </View>
        
        {onDelete && (
          <View style={styles.deleteButtonContainer}>
            <Pressable 
              style={styles.deleteButton} 
              onPress={() => {
                console.log('Delete button pressed in DeviceCard');
                onDelete();
              }}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
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
  deviceImage: {
    width: 120, // Increased from 60 to 120 (twice as big)
    height: 120, // Increased from 60 to 120 (twice as big)
    backgroundColor: theme.colors.neutral?.[100] || '#f3f4f6',
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceEmoji: {
    fontSize: 48, // Increased from 24 to 48 (twice as big to match larger container)
  },
  deviceImageContent: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.md,
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
  deviceDetails: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral?.[600] || '#4b5563',
    marginBottom: theme.spacing.xs,
  },
  warrantyText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  moreButton: {
    padding: theme.spacing.sm,
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
  compactImage: {
    width: 120, // Increased from 60 to 120 (twice as big)
    height: 120, // Increased from 60 to 120 (twice as big)
    backgroundColor: theme.colors.neutral?.[100] || '#f3f4f6',
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  compactEmoji: {
    fontSize: 48, // Increased from 24 to 48 (twice as big to match larger container)
  },
  compactImageContent: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.md,
  },
  compactName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral?.[900] || '#111827',
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  compactStatus: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    textAlign: 'center',
  },
  deleteButtonContainer: {
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
});