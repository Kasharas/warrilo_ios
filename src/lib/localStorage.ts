import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory storage fallback using Map
class MemoryStorage {
  private storage = new Map<string, string>();
  private listeners = new Map<string, Set<(value: string | null) => void>>();

  getItem(key: string): Promise<string | null> {
    return Promise.resolve(this.storage.get(key) || null);
  }

  setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
    this.notifyListeners(key, value);
    return Promise.resolve();
  }

  removeItem(key: string): Promise<void> {
    this.storage.delete(key);
    this.notifyListeners(key, null);
    return Promise.resolve();
  }

  clear(): Promise<void> {
    const keys = Array.from(this.storage.keys());
    this.storage.clear();
    keys.forEach(key => this.notifyListeners(key, null));
    return Promise.resolve();
  }

  multiRemove(keys: string[]): Promise<void> {
    keys.forEach(key => {
      this.storage.delete(key);
      this.notifyListeners(key, null);
    });
    return Promise.resolve();
  }

  // Additional methods for memory storage management
  getAllKeys(): Promise<string[]> {
    return Promise.resolve(Array.from(this.storage.keys()));
  }

  getSize(): number {
    return this.storage.size;
  }

  hasKey(key: string): boolean {
    return this.storage.has(key);
  }

  // Event system for memory storage changes
  addListener(key: string, callback: (value: string | null) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(callback);
        if (keyListeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  private notifyListeners(key: string, value: string | null): void {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(callback => callback(value));
    }
  }

  // Debug methods
  getDebugInfo(): { size: number; keys: string[]; memoryUsage: string } {
    const keys = Array.from(this.storage.keys());
    const totalSize = Array.from(this.storage.values()).reduce((acc, val) => acc + val.length, 0);
    return {
      size: this.storage.size,
      keys,
      memoryUsage: `${totalSize} characters`
    };
  }
}

// Global memory storage instance
const memoryStorage = new MemoryStorage();

// Fallback storage factory
const createFallbackStorage = () => {
  console.log('Creating memory fallback storage');
  return memoryStorage;
};

// Platform-specific error handling
const handlePlatformStorageError = (error: any, operation: string, context?: any) => {
  const baseError = {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    platform: Platform.OS,
    operation,
    context
  };

  if (Platform.OS === 'android') {
    // Android-specific error handling
    if (error instanceof Error) {
      if (error.message.includes('permission') || error.message.includes('access')) {
        console.error('Android storage permission error:', {
          ...baseError,
          androidError: 'Storage permission denied',
          solution: 'Check Android storage permissions in AndroidManifest.xml',
          details: 'Ensure WRITE_EXTERNAL_STORAGE or READ_EXTERNAL_STORAGE permissions are granted'
        });
      } else if (error.message.includes('quota') || error.message.includes('space')) {
        console.error('Android storage quota error:', {
          ...baseError,
          androidError: 'Insufficient storage space',
          solution: 'Clear app data or free up device storage',
          details: 'Android device storage is full or app storage quota exceeded'
        });
      } else if (error.message.includes('database') || error.message.includes('sqlite')) {
        console.error('Android database error:', {
          ...baseError,
          androidError: 'SQLite database corruption',
          solution: 'Clear app data to reset database',
          details: 'AsyncStorage SQLite database may be corrupted'
        });
      } else {
        console.error('Android storage error:', {
          ...baseError,
          androidError: 'General Android storage error',
          solution: 'Restart app or clear app data',
          details: 'Unknown Android storage issue'
        });
      }
    }
  } else if (Platform.OS === 'ios') {
    // iOS-specific error handling
    if (error instanceof Error) {
      if (error.message.includes('background') || error.message.includes('suspended')) {
        console.error('iOS background storage error:', {
          ...baseError,
          iosError: 'Background app refresh limitation',
          solution: 'Enable Background App Refresh in iOS Settings',
          details: 'iOS restricts storage access when app is backgrounded'
        });
      } else if (error.message.includes('sandbox') || error.message.includes('container')) {
        console.error('iOS sandbox error:', {
          ...baseError,
          iosError: 'App sandbox storage issue',
          solution: 'Check iOS app container permissions',
          details: 'iOS app sandbox may have storage access restrictions'
        });
      } else if (error.message.includes('quota') || error.message.includes('space')) {
        console.error('iOS storage quota error:', {
          ...baseError,
          iosError: 'Insufficient iOS storage space',
          solution: 'Free up device storage or clear app data',
          details: 'iOS device storage is full or app storage quota exceeded'
        });
      } else {
        console.error('iOS storage error:', {
          ...baseError,
          iosError: 'General iOS storage error',
          solution: 'Restart app or reinstall if persistent',
          details: 'Unknown iOS storage issue'
        });
      }
    }
  } else {
    // Web or other platform error handling
    console.error('Web/Other platform storage error:', {
      ...baseError,
      webError: 'Web storage error',
      solution: 'Check browser storage permissions and quota',
      details: 'localStorage may be disabled or quota exceeded'
    });
  }
};

