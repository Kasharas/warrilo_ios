import { supabase } from '@/lib/supabaseClient';
import { DeviceLocalStorage, LocalDevice } from './localStorage';
import { validateSupabaseSession } from './sessionValidator';

/**
 * Device Sync Service
 * Handles asynchronous synchronization of devices with Supabase database
 */
export class DeviceSyncService {
  
  /**
   * Start background sync process
   * This should be called after storing device locally
   */
  static async startBackgroundSync(): Promise<void> {
    try {
      // Check if already syncing
      const syncStatus = await DeviceLocalStorage.getSyncStatus();
      if (syncStatus.is_syncing) {
        console.log('Sync already in progress, skipping...');
        return;
      }

      // Set syncing status
      await DeviceLocalStorage.setSyncing(true);
      
      // Get pending devices
      const pendingDevices = await DeviceLocalStorage.getDevicesByStatus('pending');
      
      if (pendingDevices.length === 0) {
        console.log('No pending devices to sync');
        await DeviceLocalStorage.setSyncing(false);
        return;
      }

      console.log(`Starting sync for ${pendingDevices.length} pending devices`);
      
      // Process each pending device
      for (const device of pendingDevices) {
        await this.syncDevice(device);
      }

      // Update sync status
      await this.updateLastSyncTime();
      await DeviceLocalStorage.setSyncing(false);
      
      console.log('Background sync completed');
      
    } catch (error) {
      console.error('Error in background sync:', error);
      await DeviceLocalStorage.setSyncing(false);
    }
  }

