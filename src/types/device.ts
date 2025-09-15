export interface AddDeviceFormData {
  // Device Information
  deviceName: string
  brand?: string
  modelNumber?: string
  serialNumber?: string
  category?: string
  
  // Purchase Details
  purchaseDate: string // ISO date string
  purchasePrice?: number
  store: string
  
  // Warranty Information
  warrantyMonths: number
  
  // Optional
  notes?: string
  localDeviceId?: string // Local device ID for linking alerts
}

export interface DeviceFileData {
  devicePhoto?: {
    uri: string
    name: string
    type: string
  }
  receiptPhoto?: {
    uri: string
    name: string
    type: string
  }
  additionalPhotos?: Array<{
    uri: string
    name: string
    type: string
  }>
}

export interface DeviceUploadResult {
  success: boolean
  deviceId?: string
  error?: string
  details?: string
}

export interface FileUploadResult {
  success: boolean
  url?: string
  error?: string
}
