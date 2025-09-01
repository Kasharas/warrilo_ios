/**
 * Validates that a URI points to an actual image file, not HTML or other content
 */

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  mimeType?: string;
  size?: number;
}

export const validateImageUri = async (uri: string): Promise<ImageValidationResult> => {
  try {
    // Check if URI is empty or null
    if (!uri || typeof uri !== 'string') {
      return {
        isValid: false,
        error: 'Invalid URI: URI is empty or null'
      };
    }

    // Check for common invalid URI patterns
    if (uri.includes('<!DOCTYPE html>') || uri.includes('<html') || uri.includes('<!DOCTYPE')) {
      return {
        isValid: false,
        error: 'Invalid URI: URI points to HTML content instead of an image'
      };
    }

    // Check for valid image URI patterns
    const validImagePatterns = [
      /^blob:/,           // Blob URLs
      /^data:image\//,    // Data URLs
      /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i,  // HTTP URLs with image extensions
      /^file:\/\//,       // File URLs (mobile)
      /^content:\/\//,    // Content URLs (Android)
      /^ph:\/\//,         // Photo library URLs (iOS)
    ];

    const isImageUri = validImagePatterns.some(pattern => pattern.test(uri));
    if (!isImageUri) {
      return {
        isValid: false,
        error: `Invalid URI: URI does not match valid image patterns: ${uri}`
      };
    }

    // For web platform, try to fetch and validate the actual content
    if (typeof window !== 'undefined' && (uri.startsWith('blob:') || uri.startsWith('data:'))) {
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        
        // Check MIME type
        if (!blob.type.startsWith('image/')) {
          return {
            isValid: false,
            error: `Invalid content: MIME type is ${blob.type}, expected image/*`
          };
        }

        // Check file size (reasonable limits)
        if (blob.size === 0) {
          return {
            isValid: false,
            error: 'Invalid content: File size is 0 bytes'
          };
        }

        if (blob.size > 50 * 1024 * 1024) { // 50MB limit
          return {
            isValid: false,
            error: `Invalid content: File size ${(blob.size / (1024 * 1024)).toFixed(1)}MB exceeds 50MB limit`
          };
        }

        return {
          isValid: true,
          mimeType: blob.type,
          size: blob.size
        };
      } catch (fetchError) {
        return {
          isValid: false,
          error: `Failed to fetch image content: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`
        };
      }
    }

    // For mobile platforms or other URIs, assume valid if they pass pattern checks
    return {
      isValid: true,
      mimeType: 'unknown',
      size: 0
    };

  } catch (error) {
    return {
      isValid: false,
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Quick check for obviously invalid URIs without async operations
 */
export const isObviouslyInvalidUri = (uri: string): boolean => {
  if (!uri || typeof uri !== 'string') return true;
  
  // Check for HTML content
  if (uri.includes('<!DOCTYPE html>') || uri.includes('<html') || uri.includes('<!DOCTYPE')) {
    return true;
  }
  
  // Check for current page URL patterns
  if (uri.includes('localhost:8081') || uri.includes('localhost:3000')) {
    return true;
  }
  
  // Check for empty or very short URIs
  if (uri.length < 10) return true;
  
  return false;
};
