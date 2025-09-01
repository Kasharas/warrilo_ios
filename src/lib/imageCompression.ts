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
  options: CompressionOptions
): Promise<CompressionResult> => {
  try {
    console.log(`[${Platform.OS}] Starting native image compression...`);
    
    // Dynamic import to avoid bundling issues
    const ImageManipulator = require('expo-image-manipulator');
    
    // Calculate dimensions
    const { width, height } = calculateDimensions(
      1920, // Default width, will be updated with actual image dimensions
      1080, // Default height, will be updated with actual image dimensions
      options.maxWidth,
      options.maxHeight
    );
    
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        { 
          resize: { 
            width: Math.round(width), 
            height: Math.round(height) 
          } 
        }
      ],
      {
        compress: options.quality,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false // Return file URI for mobile
      }
    );
    
    // Calculate compression metrics
    const originalSizeKB = 0; // Will be updated when we implement size detection
    const compressedSizeKB = 0; // Will be updated when we implement size detection
    const compressionRatio = 0; // Will be calculated
    
    console.log(`[${Platform.OS}] Native compression complete`);
    
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
  options: Partial<CompressionOptions> = {}
): Promise<CompressionResult> => {
  const opts = { ...DEFAULT_COMPRESSION_OPTIONS, ...options };
  
  console.log(`[${Platform.OS}] Starting image compression with options:`, opts);
  
  try {
    // Platform-specific compression
    if (isWeb) {
      return await webCompression(imageUri, opts);
    } else if (isMobile) {
      return await mobileCompression(imageUri, opts);
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
export const compressDevicePhoto = async (imageUri: string): Promise<CompressionResult> => {
  return compressImage(imageUri, {
    maxSizeKB: 50,
    maxWidth: 600,
    maxHeight: 600,
    quality: 0.85,
    format: 'jpeg'
  });
};

/**
 * Compress receipt photos with text-optimized settings
 */
export const compressReceipt = async (imageUri: string): Promise<CompressionResult> => {
  return compressImage(imageUri, {
    maxSizeKB: 50,
    maxWidth: 800,    // Receipts might need more width for text
    maxHeight: 1200,  // Receipts are usually tall
    quality: 0.9,     // Higher quality for text readability
    format: 'jpeg'
  });
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
