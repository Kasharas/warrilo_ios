import { Platform } from 'react-native';

// ============================================================================
// PHASE 1: PLATFORM DETECTION & SERVICE ARCHITECTURE
// ============================================================================

// Platform detection constants
const isWeb = Platform.OS === 'web';
const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

// Unified compression interface
export interface CompressionOptions {
  maxSizeKB: number;        // Target file size in KB
  maxWidth: number;         // Maximum width in pixels
  maxHeight: number;        // Maximum height in pixels
  quality: number;          // Compression quality (0.1 - 1.0)
  format: 'jpeg' | 'webp' | 'png'; // Output format
}

// Default compression options
export const DEFAULT_COMPRESSION_OPTIONS: CompressionOptions = {
  maxSizeKB: 50,        // Target 50KB
  maxWidth: 800,        // Max width 800px
  maxHeight: 800,       // Max height 800px  
  quality: 0.8,         // Start with 80% quality
  format: 'jpeg'        // JPEG for better compression
};

// Compression result interface
export interface CompressionResult {
  success: boolean;
  compressedUri: string | null;
  originalSizeKB: number;
  compressedSizeKB: number;
  compressionRatio: number;
  error?: string;
  platform: string;
}

// ============================================================================
// PLATFORM-SPECIFIC COMPRESSION BACKENDS
// ============================================================================

/**
 * Web Platform Compression Backend
 * Uses HTML5 Canvas for image manipulation
 */
const webCompression = async (
  uri: string, 
  options: CompressionOptions
): Promise<CompressionResult> => {
  try {
    console.log('[Web] Starting image compression...');
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Calculate new dimensions maintaining aspect ratio
          const { width, height } = calculateDimensions(
            img.width, 
            img.height, 
            options.maxWidth, 
            options.maxHeight
          );
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          // Try different quality levels to hit target size
          compressToTargetSize(canvas, options).then((compressedData) => {
            const originalSizeKB = (uri.length * 0.75) / 1024;
            const compressedSizeKB = (compressedData.length * 0.75) / 1024;
            const compressionRatio = ((originalSizeKB - compressedSizeKB) / originalSizeKB) * 100;
            
            console.log(`[Web] Compression complete: ${originalSizeKB.toFixed(1)}KB → ${compressedSizeKB.toFixed(1)}KB (${compressionRatio.toFixed(1)}% reduction)`);
            
            resolve({
              success: true,
              compressedUri: compressedData,
              originalSizeKB,
              compressedSizeKB,
              compressionRatio,
              platform: 'web'
            });
          }).catch(reject);
          
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = uri;
    });
    
  } catch (error) {
    console.error('[Web] Compression failed:', error);
    return {
      success: false,
      compressedUri: null,
      originalSizeKB: 0,
      compressedSizeKB: 0,
      compressionRatio: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      platform: 'web'
    };
  }
};

/**
 * Mobile Platform Compression Backend
 * Uses expo-image-manipulator for native performance
 */
const mobileCompression = async (
  uri: string, 
  options: CompressionOptions,
  originalAsset?: any
): Promise<CompressionResult> => {
  try {
    console.log(`[${Platform.OS}] Starting native image compression...`);
    
    // Dynamic import to avoid bundling issues
    const ImageManipulator = require('expo-image-manipulator');
    
    // Get actual image dimensions first
    const imageInfo = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { format: ImageManipulator.SaveFormat.JPEG }
    );
    
    // Calculate dimensions based on actual image size
    const { width, height } = calculateDimensions(
      imageInfo.width,
      imageInfo.height,
      options.maxWidth,
      options.maxHeight
    );
    
    // Only resize if dimensions actually need to change (not for 9999 values)
    const needsResize = (options.maxWidth < 9999 && options.maxHeight < 9999) && 
                       (width !== imageInfo.width || height !== imageInfo.height);
    
    const result = await ImageManipulator.manipulateAsync(
      uri,
      needsResize ? [
        { 
          resize: { 
            width: Math.round(width), 
            height: Math.round(height) 
          } 
        }
      ] : [], // No resize operation if dimensions are fine
      {
        compress: options.quality,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false // Return file URI for mobile
      }
    );
    
    // Calculate compression metrics
    const originalSizeKB = Math.round((originalAsset?.fileSize || 0) / 1024);
    
    // Get compressed file size by reading the file
    let compressedSizeKB = 0;
    try {
      // For local file URIs, we need to use a different approach
      if (result.uri.startsWith('file://')) {
        // Use FileSystem to get file size
        const FileSystem = require('expo-file-system');
        const fileInfo = await FileSystem.getInfoAsync(result.uri);
        if (fileInfo.exists) {
          compressedSizeKB = Math.round((fileInfo.size || 0) / 1024);
        }
      } else {
        // For remote URIs, use fetch
        const response = await fetch(result.uri);
        const blob = await response.blob();
        compressedSizeKB = Math.round(blob.size / 1024);
      }
    } catch (error) {
      console.warn(`[${Platform.OS}] Could not get compressed file size:`, error);
    }
    
    const compressionRatio = originalSizeKB > 0 ? Math.round((1 - compressedSizeKB / originalSizeKB) * 100) : 0;
    
    console.log(`[${Platform.OS}] Native compression complete`);
    console.log(`[${Platform.OS}] Target: ${options.maxWidth}x${options.maxHeight}, Quality: ${options.quality}, MaxSize: ${options.maxSizeKB}KB`);
    console.log(`[${Platform.OS}] Original: ${imageInfo.width}x${imageInfo.height}, Compressed: ${width}x${height}`);
    console.log(`[${Platform.OS}] Result object:`, JSON.stringify(result, null, 2));
    console.log(`[${Platform.OS}] Result URI:`, result.uri);
    
    return {
      success: true,
      compressedUri: result.uri,
      originalSizeKB,
      compressedSizeKB,
      compressionRatio,
      platform: Platform.OS
    };
    
  } catch (error) {
    console.error(`[${Platform.OS}] Native compression failed:`, error);
    return {
      success: false,
      compressedUri: null,
      originalSizeKB: 0,
      compressedSizeKB: 0,
      compressionRatio: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      platform: Platform.OS
    };
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate new dimensions maintaining aspect ratio
 */
const calculateDimensions = (
  originalWidth: number, 
  originalHeight: number, 
  maxWidth: number, 
  maxHeight: number
) => {
  // For no-resize cases (9999 values), keep original dimensions
  if (maxWidth >= 9999 || maxHeight >= 9999) {
    return {
      width: originalWidth,
      height: originalHeight
    };
  }
  
  // For other cases, maintain aspect ratio
  const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio)
  };
};

