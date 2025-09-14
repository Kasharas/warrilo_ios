import { supabase } from '../../lib/supabaseClient'

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

    // ✅ FIXED: Images are already compressed from the add/edit device screen
    // No need to compress again - use the compressed URI directly
    console.log('Using pre-compressed device photo for upload...');
    const imageUriForUpload = photo.uri; // Already compressed from local storage

    // Generate unique filename (always JPEG after compression)
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`

    // For React Native, we need to read the file as ArrayBuffer directly
    const response = await fetch(imageUriForUpload);
    const arrayBuffer = await response.arrayBuffer();

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('device-photos')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
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
