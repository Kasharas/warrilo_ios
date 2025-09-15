import { AddDeviceFormData } from '../types/device'
import { Database } from '../lib/supabase'
import { addMonths, parseISO, isValid } from 'date-fns'

type DeviceInsert = Database['public']['Tables']['devices']['Insert']

// Safe date parsing function (same as in warrantyAlertUtils.ts)
const parseDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  
  const isoDate = parseISO(dateString);
  if (isValid(isoDate)) return isoDate;
  
  const fallbackDate = new Date(dateString);
  return isValid(fallbackDate) ? fallbackDate : new Date();
};

export const prepareDeviceData = (
  formData: AddDeviceFormData,
  photoUrl: string | null,
  receiptUrl: string | null,
  userId: string
): DeviceInsert => {
  // Calculate warranty end date using the same method as warrantyAlertUtils
  let warrantyEndDate: string | null = null
  if (formData.purchaseDate && formData.warrantyMonths) {
    const purchaseDate = parseDate(formData.purchaseDate)
    const endDate = addMonths(purchaseDate, formData.warrantyMonths)
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