/**
 * Web-specific: Compress canvas to target size
 */
const compressToTargetSize = async (
  canvas: HTMLCanvasElement, 
  options: CompressionOptions
): Promise<string> => {
  let quality = options.quality;
  let result = '';
  let attempts = 0;
  const maxAttempts = 8;
  
  while (attempts < maxAttempts) {
    result = canvas.toDataURL(`image/${options.format}`, quality);
    
    // Calculate size in KB
    const sizeKB = (result.length * 0.75) / 1024;
    
    console.log(`[Web] Compression attempt ${attempts + 1}: ${sizeKB.toFixed(1)}KB at quality ${quality.toFixed(2)}`);
    
    if (sizeKB <= options.maxSizeKB || quality <= 0.1) {
      break;
    }
    
    // Reduce quality for next attempt
    quality *= 0.8;
    attempts++;
  }
  
  return result;
};

// ============================================================================
// MAIN COMPRESSION FUNCTION
// ============================================================================

/**
 * Main cross-platform image compression function
 * Automatically selects appropriate backend based on platform
 */
export const compressImage = async (
  imageUri: string, 
  options: Partial<CompressionOptions> = {},
  originalAsset?: any
): Promise<CompressionResult> => {
  const opts = { ...DEFAULT_COMPRESSION_OPTIONS, ...options };
  
  console.log(`[${Platform.OS}] Starting image compression with options:`, opts);
  
  try {
    // Platform-specific compression
    if (isWeb) {
      return await webCompression(imageUri, opts);
    } else if (isMobile) {
      return await mobileCompression(imageUri, opts, originalAsset);
    } else {
      throw new Error(`Unsupported platform: ${Platform.OS}`);
    }
    
  } catch (error) {
    console.error(`[${Platform.OS}] Compression failed:`, error);
    return {
      success: false,
      compressedUri: null,
      originalSizeKB: 0,
      compressedSizeKB: 0,
      compressionRatio: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      platform: Platform.OS
    };
  }
};

// ============================================================================
// SPECIALIZED COMPRESSION FUNCTIONS
// ============================================================================

/**
 * Compress device photos with optimized settings
 */
export const compressDevicePhoto = async (imageUri: string, originalAsset?: any): Promise<CompressionResult> => {
  return compressImage(imageUri, {
    maxSizeKB: 150, // Target 150KB or less
    maxWidth: 9999, // No resizing - keep original width
    maxHeight: 9999, // No resizing - keep original height
    quality: 0.3,    // Very aggressive compression (30% quality)
    format: 'jpeg'
  }, originalAsset);
};

/**
 * Compress receipt photos with text-optimized settings
 */
export const compressReceipt = async (imageUri: string, originalAsset?: any): Promise<CompressionResult> => {
  return compressImage(imageUri, {
    maxSizeKB: 150, // Target 150KB or less
    maxWidth: 9999, // No resizing - keep original width
    maxHeight: 9999, // No resizing - keep original height
    quality: 0.3,    // Very aggressive compression (30% quality)
    format: 'jpeg'
  }, originalAsset);
};

/**
 * Compress profile photos with balanced settings
 */
export const compressProfilePhoto = async (imageUri: string): Promise<CompressionResult> => {
  return compressImage(imageUri, {
    maxSizeKB: 100,
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.8,
    format: 'jpeg'
  });
};

// ============================================================================
// PLATFORM DETECTION EXPORTS
// ============================================================================

export const platformInfo = {
  isWeb,
  isMobile,
  platform: Platform.OS,
  supportsCompression: isWeb || isMobile
};

export default compressImage;
