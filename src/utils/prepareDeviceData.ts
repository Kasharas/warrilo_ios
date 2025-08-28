import { AddDeviceFormData } from '../types/device'
import { Database } from '../lib/supabase'

type DeviceInsert = Database['public']['Tables']['devices']['Insert']

export const prepareDeviceData = (
  formData: AddDeviceFormData,
  photoUrl: string | null,
  receiptUrl: string | null,
  userId: string
): DeviceInsert => {
  // Calculate warranty end date
  let warrantyEndDate: string | null = null
  if (formData.purchaseDate && formData.warrantyMonths) {
    const endDate = new Date(formData.purchaseDate)
    endDate.setMonth(endDate.getMonth() + formData.warrantyMonths)
    warrantyEndDate = endDate.toISOString().split('T')[0]
  }

  // Prepare identifiers JSON
  const identifiers: Record<string, string | null> = {}
  if (formData.modelNumber) {
    identifiers.model = formData.modelNumber
  }
  if (formData.serialNumber) {
    identifiers.serial = formData.serialNumber
  }
  
  const identifiersJson = Object.keys(identifiers).length > 0 
    ? JSON.stringify(identifiers) 
    : null

  // Prepare device data for insertion
  const deviceData: DeviceInsert = {
    user_id: userId,
    name: formData.deviceName.trim(),
    brand_name: formData.brand.trim() || null,
    category: formData.category || null,
    purchase_date: formData.purchaseDate || null,
    purchase_price: formData.purchasePrice || null,
    store_name: formData.store.trim() || null,
    warranty_months: formData.warrantyMonths || null,
    warranty_end_date: warrantyEndDate,
    photo_irl: photoUrl,
    invoice_url: receiptUrl,
    identifiers: identifiersJson,
    notes: formData.notes?.trim() || null,
  }

  return deviceData
}