// Get storage with fallback
const getStorage = () => {
  if (Platform.OS === 'web') {
    return localStorage;
  }
  // Check if AsyncStorage is available, use fallback if not
  try {
    return AsyncStorage && typeof AsyncStorage.getItem === 'function' ? AsyncStorage : createFallbackStorage();
  } catch (error) {
    handlePlatformStorageError(error, 'getStorage');
    console.warn('AsyncStorage not available, using fallback storage');
    return createFallbackStorage();
  }
};

// Storage version for data format compatibility
const STORAGE_VERSION = '1.0.0';

// Local storage keys
const STORAGE_KEYS = {
  DEVICES: 'warrilo_devices',
  PENDING_SYNC: 'warrilo_pending_sync',
  SYNC_STATUS: 'warrilo_sync_status',
  VERSION: 'warrilo_storage_version',
};

// Storage migration helpers
const checkStorageVersion = async (): Promise<{ needsMigration: boolean; currentVersion: string | null; targetVersion: string }> => {
  try {
    const storage = getStorage();
    const versionData = Platform.OS === 'web' 
      ? storage.getItem(STORAGE_KEYS.VERSION)
      : await storage.getItem(STORAGE_KEYS.VERSION);
    
    const currentVersion = (versionData instanceof Promise ? await versionData : versionData) || null;
    const needsMigration = currentVersion !== STORAGE_VERSION;
    
    console.log('Storage version check:', {
      platform: Platform.OS,
      currentVersion,
      targetVersion: STORAGE_VERSION,
      needsMigration
    });
    
    return {
      needsMigration,
      currentVersion,
      targetVersion: STORAGE_VERSION
    };
  } catch (error) {
    console.error('Error checking storage version:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      platform: Platform.OS,
      error
    });
    return {
      needsMigration: true,
      currentVersion: null,
      targetVersion: STORAGE_VERSION
    };
  }
};

const migrateStorageData = async (fromVersion: string | null, toVersion: string): Promise<boolean> => {
  try {
    console.log('Starting storage migration:', {
      platform: Platform.OS,
      fromVersion,
      toVersion,
      migrationType: fromVersion === null ? 'initial_setup' : 'version_upgrade'
    });
    
    // Handle different migration scenarios
    if (fromVersion === null) {
      // Initial setup - no migration needed, just set version
      console.log('Initial storage setup - setting version');
      await setStorageVersion(toVersion);
      return true;
    }
    
    // Version-specific migration logic
    if (fromVersion === '0.9.0' && toVersion === '1.0.0') {
      console.log('Migrating from 0.9.0 to 1.0.0');
      return await migrateFrom090To100();
    }
    
    // Add more migration paths as needed
    console.warn('Unknown migration path:', { fromVersion, toVersion });
    return await handleUnknownMigration(fromVersion, toVersion);
    
  } catch (error) {
    console.error('Storage migration failed:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      platform: Platform.OS,
      fromVersion,
      toVersion,
      error
    });
    return false;
  }
};

const setStorageVersion = async (version: string): Promise<void> => {
  try {
    const storage = getStorage();
    if (Platform.OS === 'web') {
      storage.setItem(STORAGE_KEYS.VERSION, version);
    } else {
      await storage.setItem(STORAGE_KEYS.VERSION, version);
    }
    console.log('Storage version set:', { platform: Platform.OS, version });
  } catch (error) {
    console.error('Error setting storage version:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      platform: Platform.OS,
      version,
      error
    });
  }
};

