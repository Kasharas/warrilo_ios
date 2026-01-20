import { supabase } from '../../lib/supabaseClient'
import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'

interface ReceiptUploadOptions {
  userId: string
  receipt: {
    uri: string
    name: string
    type: string
  }
}

export const uploadReceiptPhoto = async ({
  userId,
  receipt
}: ReceiptUploadOptions): Promise<{ success: boolean; url?: string; error?: string }> => {
  console.log('🔵 [STEP 4: UTILS] uploadReceiptPhoto started (FileSystem)', { type: receipt.type });
  try {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
    if (!allowedTypes.includes(receipt.type)) {
      console.error('❌ [STEP 4: FAILED] Invalid file type:', receipt.type);
      return {
        success: false,
        error: 'Invalid file type. Please use PDF, JPEG, PNG, or WebP.'
      }
    }

    const fileExtension = receipt.type === 'application/pdf' ? 'pdf' : 'jpg'
    const fileName = `${userId}/${Date.now()}-invoice-${Math.random().toString(36).substring(7)}.${fileExtension}`

    console.log('🔵 [STEP 4a: READING] Reading file from disk via FileSystem:', receipt.uri);

    // Use expo-file-system to read as Base64 (Reliable)
    const base64 = await FileSystem.readAsStringAsync(receipt.uri, {
      encoding: FileSystem.EncodingType.Base64
    });
    console.log('   -> Read success. Base64 length:', base64.length);

    // Decode base64 to ArrayBuffer using base64-arraybuffer
    const arrayBuffer = decode(base64);
    console.log('   -> Converted to ArrayBuffer. Size:', arrayBuffer.byteLength);

    console.log('🔵 [STEP 4b: SUPABASE] Uploading to device-invoices...');
    const { error: uploadError } = await supabase.storage
      .from('device-invoices')
      .upload(fileName, arrayBuffer, {
        contentType: receipt.type === 'application/pdf' ? 'application/pdf' : 'image/jpeg',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ [STEP 4b: FAILED] Supabase error:', uploadError);
      return { success: false, error: uploadError.message }
    }

    // Return the relative path (not public URL) for private buckets
    console.log('✅ [STEP 4b: SUCCESS] File path:', fileName);
    return { success: true, url: fileName }  // Store path, not public URL

  } catch (error) {
    console.error('❌ [STEP 4: FATAL ERROR]', error);
    return { success: false, error: 'Failed to upload receipt (FS)' }
  }
}
