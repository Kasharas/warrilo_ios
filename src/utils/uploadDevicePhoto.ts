import { supabase } from '../../lib/supabaseClient'
import { File } from 'expo-file-system'
import { decode } from 'base64-arraybuffer'

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
  console.log('🔵 [STEP 4c: PHOTO] uploadDevicePhoto started (FileSystem)', { type: photo.type });
  try {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(photo.type)) {
      console.error('❌ [STEP 4c: FAILED] Invalid type:', photo.type);
      return { success: false, error: 'Invalid file type.' }
    }

    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`

    console.log('🔵 [STEP 4c: READING] Reading file from disk via modern File API:', photo.uri);

    // Use modern SDK 54 File API (Native)
    const file = new File(photo.uri);
    const base64 = await file.base64();
    console.log('   -> Read success. Base64 length:', base64.length);

    // Decode base64 to ArrayBuffer using base64-arraybuffer
    const arrayBuffer = decode(base64);
    console.log('   -> Converted to ArrayBuffer. Size:', arrayBuffer.byteLength);

    console.log('🔵 [STEP 4c: SUPABASE] Uploading to device-photos...');
    const { error: uploadError } = await supabase.storage
      .from('device-photos')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ [STEP 4c: FAILED] Supabase error:', uploadError);
      return { success: false, error: uploadError.message }
    }

    // Return the relative path (not public URL) for private buckets
    console.log('✅ [STEP 4c: SUCCESS] File path:', fileName);
    return { success: true, url: fileName }  // Store path, not public URL

  } catch (error) {
    console.error('❌ [STEP 4c: FATAL ERROR]', error);
    return { success: false, error: 'Failed (FS)' }
  }
}
