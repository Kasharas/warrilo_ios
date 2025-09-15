import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Platform-specific storage
const getStorage = () => {
  if (Platform.OS === 'web') {
    return localStorage;
  }
  // Mobile: use static import AsyncStorage (default export)
  return AsyncStorage;
};

// Use the existing storage key from your current implementation
const DEVICES_STORAGE_KEY = 'warrilo_devices'

export interface SyncLocalDevice {
  id: string
  user_id: string
  name: string
  supplier?: string | null
  category?: string | null
  purchase_date?: string
  purchase_price?: number | null
  location?: string | null
  photo_irl?: string | null
  notes?: string | null
  invoice_url?: string
  identifiers?: string | null
  created_at: string
  sync_status?: 'pending' | 'syncing' | 'synced' | 'failed'
  local_id?: string
  // Keep existing local storage fields your app already uses
  [key: string]: any
}

class LocalStorageSyncAdapter {
  private static instance: LocalStorageSyncAdapter
  
  private constructor() {}
  
  public static getInstance(): LocalStorageSyncAdapter {
    if (!LocalStorageSyncAdapter.instance) {
      LocalStorageSyncAdapter.instance = new LocalStorageSyncAdapter()
    }
    return LocalStorageSyncAdapter.instance
  }

  // Get all devices using existing storage pattern
  public async getAllDevices(): Promise<SyncLocalDevice[]> {
    try {
      const devicesData = await AsyncStorage.getItem(DEVICES_STORAGE_KEY)
      if (!devicesData) {
        return []
      }
      return JSON.parse(devicesData)
    } catch (error) {
      console.error('Error reading devices from local storage:', error)
      return []
    }
  }

  // Get device IDs only (for efficient sync comparison)
  public async getDeviceIds(): Promise<string[]> {
    try {
      const devices = await this.getAllDevices()
      return devices.map(device => device.id)
    } catch (error) {
      console.error('Error getting device IDs:', error)
      return []
    }
  }

  // Get devices for specific user
  public async getUserDevices(userId: string): Promise<SyncLocalDevice[]> {
    try {
      const devices = await this.getAllDevices()
      return devices.filter(device => device.user_id === userId)
    } catch (error) {
      console.error('Error getting user devices:', error)
      return []
    }
  }

  // Get user device count
  public async getUserDevicesCount(userId: string): Promise<number> {
    try {
      const devices = await this.getUserDevices(userId)
      return devices.length
    } catch (error) {
      console.error('Error counting user devices:', error)
      return 0
    }
  }

