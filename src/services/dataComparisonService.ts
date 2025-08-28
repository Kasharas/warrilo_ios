import { SyncLocalDevice, localStorageSyncAdapter } from './localStorageSyncAdapter'
import { SupabaseDevice, supabaseDataService } from './supabaseDataService'

export interface SyncPlan {
  devicesToAdd: SupabaseDevice[]      // In Supabase but not in local
  devicesToRemove: string[]           // In local but not in Supabase
  devicesToUpdate: SupabaseDevice[]   // In both but different
  summary: {
    totalOperations: number
    addCount: number
    removeCount: number
    updateCount: number
  }
}

class DataComparisonService {
  private static instance: DataComparisonService
  
  private constructor() {}
  
  public static getInstance(): DataComparisonService {
    if (!DataComparisonService.instance) {
      DataComparisonService.instance = new DataComparisonService()
    }
    return DataComparisonService.instance
  }

  // Main comparison method using existing local storage
  public async createSyncPlan(userId: string): Promise<SyncPlan> {
    try {
      console.log(`Creating sync plan for user: ${userId}`)
      
      // Get data from both sources using existing storage patterns
      const [localDevices, supabaseDevices] = await Promise.all([
        localStorageSyncAdapter.getUserDevices(userId),  // Use existing storage
        supabaseDataService.getUserDevices(userId)
      ])

      console.log(`Local devices: ${localDevices.length}, Supabase devices: ${supabaseDevices.length}`)
      
      // Create ID maps for efficient lookup
      const localDeviceMap = new Map(localDevices.map(device => [device.id, device]))
      const supabaseDeviceMap = new Map(supabaseDevices.map(device => [device.id, device]))

      // Find devices to add (in Supabase but not in local)
      const devicesToAdd = supabaseDevices.filter(device => !localDeviceMap.has(device.id))

      // Find devices to remove (in local but not in Supabase)
      const devicesToRemove = localDevices
        .filter(device => !supabaseDeviceMap.has(device.id))
        .map(device => device.id)

      // Find devices to update (in both but potentially different)
      const devicesToUpdate: SupabaseDevice[] = []
      for (const supabaseDevice of supabaseDevices) {
        const localDevice = localDeviceMap.get(supabaseDevice.id)
        if (localDevice && this.needsUpdate(localDevice, supabaseDevice)) {
          devicesToUpdate.push(supabaseDevice)
        }
      }

      const syncPlan: SyncPlan = {
        devicesToAdd,
        devicesToRemove,
        devicesToUpdate,
        summary: {
          totalOperations: devicesToAdd.length + devicesToRemove.length + devicesToUpdate.length,
          addCount: devicesToAdd.length,
          removeCount: devicesToRemove.length,
          updateCount: devicesToUpdate.length
        }
      }

      console.log('Sync plan summary:', syncPlan.summary)
      return syncPlan
    } catch (error) {
      console.error('Error creating sync plan:', error)
      throw error
    }
  }

  // Check if local device needs update from Supabase version
  private needsUpdate(localDevice: SyncLocalDevice, supabaseDevice: SupabaseDevice): boolean {
    // Compare key fields to determine if update is needed
    const fieldsToCompare = [
      'name', 'supplier', 'category', 'purchase_date', 
      'purchase_price', 'location', 'warranty_months', 
      'warranty_end_date', 'photo_irl', 'invoice_url', 
      'identifiers', 'notes'
    ]

    for (const field of fieldsToCompare) {
      const localValue = localDevice[field as keyof SyncLocalDevice]
      const supabaseValue = supabaseDevice[field as keyof SupabaseDevice]
      
      if (localValue !== supabaseValue) {
        console.log(`Device ${localDevice.id} needs update: ${field} differs`)
        return true
      }
    }

    return false
  }

  // Convert Supabase device to Local device format (preserves existing local data)
  public supabaseToLocal(supabaseDevice: SupabaseDevice): SyncLocalDevice {
    return {
      ...supabaseDevice,
      last_sync: new Date().toISOString()
      // Note: Existing local-specific fields will be preserved by updateDevice method
    }
  }

  // Quick check if sync is needed (without creating full plan)
  public async isSyncNeeded(userId: string): Promise<boolean> {
    try {
      const [localCount, remoteCount] = await Promise.all([
        localStorageSyncAdapter.getUserDevicesCount(userId),  // Use existing storage
        supabaseDataService.getUserDevicesCount(userId)
      ])

      // Quick count comparison
      if (localCount !== remoteCount) {
        console.log(`Sync needed: count mismatch (local: ${localCount}, remote: ${remoteCount})`)
        return true
      }

      // If counts match but both are 0, no sync needed
      if (localCount === 0 && remoteCount === 0) {
        return false
      }

      // Quick ID comparison for non-zero counts
      const [localDevices, remoteIds] = await Promise.all([
        localStorageSyncAdapter.getUserDevices(userId),  // Use existing storage
        supabaseDataService.getUserDeviceIds(userId)
      ])

      const localIds = localDevices.map(device => device.id)
      const localIdSet = new Set(localIds)
      const remoteIdSet = new Set(remoteIds)
      
      for (const id of localIdSet) {
        if (!remoteIdSet.has(id)) {
          console.log(`Sync needed: local device ${id} not found in remote`)
          return true
        }
      }

      for (const id of remoteIdSet) {
        if (!localIdSet.has(id)) {
          console.log(`Sync needed: remote device ${id} not found in local`)
          return true
        }
      }

      return false
    } catch (error) {
      console.error('Error checking if sync is needed:', error)
      return true // Assume sync is needed if we can't determine
    }
  }
}

export const dataComparisonService = DataComparisonService.getInstance()