const migrateFrom090To100 = async (): Promise<boolean> => {
  try {
    console.log('Executing migration from 0.9.0 to 1.0.0');
    
    // Example migration logic for 0.9.0 to 1.0.0
    // This would contain specific data transformation logic
    // For now, we'll just validate existing data and set new version
    
    const storage = getStorage();
    
    // Check if devices data exists and is valid
    const devicesData = Platform.OS === 'web' 
      ? storage.getItem(STORAGE_KEYS.DEVICES)
      : await storage.getItem(STORAGE_KEYS.DEVICES);
    
    const actualDevicesData = devicesData instanceof Promise ? await devicesData : devicesData;
    
    if (actualDevicesData) {
      try {
        const devices = JSON.parse(actualDevicesData);
        if (Array.isArray(devices)) {
          console.log('Validating existing devices data during migration:', {
            deviceCount: devices.length,
            platform: Platform.OS
          });
          
          // Validate each device and log any issues
          let validDevices = 0;
          let invalidDevices = 0;
          
          for (const device of devices) {
            if (isValidDeviceObject(device)) {
              validDevices++;
            } else {
              invalidDevices++;
              console.warn('Invalid device found during migration:', {
                device,
                missingProperties: getMissingDeviceProperties(device)
              });
            }
          }
          
          console.log('Device validation during migration:', {
            validDevices,
            invalidDevices,
            totalDevices: devices.length
          });
          
          // If too many invalid devices, clear storage
          if (invalidDevices > validDevices) {
            console.warn('Too many invalid devices, clearing storage during migration');
            await clearAllStorageData();
          }
        }
      } catch (parseError) {
        console.error('Failed to parse devices data during migration:', {
          message: parseError instanceof Error ? parseError.message : 'Unknown parse error',
          platform: Platform.OS,
          error: parseError
        });
        await clearAllStorageData();
      }
    }
    
    // Set new version
    await setStorageVersion(STORAGE_VERSION);
    console.log('Migration from 0.9.0 to 1.0.0 completed successfully');
    return true;
    
  } catch (error) {
    console.error('Migration from 0.9.0 to 1.0.0 failed:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      platform: Platform.OS,
      error
    });
    return false;
  }
};

const handleUnknownMigration = async (fromVersion: string, toVersion: string): Promise<boolean> => {
  try {
    console.warn('Unknown migration path detected:', {
      platform: Platform.OS,
      fromVersion,
      toVersion,
      action: 'clearing_all_data'
    });
    
    // For unknown migrations, clear all data and start fresh
    await clearAllStorageData();
    await setStorageVersion(toVersion);
    
    console.log('Unknown migration handled by clearing all data');
    return true;
    
  } catch (error) {
    console.error('Failed to handle unknown migration:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      platform: Platform.OS,
      fromVersion,
      toVersion,
      error
    });
    return false;
  }
};

const clearAllStorageData = async (): Promise<void> => {
  try {
    const storage = getStorage();
    const keysToRemove = [STORAGE_KEYS.DEVICES, STORAGE_KEYS.PENDING_SYNC, STORAGE_KEYS.SYNC_STATUS];
    
    if (Platform.OS === 'web') {
      keysToRemove.forEach(key => storage.removeItem(key));
    } else {
      await storage.multiRemove(keysToRemove);
    }
    
    console.log('All storage data cleared during migration');
  } catch (error) {
    console.error('Error clearing storage data during migration:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      platform: Platform.OS,
      error
    });
  }
};

// Device validation helpers
const isValidDeviceObject = (device: any): device is LocalDevice => {
  return (
    device &&
    typeof device === 'object' &&
    typeof device.id === 'string' &&
    typeof device.name === 'string' &&
    typeof device.user_id === 'string' &&
    device.id.length > 0 &&
    device.name.length > 0 &&
    device.user_id.length > 0
  );
};

