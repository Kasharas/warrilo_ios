interface CompressionOptions {
  maxSizeKB: number;
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'jpeg' | 'webp';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeKB: 50,        // Target 50KB
  maxWidth: 800,        // Max width 800px
  maxHeight: 800,       // Max height 800px  
  quality: 0.8,         // Start with 80% quality
  format: 'jpeg'        // JPEG for better compression
};

export const compressImage = async (
  imageUri: string, 
  options: Partial<CompressionOptions> = {}
): Promise<string> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate new dimensions maintaining aspect ratio
      const { width, height } = calculateDimensions(
        img.width, 
        img.height, 
        opts.maxWidth, 
        opts.maxHeight
      );
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      // Try different quality levels to hit target size
      compressToTargetSize(canvas, opts).then(resolve).catch(reject);
    };
    
    img.onerror = reject;
    img.src = imageUri;
  });
};

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
    const sizeKB = (result.length * 0.75) / 1024; // Base64 to bytes conversion
    
    console.log(`Compression attempt ${attempts + 1}: ${sizeKB.toFixed(1)}KB at quality ${quality}`);
    
    if (sizeKB <= options.maxSizeKB || quality <= 0.1) {
      break;
    }
    
    // Reduce quality for next attempt
    quality *= 0.8;
    attempts++;
  }
  
  return result;
};

// Specific functions for different image types
export const compressDevicePhoto = async (imageUri: string): Promise<string> => {
  return compressImage(imageUri, {
    maxSizeKB: 50,
    maxWidth: 600,
    maxHeight: 600,
    quality: 0.85,
    format: 'jpeg'
  });
};

export const compressReceipt = async (imageUri: string): Promise<string> => {
  return compressImage(imageUri, {
    maxSizeKB: 50,
    maxWidth: 800,    // Receipts might need more width for text
    maxHeight: 1200,  // Receipts are usually tall
    quality: 0.9,     // Higher quality for text readability
    format: 'jpeg'
  });
};
