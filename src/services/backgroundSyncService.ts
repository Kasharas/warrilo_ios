import { syncStatusService } from './syncStatusService'
import { localStorageSyncAdapter } from './localStorageSyncAdapter'
import { supabaseDataService } from './supabaseDataService'
import { dataComparisonService, SyncPlan } from './dataComparisonService'

export interface SyncResult {
  success: boolean
  error?: string
  syncPlan?: SyncPlan
  operationsCompleted: number
  operationsFailed: number
  duration: number
}

class BackgroundSyncService {
  private static instance: BackgroundSyncService
  private isOnline: boolean = true
  private pendingSyncUserId: string | null = null
  
  private constructor() {
    this.setupNetworkMonitoring()
  }
  
  public static getInstance(): BackgroundSyncService {
    if (!BackgroundSyncService.instance) {
      BackgroundSyncService.instance = new BackgroundSyncService()
    }
    return BackgroundSyncService.instance
  }

  // Main sync method
  public async performSync(userId: string, force: boolean = false): Promise<SyncResult> {
    const startTime = Date.now()
    
    console.log('=== BACKGROUND SYNC STARTED ===')
    console.log('User ID:', userId)
    console.log('Force sync:', force)
    console.log('Network online:', this.isOnline)
    
    // Check if sync is already running
    if (!syncStatusService.startSync()) {
      console.log('Sync already in progress, skipping')
      return {
        success: false,
        error: 'Sync already in progress',
        operationsCompleted: 0,
        operationsFailed: 0,
        duration: Date.now() - startTime
      }
    }

    try {
      // Check network connectivity
      if (!this.isOnline) {
        this.pendingSyncUserId = userId
        throw new Error('No network connection. Sync will retry when connection is restored.')
      }

      // Clear pending sync since we're now online
      this.pendingSyncUserId = null

      // Step 1: Check if sync is needed (unless forced)
      if (!force) {
        const syncNeeded = await dataComparisonService.isSyncNeeded(userId)
        if (!syncNeeded) {
          console.log('No sync needed - data is already in sync')
          syncStatusService.completeSync(true)
          return {
            success: true,
            operationsCompleted: 0,
            operationsFailed: 0,
            duration: Date.now() - startTime
          }
        }
      }

      // Step 2: Create sync plan
      console.log('Creating sync plan...')
      const syncPlan = await dataComparisonService.createSyncPlan(userId)

      if (syncPlan.summary.totalOperations === 0) {
        console.log('No operations needed - data is in sync')
        syncStatusService.completeSync(true)
        return {
          success: true,
          syncPlan,
          operationsCompleted: 0,
          operationsFailed: 0,
          duration: Date.now() - startTime
        }
      }

      // Step 3: Execute sync operations
      const result = await this.executeSyncPlan(syncPlan)
      
      const duration = Date.now() - startTime
      console.log(`=== BACKGROUND SYNC COMPLETED ===`)
      console.log(`Duration: ${duration}ms`)
      console.log(`Operations completed: ${result.operationsCompleted}`)
      console.log(`Operations failed: ${result.operationsFailed}`)

      syncStatusService.completeSync(result.success, result.error)
      
      return {
        ...result,
        syncPlan,
        duration
      }

    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error'
      
      // Enhanced network error detection
      if (this.isNetworkError(error)) {
        console.log('Network error detected, queuing sync for retry')
        this.pendingSyncUserId = userId
      }
      
      console.error('Background sync failed:', errorMessage)
      syncStatusService.completeSync(false, errorMessage)
      
      return {
        success: false,
        error: errorMessage,
        operationsCompleted: 0,
        operationsFailed: 1,
        duration
      }
    }
  }

