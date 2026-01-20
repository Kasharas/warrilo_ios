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
  fileData: DeviceFileData
): Promise<DeviceUploadResult> => {
  try {
    console.log('========== UPLOAD START ==========');

    // Step 1: Validate session with refresh logic
    console.log('Step 1: Validating session...');
    let userId: string;

    try {
      // Try to refresh the session first
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshedSession) {
        userId = refreshedSession.user.id;
        console.log('✓ Session refreshed successfully');
      } else {
        // Fallback to existing session
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (!existingSession) {
          throw new Error('No active session - please log in again');
        }
        userId = existingSession.user.id;
        console.log('✓ Using existing session');
      }
    } catch (sessionError) {
      console.error('❌ Session validation failed:', sessionError);
      return { success: false, error: 'Authentication failed. Please log in again.' };
    }
    console.log('✓ User ID:', userId);

    // Step 2: Upload files
    console.log('Step 2: Uploading files...');
    const uploadPromises: Promise<any>[] = [];

    if (fileData.devicePhoto) {
      uploadPromises.push(uploadDevicePhoto({ userId, photo: fileData.devicePhoto }));
    } else {
      uploadPromises.push(Promise.resolve({ success: true, url: null }));
    }

    if (fileData.receiptPhoto) {
      uploadPromises.push(uploadReceiptPhoto({ userId, receipt: fileData.receiptPhoto }));
    } else {
      uploadPromises.push(Promise.resolve({ success: true, url: null }));
    }

    const [photoResult, receiptResult] = await Promise.all(uploadPromises);
    console.log('✓ Photo uploaded:', photoResult);
    console.log('✓ Receipt uploaded:', receiptResult);

    if (!photoResult.success) return { success: false, error: photoResult.error };
    if (!receiptResult.success) return { success: false, error: receiptResult.error };

    // Step 3: Prepare data
    console.log('Step 3: Preparing device data...');
    const deviceData = prepareDeviceData(
      formData,
      photoResult.url || null,
      receiptResult.url || null,
      userId
    );
    console.log('✓ Device data:', deviceData);

    // Step 4: Insert to database
    console.log('Step 4: Inserting to database...');
    const { data: device, error: insertError } = await supabase
      .from('devices')
      .insert(deviceData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Database error:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      return { success: false, error: insertError.message };
    }


    console.log('🔵 [STEP 6: ALERTS] Creating warranty reminders...');
    try {
      const warrantyAlerts = createWarrantyAlerts({
        deviceId: device.id,
        localDeviceId: formData.localDeviceId,
        userId: userId,
        purchaseDate: formData.purchaseDate || '',
        warrantyMonths: formData.warrantyMonths || 0,
        deviceName: formData.deviceName
      });

      if (warrantyAlerts.length > 0) {
        await warrantyAlertService.createAlerts(warrantyAlerts);
        await AsyncStorage.setItem('warranty_alerts', JSON.stringify(warrantyAlerts));
        console.log('✅ [STEP 6: SUCCESS] Alerts stored');
      }
    } catch (e) {
      console.warn('⚠️ [STEP 6: WARNING] Alert creation non-fatal error:', e);
    }

    return { success: true, deviceId: device.id };
  } catch (error) {
    console.error('❌ [STEP 3: FATAL ERROR] Service level failure:', error);
    return { success: false, error: 'Unexpected error' };
  }
}
