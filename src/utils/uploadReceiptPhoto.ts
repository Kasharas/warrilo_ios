import { supabase } from '../../lib/supabaseClient'
// ✅ FIXED: Removed unused import since we're no longer compressing here

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
  try {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg', 
      'image/png', 
      'image/webp'
    ]
    if (!allowedTypes.includes(receipt.type)) {
      return { 
        success: false, 
        error: 'Invalid file type. Please use PDF, JPEG, PNG, or WebP.' 
      }
    }

    // Handle PDFs differently (no compression needed)
    if (receipt.type === 'application/pdf') {
      // Generate unique filename for PDF
      const fileName = `${userId}/${Date.now()}-invoice-${Math.random().toString(36).substring(7)}.pdf`
      
      // For React Native, read the file as ArrayBuffer directly
      const response = await fetch(receipt.uri);
      const arrayBuffer = await response.arrayBuffer();

      // Upload PDF to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('device-invoices')
        .upload(fileName, arrayBuffer, {
          contentType: receipt.type,
          upsert: false
        })

      if (uploadError) {
        console.error('Receipt upload error:', uploadError)
        return { 
          success: false, 
          error: uploadError.message 
        }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('device-invoices')
        .getPublicUrl(fileName)

      return { 
        success: true, 
        url: publicUrl 
      }
    }

    // ✅ FIXED: Image receipts are already compressed from the add/edit device screen
    // No need to compress again - use the compressed URI directly
    console.log('Using pre-compressed receipt image for upload...');
    const imageUriForUpload = receipt.uri; // Already compressed from local storage

    // Generate unique filename for compressed image
    const fileExtension = 'jpg' // Always JPEG after compression
    const fileName = `${userId}/${Date.now()}-invoice-${Math.random().toString(36).substring(7)}.${fileExtension}`

    // For React Native, read the file as ArrayBuffer directly
    const response = await fetch(imageUriForUpload);
    const arrayBuffer = await response.arrayBuffer();

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('device-invoices')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg', // Always JPEG after compression
        upsert: false
      })

    if (uploadError) {
      console.error('Receipt upload error:', uploadError)
      return { 
        success: false, 
        error: uploadError.message 
      }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('device-invoices')
      .getPublicUrl(fileName)

    return { 
      success: true, 
      url: publicUrl 
    }

  } catch (error) {
    console.error('Receipt upload error:', error)
    return { 
      success: false, 
      error: 'Failed to upload receipt' 
    }
  }
}
