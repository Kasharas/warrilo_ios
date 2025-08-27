import { supabase } from '@/lib/supabaseClient';
import { DeviceLocalStorage, LocalDevice } from './localStorage';

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
      // Update status to syncing
      await DeviceLocalStorage.updateDeviceSyncStatus(device.local_id!, 'syncing');
      
      // Prepare device data for database (remove local fields)
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

      // Insert device into database
      const { data, error } = await supabase
        .from('devices')
        .insert([deviceData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('Device synced successfully:', data.id);
      
      // Remove from local storage after successful sync
      await DeviceLocalStorage.removeDevice(device.local_id!);
      
    } catch (error) {
      console.error('Error syncing device:', error);
      
      // Update status to failed
      await DeviceLocalStorage.updateDeviceSyncStatus(device.local_id!, 'failed');
      
      // You could implement retry logic here
      // For now, we'll leave it as failed and user can retry manually
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
      const syncStatus = await DeviceLocalStorage.getSyncStatus();
      syncStatus.last_sync = new Date().toISOString();
      
      // Update in storage
      const { data, error } = await supabase
        .from('sync_status')
        .upsert([{
          user_id: (await supabase.auth.getUser()).data.user?.id,
          last_sync: syncStatus.last_sync,
          updated_at: new Date().toISOString(),
        }]);

      if (error) {
        console.warn('Could not update sync status in database:', error);
      }
      
    } catch (error) {
      console.error('Error updating last sync time:', error);
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
      const { data, error } = await supabase
        .from('devices')
        .select('id')
        .eq('name', deviceData.name)
        .eq('user_id', deviceData.user_id)
        .eq('purchase_date', deviceData.purchase_date)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is what we want
        throw error;
      }

      return !!data; // Returns true if device exists, false otherwise
      
    } catch (error) {
      console.error('Error checking device existence:', error);
      return false; // Assume it doesn't exist if we can't check
    }
  }
}