  // Execute the sync plan
  private async executeSyncPlan(syncPlan: SyncPlan): Promise<{
    success: boolean
    error?: string
    operationsCompleted: number
    operationsFailed: number
  }> {
    let operationsCompleted = 0
    let operationsFailed = 0

    try {
      // Step 1: Remove devices that don't exist in Supabase
      if (syncPlan.devicesToRemove.length > 0) {
        console.log(`Removing ${syncPlan.devicesToRemove.length} devices from local storage`)
        
        try {
          await localStorageSyncAdapter.removeDevicesByIds(syncPlan.devicesToRemove)
          operationsCompleted += syncPlan.devicesToRemove.length
          console.log(`Successfully removed ${syncPlan.devicesToRemove.length} devices`)
        } catch (error) {
          console.error('Error removing devices:', error)
          operationsFailed += syncPlan.devicesToRemove.length
        }
      }

      // Step 2: Add devices that exist in Supabase but not locally
      if (syncPlan.devicesToAdd.length > 0) {
        console.log(`Adding ${syncPlan.devicesToAdd.length} devices to local storage`)
        
        for (const device of syncPlan.devicesToAdd) {
          try {
            const localDevice = dataComparisonService.supabaseToLocal(device)
            await localStorageSyncAdapter.updateDevice(localDevice)
            operationsCompleted++
          } catch (error) {
            console.error(`Error adding device ${device.id}:`, error)
            operationsFailed++
          }
        }
      }

      // Step 3: Update devices that exist in both but are different
      if (syncPlan.devicesToUpdate.length > 0) {
        console.log(`Updating ${syncPlan.devicesToUpdate.length} devices in local storage`)
        
        for (const device of syncPlan.devicesToUpdate) {
          try {
            const localDevice = dataComparisonService.supabaseToLocal(device)
            await localStorageSyncAdapter.updateDevice(localDevice)
            operationsCompleted++
          } catch (error) {
            console.error(`Error updating device ${device.id}:`, error)
            operationsFailed++
          }
        }
      }

      return {
        success: operationsFailed === 0,
        error: operationsFailed > 0 ? `${operationsFailed} operations failed` : undefined,
        operationsCompleted,
        operationsFailed
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to execute sync plan'
      console.error('Error executing sync plan:', errorMessage)
      
      return {
        success: false,
        error: errorMessage,
        operationsCompleted,
        operationsFailed: syncPlan.summary.totalOperations - operationsCompleted
      }
    }
  }

  // Enhanced error detection method
  private isNetworkError(error: any): boolean {
    if (!error) return false
    
    const errorMessage = (error.message || '').toLowerCase()
    const errorCode = error.code || ''
    
    // Check for common network error indicators
    return (
      !this.isOnline ||
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorCode === 'NETWORK_ERROR' ||
      errorCode === 'ECONNRESET' ||
      errorCode === 'ENOTFOUND'
    )
  }

  // Setup network monitoring
  private setupNetworkMonitoring(): void {
    // Web
    if (typeof window !== 'undefined' && window.navigator && window.addEventListener) {
      this.isOnline = window.navigator.onLine
      
      window.addEventListener('online', () => {
        console.log('Network connection restored (Web)')
        this.isOnline = true
        if (this.pendingSyncUserId) {
          console.log('Attempting pending sync after network restoration')
          setTimeout(() => {
            if (this.pendingSyncUserId) {
              this.performSync(this.pendingSyncUserId)
              this.pendingSyncUserId = null
            }
          }, 1000) // Small delay to ensure connection is stable
        }
      })
      
      window.addEventListener('offline', () => {
        console.log('Network connection lost (Web)')
        this.isOnline = false
      })
    } 
    // React Native - would integrate NetInfo if available
    else {
      console.log('Network monitoring: Using default online status for React Native')
      this.isOnline = true
      
      // In a real React Native app, you would add:
      // import NetInfo from '@react-native-community/netinfo'
      // NetInfo.addEventListener(state => {
      //   this.isOnline = state.isConnected ?? false
      //   if (this.isOnline && this.pendingSyncUserId) {
      //     this.performSync(this.pendingSyncUserId)
      //     this.pendingSyncUserId = null
      //   }
      // })
    }
  }
}

export const backgroundSyncService = BackgroundSyncService.getInstance()
