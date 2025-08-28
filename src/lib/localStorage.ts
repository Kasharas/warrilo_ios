import AsyncStorage from '@react-native-async-storage/async-storage';

// Local storage keys
const STORAGE_KEYS = {
  DEVICES: 'warrilo_devices',
  PENDING_SYNC: 'warrilo_pending_sync',
  SYNC_STATUS: 'warrilo_sync_status',
};

// Device interface for local storage
export interface LocalDevice {
  id: string;
  user_id: string;
  name: string;
  supplier: string | null;
  category: string | null; // Add category field
  purchase_date: string;
  warranty_months: number;
  warranty_end_date: string;
  purchase_price: number | null; // Purchase price field
  location: string | null;
  photo_irl: string | null;
  notes: string | null;
  invoice_url: string;
  identifiers: string | null;
  created_at: string;
  sync_status: 'pending' | 'syncing' | 'synced' | 'failed';
  local_id?: string; // Temporary local ID before sync
}

// Sync status interface
export interface SyncStatus {
  last_sync: string | null;
  pending_count: number;
  failed_count: number;
  is_syncing: boolean;
}

/**
 * Local Storage Service for Devices
 * Handles storing devices locally before syncing with database
 */
export class DeviceLocalStorage {
  
  /**
   * Save multiple devices to local storage (overwrites existing)
   */
  static async saveDevices(devices: LocalDevice[]): Promise<void> {
    try {
      const dataToStore = JSON.stringify(devices);
      if (dataToStore.length > 5000000) { // 5MB limit
        console.warn('Data too large, clearing old devices');
        await this.clearAll();
      }
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICES, dataToStore);
      await this.updateSyncStatus();
      console.log('Devices saved locally:', devices.length);
    } catch (error) {
      console.error('Error saving devices locally:', error);
      throw error;
    }
  }

  /**
   * Store a new device locally
   */
  static async storeDevice(device: Omit<LocalDevice, 'sync_status' | 'local_id'>): Promise<string> {
    try {
      // Generate local ID
      const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const localDevice: LocalDevice = {
        ...device,
        sync_status: 'pending',
        local_id: localId,
      };

      // Get existing devices
      const existingDevices = await this.getDevices();
      
      // Add new device
      const updatedDevices = [...existingDevices, localDevice];
      
      // Check data size before storing
      const dataToStore = JSON.stringify(updatedDevices);
      if (dataToStore.length > 5000000) { // 5MB limit
        console.warn('Data too large, clearing old devices');
        await this.clearAll();
        // Try storing just the new device
        const singleDevice = [localDevice];
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(singleDevice));
      } else {
        // Store updated list
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICES, dataToStore);
      }
      
      // Update pending sync count
      await this.updateSyncStatus();
      
      console.log('Device stored locally:', localId);
      return localId;
      
    } catch (error) {
      console.error('Error storing device locally:', error);
      
      // If it's a quota error, try to clear storage and retry
      if (error instanceof Error && error.message.includes('quota')) {
        console.log('Quota exceeded, clearing storage and retrying...');
        try {
          await this.clearAll();
          // Try storing just the new device
          const localDevice: LocalDevice = {
            ...device,
            sync_status: 'pending',
            local_id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          };
          await AsyncStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify([localDevice]));
          await this.updateSyncStatus();
          return localDevice.local_id!;
        } catch (retryError) {
          console.error('Failed to store device after clearing storage:', retryError);
          throw new Error('Storage quota exceeded and retry failed');
        }
      }
      
      throw new Error('Failed to store device locally');
    }
  }

  /**
   * Get all devices from local storage
   */
  static async getDevices(): Promise<LocalDevice[]> {
    try {
      const devicesJson = await AsyncStorage.getItem(STORAGE_KEYS.DEVICES);
      console.log('Retrieved devices from storage:', devicesJson ? devicesJson.length : 0, 'characters');
      return devicesJson ? JSON.parse(devicesJson) : [];
    } catch (error) {
      console.error('Error getting devices from local storage:', error);
      return [];
    }
  }

  /**
   * Get devices by sync status
   */
  static async getDevicesByStatus(status: LocalDevice['sync_status']): Promise<LocalDevice[]> {
    const devices = await this.getDevices();
    return devices.filter(device => device.sync_status === status);
  }

  /**
   * Update device sync status
   */
  static async updateDeviceSyncStatus(localId: string, status: LocalDevice['sync_status']): Promise<void> {
    try {
      const devices = await this.getDevices();
      const deviceIndex = devices.findIndex(d => d.local_id === localId);
      
      if (deviceIndex !== -1) {
        devices[deviceIndex].sync_status = status;
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
        
        // Update sync status
        await this.updateSyncStatus();
      }
    } catch (error) {
      console.error('Error updating device sync status:', error);
    }
  }

  /**
   * Remove device from local storage (after successful sync)
   */
  static async removeDevice(localId: string): Promise<void> {
    try {
      const devices = await this.getDevices();
      const filteredDevices = devices.filter(d => d.local_id !== localId);
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(filteredDevices));
      
      // Update sync status
      await this.updateSyncStatus();
    } catch (error) {
      console.error('Error removing device from local storage:', error);
    }
  }

  /**
   * Get sync status
   */
  static async getSyncStatus(): Promise<SyncStatus> {
    try {
      const statusJson = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_STATUS);
      if (statusJson) {
        return JSON.parse(statusJson);
      }
      
      // Return default status
      return {
        last_sync: null,
        pending_count: 0,
        failed_count: 0,
        is_syncing: false,
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        last_sync: null,
        pending_count: 0,
        failed_count: 0,
        is_syncing: false,
      };
    }
  }

  /**
   * Update sync status
   */
  static async updateSyncStatus(): Promise<void> {
    try {
      const devices = await this.getDevices();
      const pendingCount = devices.filter(d => d.sync_status === 'pending').length;
      const failedCount = devices.filter(d => d.sync_status === 'failed').length;
      
      const status: SyncStatus = {
        last_sync: null, // Will be updated when sync completes
        pending_count: pendingCount,
        failed_count: failedCount,
        is_syncing: false,
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify(status));
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  }

  /**
   * Set syncing status
   */
  static async setSyncing(isSyncing: boolean): Promise<void> {
    try {
      const status = await this.getSyncStatus();
      status.is_syncing = isSyncing;
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify(status));
    } catch (error) {
      console.error('Error setting syncing status:', error);
    }
  }

  /**
   * Clear all local data (for testing or reset)
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.DEVICES,
        STORAGE_KEYS.PENDING_SYNC,
        STORAGE_KEYS.SYNC_STATUS,
      ]);
      console.log('All local data cleared');
    } catch (error) {
      console.error('Error clearing local data:', error);
    }
  }
}
