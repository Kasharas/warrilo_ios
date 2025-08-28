import { AddDeviceFormData } from '../types/device'

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export const validateDeviceForm = (formData: AddDeviceFormData): ValidationResult => {
  const errors: Record<string, string> = {}

  // Required fields validation
  if (!formData.deviceName?.trim()) {
    errors.deviceName = 'Device name is required'
  } else if (formData.deviceName.trim().length > 100) {
    errors.deviceName = 'Device name must be less than 100 characters'
  }

  if (!formData.brand?.trim()) {
    errors.brand = 'Brand is required'
  } else if (formData.brand.trim().length > 100) {
    errors.brand = 'Brand name must be less than 100 characters'
  }

  if (!formData.category?.trim()) {
    errors.category = 'Category is required'
  }

  if (!formData.store?.trim()) {
    errors.store = 'Store name is required'
  }

  // Purchase date validation
  if (formData.purchaseDate) {
    const purchaseDate = new Date(formData.purchaseDate)
    const today = new Date()
    
    if (purchaseDate > today) {
      errors.purchaseDate = 'Purchase date cannot be in the future'
    }
    
    // Check if date is too far in the past (e.g., more than 50 years)
    const fiftyYearsAgo = new Date()
    fiftyYearsAgo.setFullYear(today.getFullYear() - 50)
    
    if (purchaseDate < fiftyYearsAgo) {
      errors.purchaseDate = 'Purchase date seems too far in the past'
    }
  }

  // Purchase price validation
  if (formData.purchasePrice !== undefined && formData.purchasePrice !== null) {
    if (formData.purchasePrice < 0) {
      errors.purchasePrice = 'Purchase price cannot be negative'
    }
    if (formData.purchasePrice > 999999.99) {
      errors.purchasePrice = 'Purchase price is too large'
    }
  }

  // Warranty months validation
  if (formData.warrantyMonths !== undefined && formData.warrantyMonths !== null) {
    if (formData.warrantyMonths < 0) {
      errors.warrantyMonths = 'Warranty duration cannot be negative'
    }
    if (formData.warrantyMonths > 120) {
      errors.warrantyMonths = 'Warranty duration cannot exceed 120 months'
    }
  }

  // Optional field length validation
  if (formData.modelNumber && formData.modelNumber.length > 100) {
    errors.modelNumber = 'Model number must be less than 100 characters'
  }

  if (formData.serialNumber && formData.serialNumber.length > 100) {
    errors.serialNumber = 'Serial number must be less than 100 characters'
  }

  if (formData.notes && formData.notes.length > 1000) {
    errors.notes = 'Notes must be less than 1000 characters'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