  // Sync-specific: Update single device (preserves existing local data)
  public async updateDevice(device: SyncLocalDevice): Promise<void> {
    try {
      const devices = await this.getAllDevices()
      const existingIndex = devices.findIndex(d => d.id === device.id)
      
      if (existingIndex >= 0) {
        // Preserve existing local-only fields, update with Supabase data
        const existingDevice = devices[existingIndex]
        devices[existingIndex] = {
          ...existingDevice, // Keep local images, receipt data, etc.
          ...device,         // Override with Supabase data
          last_sync: new Date().toISOString()
        }
      } else {
        // New device from Supabase
        devices.push({
          ...device,
          last_sync: new Date().toISOString()
        })
      }
      
      await AsyncStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(devices))
    } catch (error) {
      console.error('Error updating device in local storage:', error)
      throw error
    }
  }

  // Sync-specific: Batch update devices
  public async updateDevices(devices: SyncLocalDevice[]): Promise<void> {
    try {
      for (const device of devices) {
        await this.updateDevice(device)
      }
    } catch (error) {
      console.error('Error batch updating devices:', error)
      throw error
    }
  }

  // Sync-specific: Remove devices that don't exist in Supabase
  public async removeDevicesByIds(deviceIds: string[]): Promise<void> {
    try {
      if (deviceIds.length === 0) return
      
      console.log(`Removing ${deviceIds.length} devices from local storage:`, deviceIds)
      
      // Clean up warranty alerts for each device being removed
      for (const deviceId of deviceIds) {
        try {
          await this.cleanupWarrantyAlertsForDevice(deviceId)
        } catch (error) {
          console.error(`Error cleaning up warranty alerts for device ${deviceId}:`, error)
          // Don't fail the entire operation for alert cleanup issues
        }
      }
      
      const devices = await this.getAllDevices()
      const filteredDevices = devices.filter(device => !deviceIds.includes(device.id))
      
      await AsyncStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(filteredDevices))
      
      console.log(`Successfully removed ${deviceIds.length} devices from local storage`)
    } catch (error) {
      console.error('Error removing devices from local storage:', error)
      throw error
    }
  }

  // Helper method to clean up warranty alerts for a specific device
  private async cleanupWarrantyAlertsForDevice(deviceId: string): Promise<void> {
    try {
      console.log('🧹 Sync: Cleaning up warranty alerts for device:', deviceId)
      const alertsData = await AsyncStorage.getItem('warranty_alerts')
      
      if (alertsData) {
        const alerts = JSON.parse(alertsData)
        const filteredAlerts = alerts.filter((alert: any) => alert.device_id !== deviceId)
        
        if (filteredAlerts.length !== alerts.length) {
          await AsyncStorage.setItem('warranty_alerts', JSON.stringify(filteredAlerts))
          console.log(`✅ Sync: Removed ${alerts.length - filteredAlerts.length} warranty alerts for device:`, deviceId)
        }
      }
    } catch (error) {
      console.error('❌ Sync: Error cleaning up warranty alerts:', error)
      throw error
    }
  }

  // Sync-specific: Add new devices from Supabase
  public async addDevices(devices: SyncLocalDevice[]): Promise<void> {
    try {
      if (devices.length === 0) return
      
      console.log(`Adding ${devices.length} devices to local storage`)
      
      const existingDevices = await this.getAllDevices()
      const devicesWithSyncTimestamp = devices.map(device => ({
        ...device,
        last_sync: new Date().toISOString()
      }))
      
      const updatedDevices = [...existingDevices, ...devicesWithSyncTimestamp]
      await AsyncStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(updatedDevices))
      
      console.log(`Successfully added ${devices.length} devices to local storage`)
    } catch (error) {
      console.error('Error adding devices to local storage:', error)
      throw error
    }
  }

  // Sync-specific: Replace all user devices (for full sync)
  public async replaceUserDevices(userId: string, newDevices: SyncLocalDevice[]): Promise<void> {
    try {
      console.log(`Replacing all devices for user ${userId} with ${newDevices.length} devices`)
      
      const allDevices = await this.getAllDevices()
      
      // Remove existing devices for this user
      const otherUsersDevices = allDevices.filter(device => device.user_id !== userId)
      
      // Add new devices with sync timestamp
      const devicesWithSyncTimestamp = newDevices.map(device => ({
        ...device,
        last_sync: new Date().toISOString()
      }))
      
      const finalDevices = [...otherUsersDevices, ...devicesWithSyncTimestamp]
      await AsyncStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(finalDevices))
      
      console.log(`Successfully replaced devices for user ${userId}`)
    } catch (error) {
      console.error('Error replacing user devices:', error)
      throw error
    }
  }

  // Debug: Get storage stats
  public async getStorageStats(): Promise<{
    totalDevices: number
    storageSize: string
    lastSync?: string
  }> {
    try {
      const devices = await this.getAllDevices()
      const devicesData = await AsyncStorage.getItem(DEVICES_STORAGE_KEY)
      const sizeInBytes = devicesData ? new Blob([devicesData]).size : 0
      const sizeInKB = (sizeInBytes / 1024).toFixed(2)
      
      const lastSync = devices.length > 0 
        ? devices.reduce((latest, device: any) => {
            const syncTime = device.last_sync ? new Date(device.last_sync) : new Date(0)
            return syncTime > latest ? syncTime : latest
          }, new Date(0)).toISOString()
        : undefined
      
      return {
        totalDevices: devices.length,
        storageSize: `${sizeInKB} KB`,
        lastSync
      }
    } catch (error) {
      console.error('Error getting storage stats:', error)
      return { totalDevices: 0, storageSize: '0 KB' }
    }
  }
}

export const localStorageSyncAdapter = LocalStorageSyncAdapter.getInstance()
