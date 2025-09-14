import { supabase } from '../../lib/supabaseClient'
import { uploadDevicePhoto } from '../utils/uploadDevicePhoto'
import { Database } from '../lib/supabase'

type DevicePhotoInsert = Database['public']['Tables']['device_photos']['Insert']

interface AdditionalPhoto {
  uri: string
  name: string
  type: string
}

export const uploadAdditionalPhotos = async (
  deviceId: string,
  userId: string,
  additionalPhotos: AdditionalPhoto[]
): Promise<{ success: boolean; error?: string }> => {
  if (!additionalPhotos || additionalPhotos.length === 0) {
    return { success: true }
  }

  try {
    // Upload all additional photos
    const uploadPromises = additionalPhotos.map(photo =>
      uploadDevicePhoto({ userId, photo })
    )

    const uploadResults = await Promise.all(uploadPromises)

    // Check for upload failures
    const failedUploads = uploadResults.filter(result => !result.success)
    if (failedUploads.length > 0) {
      return {
        success: false,
        error: `Failed to upload ${failedUploads.length} photos`
      }
    }

    // Prepare device_photos records
    const devicePhotos: DevicePhotoInsert[] = uploadResults
      .filter(result => result.url)
      .map((result, index) => ({
        device_id: deviceId,
        photo_url: result.url!,
        upload_order: index + 2 // Start from 2 since main photo is order 1
      }))

    // Insert into device_photos table
    if (devicePhotos.length > 0) {
      const { error: insertError } = await supabase
        .from('device_photos')
        .insert(devicePhotos)

      if (insertError) {
        console.error('Additional photos insertion error:', insertError)
        return {
          success: false,
          error: 'Failed to save additional photos to database'
        }
      }
    }

    return { success: true }

  } catch (error) {
    console.error('Additional photos service error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while uploading additional photos'
    }
  }
}
