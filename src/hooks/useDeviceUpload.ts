import { useState } from 'react'
import { AddDeviceFormData, DeviceFileData } from '../types/device'
import { validateDeviceForm } from '../utils/validateDeviceForm'
import { uploadDevice } from '../services/deviceUploadService'
import { uploadAdditionalPhotos } from '../services/additionalPhotosService'

interface UseDeviceUploadResult {
  isUploading: boolean
  uploadDevice: (formData: AddDeviceFormData, fileData: DeviceFileData) => Promise<{
    success: boolean
    deviceId?: string
    error?: string
    validationErrors?: Record<string, string>
  }>
}

export const useDeviceUpload = (userId: string): UseDeviceUploadResult => {
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (
    formData: AddDeviceFormData,
    fileData: DeviceFileData
  ) => {
    if (isUploading) {
      return { success: false, error: 'Upload already in progress' }
    }

    setIsUploading(true)

    try {
      // Step 1: Validate form data
      const validation = validateDeviceForm(formData)
      if (!validation.isValid) {
        setIsUploading(false)
        return {
          success: false,
          error: 'Please fix the form errors',
          validationErrors: validation.errors
        }
      }

      // Step 2: Upload main device and primary files
      const uploadResult = await uploadDevice(formData, fileData, userId)
      
      if (!uploadResult.success || !uploadResult.deviceId) {
        setIsUploading(false)
        return {
          success: false,
          error: uploadResult.error || 'Failed to upload device'
        }
      }

      // Step 3: Upload additional photos if any
      if (fileData.additionalPhotos && fileData.additionalPhotos.length > 0) {
        const additionalPhotosResult = await uploadAdditionalPhotos(
          uploadResult.deviceId,
          userId,
          fileData.additionalPhotos
        )

        if (!additionalPhotosResult.success) {
          console.warn('Additional photos upload failed:', additionalPhotosResult.error)
          // Don't fail the entire operation, just log the warning
        }
      }

      setIsUploading(false)
      return {
        success: true,
        deviceId: uploadResult.deviceId
      }

    } catch (error) {
      console.error('Device upload hook error:', error)
      setIsUploading(false)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }

  return {
    isUploading,
    uploadDevice: handleUpload
  }
}
