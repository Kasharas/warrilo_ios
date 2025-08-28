import { supabase } from '../lib/supabase'
import { compressDevicePhoto } from '../lib/imageCompression'

interface PhotoUploadOptions {
  userId: string
  photo: {
    uri: string
    name: string
    type: string
  }
}

export const uploadDevicePhoto = async ({ 
  userId, 
  photo 
}: PhotoUploadOptions): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(photo.type)) {
      return { 
        success: false, 
        error: 'Invalid file type. Please use JPEG, PNG, WebP, or GIF.' 
      }
    }

    // Step 1: Compress the image
    console.log('Compressing device photo...');
    const compressedImageUri = await compressDevicePhoto(photo.uri);
    console.log('Device photo compressed successfully');

    // Generate unique filename (always JPEG after compression)
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`

    // Convert compressed URI to blob for upload
    const response = await fetch(compressedImageUri)
    const blob = await response.blob()

    // Check file size (10MB limit)
    if (blob.size > 10 * 1024 * 1024) {
      return { 
        success: false, 
        error: 'File size too large. Maximum size is 10MB.' 
      }
    }

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('device-photos')
      .upload(fileName, blob, {
        contentType: 'image/jpeg', // Always JPEG after compression
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { 
        success: false, 
        error: uploadError.message 
      }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('device-photos')
      .getPublicUrl(fileName)

    return { 
      success: true, 
      url: publicUrl 
    }

  } catch (error) {
    console.error('Device photo upload error:', error)
    return { 
      success: false, 
      error: 'Failed to upload device photo' 
    }
  }
}