  /**
   * Sync a single device with the database
   */
  private static async syncDevice(device: LocalDevice): Promise<void> {
    try {
      console.log('Mobile sync: Starting device sync process...', {
        deviceId: device.id,
        localId: device.local_id,
        deviceName: device.name,
        platform: 'mobile'
      });

      // Update sync status to syncing
      await DeviceLocalStorage.updateDeviceSyncStatus(device.local_id!, 'syncing');

      // Validate session before API call
      console.log('Mobile sync: Validating session before Supabase operation...');
      const sessionResult = await validateSupabaseSession();
      
      if (!sessionResult.isValid) {
        console.error('Mobile sync: Cannot sync device - invalid session:', {
          error: sessionResult.error,
          deviceId: device.id,
          localId: device.local_id,
          platform: 'mobile'
        });
        
        await DeviceLocalStorage.updateDeviceSyncStatus(device.local_id!, 'failed');
        throw new Error(`Mobile sync failed: ${sessionResult.error}`);
      }
      
      console.log('Mobile sync: Session validated successfully, proceeding with Supabase insert...', {
        userId: sessionResult.session?.user.id,
        deviceId: device.id,
        platform: 'mobile'
      });

      // Prepare device data (preserve existing transformation logic)
      const deviceData = {
        user_id: device.user_id,
        name: device.name,
        supplier: device.supplier,
        purchase_date: device.purchase_date,
        warranty_months: device.warranty_months,
        warranty_end_date: device.warranty_end_date,
        location: device.location,
        photo_irl: device.photo_irl,
        notes: device.notes,
        invoice_url: device.invoice_url,
        identifiers: device.identifiers,
        created_at: device.created_at,
      };

      console.log('Mobile sync: Attempting Supabase insert...', {
        deviceName: deviceData.name,
        userId: deviceData.user_id,
        platform: 'mobile'
      });

      try {
        const { data, error } = await supabase
          .from('devices')
          .insert([deviceData])
          .select()
          .single();

        if (error) {
          // Check for authentication-specific errors
          if (error.message?.includes('AuthApiError') || 
              error.message?.includes('invalid request') ||
              error.message?.includes('auth code') ||
              error.message?.includes('code verifier')) {
            
            console.error('Mobile sync: Authentication error during device sync:', {
              error: error.message,
              code: error.code,
              deviceId: device.id,
              localId: device.local_id,
              platform: 'mobile',
              errorType: 'AuthAPIError'
            });
            
            await DeviceLocalStorage.updateDeviceSyncStatus(device.local_id!, 'failed');
            throw new Error('Sync failed: Authentication error. Please log out and log in again.');
          }
          
          // Handle other Supabase errors
          console.error('Mobile sync: Supabase operation failed:', {
            error: error.message,
            code: error.code,
            deviceId: device.id,
            platform: 'mobile'
          });
          
          await DeviceLocalStorage.updateDeviceSyncStatus(device.local_id!, 'failed');
          throw error;
        }
        
        console.log('Mobile sync: Device synced successfully to Supabase:', {
          supabaseId: data.id,
          localId: device.local_id,
          deviceName: data.name,
          platform: 'mobile'
        });
        
        // Mark as synced but keep in local storage (LOCAL-FIRST APPROACH)
        await DeviceLocalStorage.updateDeviceSyncStatus(device.local_id!, 'synced');
        console.log('Mobile sync: Device marked as synced, preserved in local storage for local-first approach', {
          localId: device.local_id,
          deviceName: device.name,
          syncStatus: 'synced',
          platform: 'mobile'
        });
        
      } catch (error) {
        // Catch any uncaught authentication errors
        if (error instanceof Error && 
            (error.message.includes('AuthApiError') || 
             error.message.includes('auth code') ||
             error.message.includes('invalid request'))) {
          
          console.error('Mobile sync: Caught AuthAPIError in device sync:', {
            error: error.message,
            deviceId: device.id,
            localId: device.local_id,
            platform: 'mobile'
          });
          
          await DeviceLocalStorage.updateDeviceSyncStatus(device.local_id!, 'failed');
          throw new Error('Authentication error during sync. Please log out and log in again.');
        }
        
        // Re-throw other errors
        throw error;
      }

    } catch (error) {
      console.error('Mobile sync: Device sync exception:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        deviceId: device.id,
        localId: device.local_id,
        platform: 'mobile'
      });
      
      // Ensure device is marked as failed on any error
      try {
        await DeviceLocalStorage.updateDeviceSyncStatus(device.local_id!, 'failed');
      } catch (statusError) {
        console.error('Mobile sync: Failed to update device status:', statusError);
      }
      
      throw error;
    }
  }

  /**
   * Retry failed syncs
   */
  static async retryFailedSyncs(): Promise<void> {
    try {
      const failedDevices = await DeviceLocalStorage.getDevicesByStatus('failed');
      
      if (failedDevices.length === 0) {
        console.log('No failed devices to retry');
        return;
      }

      console.log(`Retrying sync for ${failedDevices.length} failed devices`);
      
      // Reset status to pending for retry
      for (const device of failedDevices) {
        await DeviceLocalStorage.updateDeviceSyncStatus(device.local_id!, 'pending');
      }
      
      // Start background sync
      await this.startBackgroundSync();
      
    } catch (error) {
      console.error('Error retrying failed syncs:', error);
    }
  }

  /**
   * Manual sync trigger (for user-initiated sync)
   */
  static async manualSync(): Promise<{ success: boolean; message: string }> {
    try {
      const syncStatus = await DeviceLocalStorage.getSyncStatus();
      
      if (syncStatus.pending_count === 0) {
        return { success: true, message: 'No devices to sync' };
      }

      await this.startBackgroundSync();
      
      return { 
        success: true, 
        message: `Sync completed. ${syncStatus.pending_count} devices processed.` 
      };
      
    } catch (error) {
      console.error('Manual sync error:', error);
      return { 
        success: false, 
        message: 'Sync failed. Please try again.' 
      };
    }
  }

  /**
   * Get sync progress information
   */
  static async getSyncProgress(): Promise<{
    pending: number;
    failed: number;
    isSyncing: boolean;
    lastSync: string | null;
  }> {
    const syncStatus = await DeviceLocalStorage.getSyncStatus();
    
    return {
      pending: syncStatus.pending_count,
      failed: syncStatus.failed_count,
      isSyncing: syncStatus.is_syncing,
      lastSync: syncStatus.last_sync,
    };
  }

  /**
   * Update last sync time
   */
  private static async updateLastSyncTime(): Promise<void> {
    try {
      console.log('Mobile sync: Updating last sync time...');
      
      // Validate session before API call
      const sessionResult = await validateSupabaseSession();
      
      if (!sessionResult.isValid) {
        console.warn('Mobile sync: Cannot update sync status - invalid session:', {
          error: sessionResult.error,
          platform: 'mobile'
        });
        return;
      }
      
      const syncStatus = await DeviceLocalStorage.getSyncStatus();
      syncStatus.last_sync = new Date().toISOString();
      
      console.log('Mobile sync: Updating sync status in Supabase...', {
        userId: sessionResult.session?.user.id,
        lastSync: syncStatus.last_sync,
        platform: 'mobile'
      });
      
      // Update in storage
      const { data, error } = await supabase
        .from('sync_status')
        .upsert([{
          user_id: sessionResult.session?.user.id,
          last_sync: syncStatus.last_sync,
          updated_at: new Date().toISOString(),
        }]);

      if (error) {
        console.warn('Mobile sync: Could not update sync status in database:', {
          error: error.message,
          platform: 'mobile'
        });
      } else {
        console.log('Mobile sync: Sync status updated successfully', {
          platform: 'mobile'
        });
      }
      
    } catch (error) {
      console.error('Mobile sync: Error updating last sync time:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: 'mobile'
      });
    }
  }

  /**
   * Check if device exists in database (for duplicate prevention)
   */
  static async checkDeviceExists(deviceData: {
    name: string;
    user_id: string;
    purchase_date: string;
  }): Promise<boolean> {
    try {
      console.log('Mobile sync: Checking device existence...', {
        deviceName: deviceData.name,
        userId: deviceData.user_id,
        platform: 'mobile'
      });
      
      // Validate session before API call
      const sessionResult = await validateSupabaseSession();
      
      if (!sessionResult.isValid) {
        console.warn('Mobile sync: Cannot check device existence - invalid session:', {
          error: sessionResult.error,
          platform: 'mobile'
        });
        return false; // Assume it doesn't exist if we can't check
      }
      
      const { data, error } = await supabase
        .from('devices')
        .select('id')
        .eq('name', deviceData.name)
        .eq('user_id', deviceData.user_id)
        .eq('purchase_date', deviceData.purchase_date)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is what we want
        console.error('Mobile sync: Error checking device existence:', {
          error: error.message,
          code: error.code,
          platform: 'mobile'
        });
        throw error;
      }

      const exists = !!data;
      console.log('Mobile sync: Device existence check result:', {
        exists,
        deviceName: deviceData.name,
        platform: 'mobile'
      });
      
      return exists; // Returns true if device exists, false otherwise
      
    } catch (error) {
      console.error('Mobile sync: Error checking device existence:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        deviceName: deviceData.name,
        platform: 'mobile'
      });
      return false; // Assume it doesn't exist if we can't check
    }
  }
}
