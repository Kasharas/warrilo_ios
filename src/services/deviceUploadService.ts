import { supabase } from '../../lib/supabaseClient'
import { AddDeviceFormData, DeviceFileData, DeviceUploadResult } from '../types/device'
import { uploadDevicePhoto } from '../utils/uploadDevicePhoto'
import { uploadReceiptPhoto } from '../utils/uploadReceiptPhoto'
import { prepareDeviceData } from '../utils/prepareDeviceData'
import { createWarrantyAlerts } from '../utils/warrantyAlertUtils'
import { warrantyAlertService } from './warrantyAlertService'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { validateSupabaseSession } from '../lib/sessionValidator'

export const uploadDevice = async (
  formData: AddDeviceFormData,
  fileData: DeviceFileData,
  userId: string
): Promise<DeviceUploadResult> => {
  try {
    console.log('Mobile upload: Starting device upload with files...', {
      deviceName: formData.deviceName,
      hasPhoto: !!fileData.devicePhoto,
      hasReceipt: !!fileData.receiptPhoto,
      platform: 'mobile'
    });

    // Validate session before upload operations
    console.log('Mobile upload: Validating session...');
    const sessionResult = await validateSupabaseSession();
    
    if (!sessionResult.isValid) {
      console.error('Mobile upload: Aborted - invalid session:', {
        error: sessionResult.error,
        deviceName: formData.deviceName,
        platform: 'mobile'
      });
      
      return { 
        success: false, 
        error: `Upload failed: ${sessionResult.error}`,
        details: 'Session validation failed before upload'
      };
    }
    
    console.log('Mobile upload: Session validated successfully, proceeding with uploads...', {
      userId: sessionResult.session?.user.id,
      deviceName: formData.deviceName,
      platform: 'mobile'
    });

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

    // ✅ STEP 1 COMPLETE: Create warranty alerts after successful device insertion
    try {
      console.log('🎯 Creating warranty alerts for device:', device.id);
      console.log('🔍 Form data for warranty alerts:', {
        deviceId: device.id,
        userId: userId,
        purchaseDate: formData.purchaseDate,
        warrantyMonths: formData.warrantyMonths
      });
      
      // Create 3 warranty alerts (30, 7, 1 day before expiry)
      const warrantyAlerts = createWarrantyAlerts({
        deviceId: device.id,
        localDeviceId: formData.localDeviceId, // Include local device ID for local storage
        userId: userId,
        purchaseDate: formData.purchaseDate || '',
        warrantyMonths: formData.warrantyMonths || 0,
        deviceName: formData.deviceName // Include device name for local storage
      });
      
      console.log('📅 Warranty alerts created locally:', warrantyAlerts);
      
      if (warrantyAlerts.length > 0) {
        console.log(`📅 Created ${warrantyAlerts.length} warranty alerts`);
        
        // Store alerts in Supabase warranty_reminders table
        const createdAlerts = await warrantyAlertService.createAlerts(warrantyAlerts);
        console.log(`✅ Successfully stored ${createdAlerts.length} warranty alerts in Supabase`);
        
        // ADD THIS LOCAL STORAGE CODE:
        if (createdAlerts && createdAlerts.length > 0) {
          try {
            // Store warranty alerts locally for AlertsScreen
            await AsyncStorage.setItem('warranty_alerts', JSON.stringify(createdAlerts));
            console.log(`💾 Stored ${createdAlerts.length} warranty alerts locally`);
          } catch (error) {
            console.error('Error storing warranty alerts locally:', error);
          }
        }
      } else {
        console.log('⚠️ No warranty alerts created (invalid warranty info)');
      }
    } catch (alertError) {
      // Don't fail the device upload if warranty alerts fail
      console.error('❌ Error creating warranty alerts:', alertError);
      console.log('⚠️ Device uploaded successfully, but warranty alerts failed');
      
      // ✅ ADDITIONAL DEBUGGING
      if (alertError && typeof alertError === 'object') {
        console.error('❌ Alert error details:', JSON.stringify(alertError, null, 2));
      }
    }

    // ✅ STEP 2: Update local device with Supabase ID
    try {
      console.log('🔄 Updating local device with Supabase ID:', device.id);
      
      // Get the original local device data
      const devicesData = await AsyncStorage.getItem('devices');
      if (devicesData) {
        const devices = JSON.parse(devicesData);
        // Find device by matching name and purchase date (most reliable way)
        const localDeviceIndex = devices.findIndex((d: any) => 
          d.name === formData.deviceName && 
          d.purchase_date === formData.purchaseDate &&
          d.sync_status === 'pending' // Only update devices that haven't been synced yet
        );
        
        if (localDeviceIndex >= 0) {
          // Update the local device with Supabase ID
          devices[localDeviceIndex] = {
            ...devices[localDeviceIndex],
            id: device.id, // Update with Supabase ID
            sync_status: 'synced',
            last_sync: new Date().toISOString()
          };
          
          await AsyncStorage.setItem('devices', JSON.stringify(devices));
          console.log('✅ Local device updated with Supabase ID:', device.id);
        } else {
          console.warn('⚠️ Local device not found for name:', formData.deviceName, 'date:', formData.purchaseDate);
        }
      }
    } catch (updateError) {
      console.error('❌ Error updating local device with Supabase ID:', updateError);
      // Don't fail the entire upload for this
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
