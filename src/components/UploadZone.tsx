import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Platform } from 'react-native';
import { Camera, Upload, X } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';

interface UploadZoneProps {
  title?: string;
  onCameraPress: () => void;
  onLibraryPress: () => void;
  selectedImage: string | null;
  onRemoveImage?: () => void;
  isRequired?: boolean;
}

export const UploadZone = memo(({ 
  title, 
  onCameraPress, 
  onLibraryPress, 
  selectedImage, 
  onRemoveImage,
  isRequired = false 
}: UploadZoneProps) => {
  // Only log when image changes, not on every render
  React.useEffect(() => {
    if (selectedImage) {
      console.log('UploadZone: Image updated:', selectedImage.substring(0, 50) + '...');
    }
  }, [selectedImage]);
  
  if (selectedImage) {
    // Handle both base64 and regular URIs
    const imageSource = selectedImage.startsWith('data:image/') 
      ? { uri: selectedImage }
      : { uri: selectedImage };
    
    return (
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image 
            source={imageSource} 
            style={styles.selectedImage}
            resizeMode="cover"
            onLoad={() => console.log('Image loaded successfully')}
            onError={(error) => console.error('Image load error:', error.nativeEvent)}
          />
          {onRemoveImage && (
            <Pressable style={styles.removeButton} onPress={onRemoveImage}>
              <X size={16} color={theme.colors.white} />
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <Pressable style={styles.actionButton} onPress={onCameraPress}>
          <Camera size={24} color={theme.colors.neutral[600]} />
        </Pressable>
        <Pressable style={styles.actionButton} onPress={onLibraryPress}>
          <Upload size={24} color={theme.colors.neutral[600]} />
        </Pressable>
      </View>
    </View>
  );
});

UploadZone.displayName = 'UploadZone';

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.xs,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  imageContainer: {
    position: 'relative',
    marginBottom: 0,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.neutral[100],
  },
  removeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.error[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});