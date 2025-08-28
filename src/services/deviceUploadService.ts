import { supabase } from '../lib/supabase'
import { AddDeviceFormData, DeviceFileData, DeviceUploadResult } from '../types/device'
import { uploadDevicePhoto } from '../utils/uploadDevicePhoto'
import { uploadReceiptPhoto } from '../utils/uploadReceiptPhoto'
import { prepareDeviceData } from '../utils/prepareDeviceData'

export const uploadDevice = async (
  formData: AddDeviceFormData,
  fileData: DeviceFileData,
  userId: string
): Promise<DeviceUploadResult> => {
  try {
    // Step 1: Upload files in parallel
    const uploadPromises: Promise<any>[] = []
    
    if (fileData.devicePhoto) {
      uploadPromises.push(
        uploadDevicePhoto({ 
          userId, 
          photo: fileData.devicePhoto 
        })
      )
    } else {
      uploadPromises.push(Promise.resolve({ success: true, url: null }))
    }

    if (fileData.receiptPhoto) {
      uploadPromises.push(
        uploadReceiptPhoto({ 
          userId, 
          receipt: fileData.receiptPhoto 
        })
      )
    } else {
      uploadPromises.push(Promise.resolve({ success: true, url: null }))
    }

    const [photoResult, receiptResult] = await Promise.all(uploadPromises)

    // Check for upload errors
    if (!photoResult.success) {
      return { 
        success: false, 
        error: `Photo upload failed: ${photoResult.error}` 
      }
    }

    if (!receiptResult.success) {
      return { 
        success: false, 
        error: `Receipt upload failed: ${receiptResult.error}` 
      }
    }

    // Step 2: Prepare device data
    const deviceData = prepareDeviceData(
      formData,
      photoResult.url || null,
      receiptResult.url || null,
      userId
    )

    // Step 3: Insert device into database
    const { data: device, error: insertError } = await supabase
      .from('devices')
      .insert(deviceData)
      .select()
      .single()

    if (insertError) {
      console.error('Device insertion error:', insertError)
      
      // Rollback: Delete uploaded files if database insertion fails
      if (photoResult.url) {
        const photoPath = photoResult.url.split('/').slice(-2).join('/')
        await supabase.storage.from('device-photos').remove([photoPath])
      }
      if (receiptResult.url) {
        const receiptPath = receiptResult.url.split('/').slice(-2).join('/')
        await supabase.storage.from('device-invoices').remove([receiptPath])
      }

      return { 
        success: false, 
        error: insertError.message 
      }
    }

    return { 
      success: true, 
      deviceId: device.id 
    }

  } catch (error) {
    console.error('Device upload service error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred during upload' 
    }
  }
}