const getMissingDeviceProperties = (device: any): string[] => {
  const required = ['id', 'name', 'user_id'];
  const missing = [];
  
  if (!device || typeof device !== 'object') {
    return ['not an object'];
  }
  
  for (const prop of required) {
    if (!device[prop] || typeof device[prop] !== 'string' || device[prop].length === 0) {
      missing.push(prop);
    }
  }
  
  return missing;
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
  updated_at?: string; // Add updated_at field for tracking modifications
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
      const storage = getStorage();
      if (Platform.OS === 'web') {
        storage.setItem(STORAGE_KEYS.DEVICES, dataToStore);
      } else {
        await storage.setItem(STORAGE_KEYS.DEVICES, dataToStore);
      }
      await this.updateSyncStatus();
      console.log('Devices saved locally:', devices.length);
    } catch (error) {
      handlePlatformStorageError(error, 'saveDevices', {
        deviceCount: devices.length,
        dataSize: JSON.stringify(devices).length,
        asyncStorageAvailable: typeof AsyncStorage !== 'undefined' && typeof AsyncStorage.setItem === 'function'
      });
      throw error;
    }
  }

  /**
   * Store a new device locally
   */
  static async storeDevice(device: Omit<LocalDevice, 'sync_status' | 'local_id'>): Promise<string> {
    // Generate local ID
    const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
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
        const storage = getStorage();
        if (Platform.OS === 'web') {
          storage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(singleDevice));
        } else {
          await storage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(singleDevice));
        }
      } else {
        // Store updated list
        const storage = getStorage();
        if (Platform.OS === 'web') {
          storage.setItem(STORAGE_KEYS.DEVICES, dataToStore);
        } else {
          await storage.setItem(STORAGE_KEYS.DEVICES, dataToStore);
        }
      }
      
      // Update pending sync count
      await this.updateSyncStatus();
      
      console.log('Device stored locally:', localId);
      return localId;
      
    } catch (error) {
      handlePlatformStorageError(error, 'storeDevice', {
        deviceName: device.name,
        deviceId: device.id,
        localId: localId || 'unknown',
        asyncStorageAvailable: typeof AsyncStorage !== 'undefined' && typeof AsyncStorage.setItem === 'function'
      });
      
      // If it's a quota error, try to clear storage and retry
      if (error instanceof Error && error.message.includes('quota')) {
        console.log('Quota exceeded, clearing storage and retrying...');
        // Create localDevice for retry
        const retryLocalDevice: LocalDevice = {
          ...device,
          sync_status: 'pending',
          local_id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        try {
          await this.clearAll();
          // Try storing just the new device
          const storage = getStorage();
          if (Platform.OS === 'web') {
            storage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify([retryLocalDevice]));
          } else {
            await storage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify([retryLocalDevice]));
          }
          await this.updateSyncStatus();
          return retryLocalDevice.local_id!;
        } catch (retryError) {
          handlePlatformStorageError(retryError, 'storeDevice_retry', {
            deviceName: retryLocalDevice.name,
            deviceId: retryLocalDevice.id,
            localId: retryLocalDevice.local_id,
            originalError: error,
            asyncStorageAvailable: typeof AsyncStorage !== 'undefined' && typeof AsyncStorage.setItem === 'function'
          });
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
      const storage = getStorage();
      const devicesJson = Platform.OS === 'web' 
        ? storage.getItem(STORAGE_KEYS.DEVICES)
        : await storage.getItem(STORAGE_KEYS.DEVICES);
      
      const actualDevicesJson = devicesJson instanceof Promise ? await devicesJson : devicesJson;
      console.log('Retrieved devices from storage:', actualDevicesJson ? actualDevicesJson.length : 0, 'characters');
      
      if (!actualDevicesJson) {
        return [];
      }
      
      // Parse JSON data
      let parsedDevices;
      try {
        parsedDevices = JSON.parse(actualDevicesJson);
      } catch (parseError) {
        console.error('JSON parse error in getDevices:', {
          message: parseError instanceof Error ? parseError.message : 'Unknown parse error',
          stack: parseError instanceof Error ? parseError.stack : undefined,
          platform: Platform.OS,
          rawData: actualDevicesJson.substring(0, 200) + (actualDevicesJson.length > 200 ? '...' : ''),
          error: parseError
        });
        // Clear corrupted data and return empty array
        await this.clearAll();
        return [];
      }
      
      // Validate data structure
      if (!Array.isArray(parsedDevices)) {
        console.error('Invalid data structure in getDevices: not an array', {
          platform: Platform.OS,
          dataType: typeof parsedDevices,
          data: parsedDevices
        });
        // Clear invalid data and return empty array
        await this.clearAll();
        return [];
      }
      
      // Validate each device object has required properties
      const validDevices = [];
      for (let i = 0; i < parsedDevices.length; i++) {
        const device = parsedDevices[i];
        if (isValidDeviceObject(device)) {
          validDevices.push(device);
        } else {
          console.warn('Invalid device object found at index', i, {
            platform: Platform.OS,
            device: device,
            missingProperties: getMissingDeviceProperties(device)
          });
        }
      }
      
      // If we have invalid devices, log and potentially clear storage
      if (validDevices.length !== parsedDevices.length) {
        console.error('Found invalid device objects, clearing storage', {
          platform: Platform.OS,
          totalDevices: parsedDevices.length,
          validDevices: validDevices.length,
          invalidDevices: parsedDevices.length - validDevices.length
        });
        await this.clearAll();
        return [];
      }
      
      return validDevices;
    } catch (error) {
      handlePlatformStorageError(error, 'getDevices', {
        storageKey: STORAGE_KEYS.DEVICES,
        asyncStorageAvailable: typeof AsyncStorage !== 'undefined' && typeof AsyncStorage.getItem === 'function'
      });
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
        const storage = getStorage();
        if (Platform.OS === 'web') {
          storage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
        } else {
          await storage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
        }
        
        // Update sync status
        await this.updateSyncStatus();
      }
    } catch (error) {
      handlePlatformStorageError(error, 'updateDeviceSyncStatus', {
        localId,
        status,
        storageKey: STORAGE_KEYS.DEVICES,
        asyncStorageAvailable: typeof AsyncStorage !== 'undefined' && typeof AsyncStorage.setItem === 'function'
      });
    }
  }

  /**
   * Update device data locally
   */
  static async updateDevice(deviceId: string, updatedData: Partial<LocalDevice>): Promise<void> {
    try {
      const devices = await this.getDevices();
      const deviceIndex = devices.findIndex(d => d.local_id === deviceId || d.id === deviceId);
      
      if (deviceIndex !== -1) {
        // Update the device with new data
        devices[deviceIndex] = {
          ...devices[deviceIndex],
          ...updatedData,
          sync_status: 'pending', // Mark as pending sync
        };
        
        // Store updated devices
        const storage = getStorage();
        if (Platform.OS === 'web') {
          storage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
        } else {
          await storage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
        }
        
        // Update sync status
        await this.updateSyncStatus();
        
        console.log('Device updated locally:', deviceId);
      } else {
        throw new Error(`Device with ID ${deviceId} not found`);
      }
    } catch (error) {
      handlePlatformStorageError(error, 'updateDevice', {
        deviceId,
        updatedData,
        storageKey: STORAGE_KEYS.DEVICES,
        asyncStorageAvailable: typeof AsyncStorage !== 'undefined' && typeof AsyncStorage.setItem === 'function'
      });
      throw error;
    }
  }

  /**
   * Remove device from local storage (after successful sync)
   */
  static async removeDevice(localId: string): Promise<void> {
    try {
      const devices = await this.getDevices();
      const filteredDevices = devices.filter(d => d.local_id !== localId);
      const storage = getStorage();
      if (Platform.OS === 'web') {
        storage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(filteredDevices));
      } else {
        await storage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(filteredDevices));
      }
      
      // Update sync status
      await this.updateSyncStatus();
    } catch (error) {
      handlePlatformStorageError(error, 'removeDevice', {
        localId,
        storageKey: STORAGE_KEYS.DEVICES,
        asyncStorageAvailable: typeof AsyncStorage !== 'undefined' && typeof AsyncStorage.setItem === 'function'
      });
    }
  }

  /**
   * Get sync status
   */
  static async getSyncStatus(): Promise<SyncStatus> {
    try {
      const storage = getStorage();
      const statusJson = Platform.OS === 'web' 
        ? storage.getItem(STORAGE_KEYS.SYNC_STATUS)
        : await storage.getItem(STORAGE_KEYS.SYNC_STATUS);
      
      const actualStatusJson = statusJson instanceof Promise ? await statusJson : statusJson;
      if (actualStatusJson) {
        return JSON.parse(actualStatusJson);
      }
      
      // Return default status
      return {
        last_sync: null,
        pending_count: 0,
        failed_count: 0,
        is_syncing: false,
      };
    } catch (error) {
      handlePlatformStorageError(error, 'getSyncStatus', {
        storageKey: STORAGE_KEYS.SYNC_STATUS,
        asyncStorageAvailable: typeof AsyncStorage !== 'undefined' && typeof AsyncStorage.getItem === 'function'
      });
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
      
      const storage = getStorage();
      if (Platform.OS === 'web') {
        storage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify(status));
      } else {
        await storage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify(status));
      }
    } catch (error) {
      handlePlatformStorageError(error, 'updateSyncStatus', {
        storageKey: STORAGE_KEYS.SYNC_STATUS,
        asyncStorageAvailable: typeof AsyncStorage !== 'undefined' && typeof AsyncStorage.setItem === 'function'
      });
    }
  }

  /**
   * Set syncing status
   */
  static async setSyncing(isSyncing: boolean): Promise<void> {
    try {
      const status = await this.getSyncStatus();
      status.is_syncing = isSyncing;
      const storage = getStorage();
      if (Platform.OS === 'web') {
        storage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify(status));
      } else {
        await storage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify(status));
      }
    } catch (error) {
      handlePlatformStorageError(error, 'setSyncing', {
        isSyncing,
        storageKey: STORAGE_KEYS.SYNC_STATUS,
        asyncStorageAvailable: typeof AsyncStorage !== 'undefined' && typeof AsyncStorage.setItem === 'function'
      });
    }
  }

  /**
   * Initialize and verify storage availability
   * Checks storage status and logs platform-specific information on app startup
   */
  static async initializeStorage(): Promise<{
    isAvailable: boolean;
    platform: string;
    storageType: string;
    healthCheckPassed: boolean;
    errorDetails?: any;
  }> {
    const startTime = Date.now();
    console.log('=== STORAGE INITIALIZATION STARTED ===');
    console.log('Platform:', Platform.OS);
    console.log('Timestamp:', new Date().toISOString());
    
    try {
      // Check AsyncStorage availability
      const asyncStorageAvailable = typeof AsyncStorage !== 'undefined' && 
        typeof AsyncStorage.getItem === 'function' && 
        typeof AsyncStorage.setItem === 'function' && 
        typeof AsyncStorage.removeItem === 'function';
      
      console.log('AsyncStorage availability check:', {
        platform: Platform.OS,
        asyncStorageAvailable,
        asyncStorageType: typeof AsyncStorage,
        hasGetItem: typeof AsyncStorage?.getItem === 'function',
        hasSetItem: typeof AsyncStorage?.setItem === 'function',
        hasRemoveItem: typeof AsyncStorage?.removeItem === 'function'
      });
      
      // Determine storage type
      const storageType = Platform.OS === 'web' ? 'localStorage' : 'AsyncStorage';
      console.log('Storage type:', storageType);
      
      // Platform-specific initialization checks
      if (Platform.OS === 'android') {
        console.log('Android storage initialization:', {
          platform: Platform.OS,
          storageType,
          asyncStorageAvailable,
          expectedBehavior: 'AsyncStorage should be available on Android',
          potentialIssues: [
            'AsyncStorage not properly linked',
            'Android permissions not granted',
            'Metro bundler issues',
            'React Native version compatibility'
          ]
        });
      } else if (Platform.OS === 'ios') {
        console.log('iOS storage initialization:', {
          platform: Platform.OS,
          storageType,
          asyncStorageAvailable,
          expectedBehavior: 'AsyncStorage should be available on iOS',
          potentialIssues: [
            'iOS app sandbox restrictions',
            'Background app refresh disabled',
            'AsyncStorage not properly linked',
            'iOS version compatibility'
          ]
        });
      } else if (Platform.OS === 'web') {
        console.log('Web storage initialization:', {
          platform: Platform.OS,
          storageType,
          localStorageAvailable: typeof localStorage !== 'undefined',
          expectedBehavior: 'localStorage should be available on web',
          potentialIssues: [
            'localStorage disabled in browser',
            'Private/incognito mode',
            'Browser storage quota exceeded',
            'CORS or security restrictions'
          ]
        });
      }
      
      // Run health check
      console.log('Running storage health check...');
      const healthCheckPassed = await this.healthCheck();
      
      const initializationTime = Date.now() - startTime;
      console.log('=== STORAGE INITIALIZATION COMPLETED ===');
      console.log('Initialization time:', initializationTime + 'ms');
      console.log('Health check result:', healthCheckPassed ? 'PASSED' : 'FAILED');
      console.log('Storage status:', healthCheckPassed ? 'READY' : 'ISSUES DETECTED');
      
      return {
        isAvailable: asyncStorageAvailable,
        platform: Platform.OS,
        storageType,
        healthCheckPassed,
        errorDetails: healthCheckPassed ? undefined : 'Health check failed - see logs for details'
      };
      
    } catch (error) {
      const initializationTime = Date.now() - startTime;
      console.error('=== STORAGE INITIALIZATION FAILED ===');
      console.error('Initialization time:', initializationTime + 'ms');
      console.error('Error during storage initialization:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        platform: Platform.OS,
        error
      });
      
      return {
        isAvailable: false,
        platform: Platform.OS,
        storageType: Platform.OS === 'web' ? 'localStorage' : 'AsyncStorage',
        healthCheckPassed: false,
        errorDetails: error
      };
    }
  }

  /**
   * Health check for storage functionality
   * Tests basic AsyncStorage operations to verify it's working properly
   */
  static async healthCheck(): Promise<boolean> {
    const testKey = 'warrilo_health_check_test';
    const testValue = JSON.stringify({ 
      timestamp: Date.now(), 
      platform: Platform.OS,
      test: 'health_check' 
    });
    
    try {
      console.log('Starting storage health check...', {
        platform: Platform.OS,
        asyncStorageAvailable: typeof AsyncStorage !== 'undefined' && typeof AsyncStorage.setItem === 'function'
      });
      
      const storage = getStorage();
      
      // Test 1: Set item
      if (Platform.OS === 'web') {
        storage.setItem(testKey, testValue);
      } else {
        await storage.setItem(testKey, testValue);
      }
      console.log('Health check: Set item successful');
      
      // Test 2: Get item
      let retrievedValue;
      if (Platform.OS === 'web') {
        retrievedValue = storage.getItem(testKey);
      } else {
        retrievedValue = await storage.getItem(testKey);
      }
      
      const actualRetrievedValue = retrievedValue instanceof Promise ? await retrievedValue : retrievedValue;
      
      if (!actualRetrievedValue) {
        console.error('Health check failed: Get item returned null/undefined');
        return false;
      }
      console.log('Health check: Get item successful');
      
      // Test 3: Verify data integrity
      let parsedValue;
      try {
        parsedValue = JSON.parse(actualRetrievedValue);
      } catch (parseError) {
        console.error('Health check failed: JSON parse error', {
          message: parseError instanceof Error ? parseError.message : 'Unknown parse error',
          retrievedValue: actualRetrievedValue.substring(0, 100) + (actualRetrievedValue.length > 100 ? '...' : ''),
          error: parseError
        });
        return false;
      }
      
      if (!parsedValue || parsedValue.test !== 'health_check') {
        console.error('Health check failed: Data integrity check failed', {
          parsedValue,
          expectedTest: 'health_check'
        });
        return false;
      }
      console.log('Health check: Data integrity verified');
      
      // Test 4: Remove item
      if (Platform.OS === 'web') {
        storage.removeItem(testKey);
      } else {
        await storage.removeItem(testKey);
      }
      console.log('Health check: Remove item successful');
      
      // Test 5: Verify removal
      let removedValue;
      if (Platform.OS === 'web') {
        removedValue = storage.getItem(testKey);
      } else {
        removedValue = await storage.getItem(testKey);
      }
      
      if (removedValue !== null) {
        console.error('Health check failed: Item not properly removed', {
          removedValue
        });
        return false;
      }
      console.log('Health check: Item removal verified');
      
      console.log('Storage health check passed successfully', {
        platform: Platform.OS,
        storageType: Platform.OS === 'web' ? 'localStorage' : 'AsyncStorage'
      });
      return true;
      
    } catch (error) {
      handlePlatformStorageError(error, 'healthCheck', {
        asyncStorageAvailable: typeof AsyncStorage !== 'undefined' && typeof AsyncStorage.setItem === 'function'
      });
      return false;
    }
  }

  /**
   * Get memory storage debug information
   * Useful for testing and debugging memory fallback functionality
   */
  static getMemoryStorageDebugInfo(): { size: number; keys: string[]; memoryUsage: string } {
    return memoryStorage.getDebugInfo();
  }

  /**
   * Check if memory storage is being used
   * Returns true if the current storage is the memory fallback
   */
  static isUsingMemoryStorage(): boolean {
    const storage = getStorage();
    return storage === memoryStorage;
  }

  /**
   * Get memory storage instance for testing
   * Allows direct access to memory storage for testing purposes
   */
  static getMemoryStorage(): MemoryStorage {
    return memoryStorage;
  }

  /**
   * Check and migrate storage data if needed
   * Should be called on app startup to ensure data compatibility
   */
  static async checkAndMigrateStorage(): Promise<{
    migrated: boolean;
    fromVersion: string | null;
    toVersion: string;
    success: boolean;
  }> {
    try {
      console.log('=== STORAGE MIGRATION CHECK STARTED ===');
      
      const versionCheck = await checkStorageVersion();
      
      if (!versionCheck.needsMigration) {
        console.log('No migration needed - storage version is current');
        return {
          migrated: false,
          fromVersion: versionCheck.currentVersion,
          toVersion: versionCheck.targetVersion,
          success: true
        };
      }
      
      console.log('Migration needed:', {
        fromVersion: versionCheck.currentVersion,
        toVersion: versionCheck.targetVersion
      });
      
      const migrationSuccess = await migrateStorageData(
        versionCheck.currentVersion,
        versionCheck.targetVersion
      );
      
      console.log('=== STORAGE MIGRATION CHECK COMPLETED ===');
      console.log('Migration result:', migrationSuccess ? 'SUCCESS' : 'FAILED');
      
      return {
        migrated: true,
        fromVersion: versionCheck.currentVersion,
        toVersion: versionCheck.targetVersion,
        success: migrationSuccess
      };
      
    } catch (error) {
      console.error('Storage migration check failed:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        platform: Platform.OS,
        error
      });
      
      return {
        migrated: false,
        fromVersion: null,
        toVersion: STORAGE_VERSION,
        success: false
      };
    }
  }

  /**
   * Get current storage version
   */
  static async getStorageVersion(): Promise<string | null> {
    try {
      const storage = getStorage();
      const versionData = Platform.OS === 'web' 
        ? storage.getItem(STORAGE_KEYS.VERSION)
        : await storage.getItem(STORAGE_KEYS.VERSION);
      
      return versionData || null;
    } catch (error) {
      console.error('Error getting storage version:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        platform: Platform.OS,
        error
      });
      return null;
    }
  }

  /**
   * Clear all local data (for testing or reset)
   */
  static async clearAll(): Promise<void> {
    const allKeys = [
      STORAGE_KEYS.DEVICES,        // 'warrilo_devices'
      STORAGE_KEYS.PENDING_SYNC,   // 'warrilo_pending_sync'
      STORAGE_KEYS.SYNC_STATUS,    // 'warrilo_sync_status'
      STORAGE_KEYS.VERSION,        // 'warrilo_storage_version'
      'warranty_alerts',           // ← ADD THIS
      'devices'                    // ← ADD THIS
    ];
    
    try {
      const storage = getStorage();
      
      if (Platform.OS === 'web') {
        allKeys.forEach(key => storage.removeItem(key));
      } else {
        await storage.multiRemove(allKeys);
      }
      console.log('All local data cleared including version');
    } catch (error) {
      handlePlatformStorageError(error, 'clearAll', {
        storageKeys: allKeys,
        asyncStorageAvailable: typeof AsyncStorage !== 'undefined' && typeof AsyncStorage.multiRemove === 'function'
      });
    }
  }
}
