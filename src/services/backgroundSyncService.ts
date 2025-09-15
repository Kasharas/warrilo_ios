import { syncStatusService } from './syncStatusService'
import { localStorageSyncAdapter } from './localStorageSyncAdapter'
import { supabaseDataService } from './supabaseDataService'
import { dataComparisonService, SyncPlan } from './dataComparisonService'
import { validateSupabaseSession } from '../lib/sessionValidator'
import { warrantyAlertService } from './warrantyAlertService'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface SyncResult {
  success: boolean
  error?: string
  message?: string
  syncPlan?: SyncPlan
  operationsCompleted: number
  operationsFailed: number
  duration: number
  devicesProcessed?: number
  errors?: string[]
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
    
    console.log('Mobile background sync: Starting sync operation...', {
      userId,
      timestamp: new Date().toISOString(),
      platform: 'mobile'
    });

    // Validate session before any sync operations
    console.log('Mobile background sync: Validating session...');
    const sessionResult = await validateSupabaseSession();
    
    if (!sessionResult.isValid) {
      console.error('Mobile background sync: Aborted - invalid session:', {
        error: sessionResult.error,
        userId,
        platform: 'mobile',
        syncAttempt: 'background'
      });
      
      return {
        success: false,
        message: `Background sync failed: ${sessionResult.error}`,
        devicesProcessed: 0,
        errors: [`Session validation failed: ${sessionResult.error}`],
        operationsCompleted: 0,
        operationsFailed: 1,
        duration: Date.now() - startTime
      };
    }
    
    console.log('Mobile background sync: Session validated successfully, proceeding with sync...', {
      userId: sessionResult.session?.user.id,
      sessionValid: true,
      platform: 'mobile'
    });
    
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

      // Step 1: Always sync warranty alerts (Supabase has master priority)
      const alertsResult = await this.syncWarrantyAlerts(userId)
      
      // Step 2: Check if device sync is needed (unless forced)
      if (!force) {
        const syncNeeded = await dataComparisonService.isSyncNeeded(userId)
        if (!syncNeeded) {
          console.log('No device sync needed - data is already in sync')
          console.log(`Warranty alerts synced: ${alertsResult.alertsProcessed}`)
          syncStatusService.completeSync(true)
          return {
            success: true,
            operationsCompleted: 0,
            operationsFailed: 0,
            duration: Date.now() - startTime,
            alertsProcessed: alertsResult.alertsProcessed
          }
        }
      }

      // Step 2: Create sync plan
      console.log('Creating sync plan...')
      let syncPlan: SyncPlan
      
      try {
        syncPlan = await dataComparisonService.createSyncPlan(userId)
      } catch (error) {
        // Handle authentication errors from sync plan creation
        if (error instanceof Error && 
            (error.message.includes('AuthApiError') || 
             error.message.includes('Authentication error') ||
             error.message.includes('auth code'))) {
          
          console.error('Mobile background sync: Authentication error during sync plan creation:', {
            error: error.message,
            userId,
            platform: 'mobile',
            errorType: 'AuthAPIError'
          });
          
          return {
            success: false,
            message: 'Background sync failed: Authentication error. Please log out and log in again.',
            devicesProcessed: 0,
            errors: [`Authentication error: ${error.message}`],
            operationsCompleted: 0,
            operationsFailed: 1,
            duration: Date.now() - startTime
          };
        }
        
        // Re-throw other errors
        throw error;
      }

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
      console.log(`Warranty alerts synced: ${alertsResult.alertsProcessed}`)

      syncStatusService.completeSync(result.success, result.error)
      
      return {
        ...result,
        syncPlan,
        duration,
        alertsProcessed: alertsResult.alertsProcessed
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

  // Sync warranty alerts from Supabase (master priority)
  private async syncWarrantyAlerts(userId: string): Promise<{ alertsProcessed: number }> {
    try {
      console.log('🔄 Syncing warranty alerts from Supabase...')
      
      // Fetch alerts from Supabase
      const supabaseAlerts = await warrantyAlertService.fetchUserAlerts(userId)
      console.log(`📥 Fetched ${supabaseAlerts.length} warranty alerts from Supabase`)
      
      // Get current local alerts
      const localAlertsData = await AsyncStorage.getItem('warranty_alerts')
      const localAlerts = localAlertsData ? JSON.parse(localAlertsData) : []
      console.log(`📱 Found ${localAlerts.length} warranty alerts in local storage`)
      
      // Build device ID -> name mapping from local devices
      let deviceMap: Record<string, string> = {}
      try {
        const devices = await localStorageSyncAdapter.getUserDevices(userId)
        devices.forEach((device: any) => {
          if (device?.id) deviceMap[device.id] = device.name || 'Unknown device'
          if (device?.local_id) deviceMap[device.local_id] = device.name || 'Unknown device'
        })
        console.log('🔍 Sync: Device mapping built:', deviceMap)
      } catch (error) {
        console.log('⚠️ Sync: Failed to load devices for name mapping:', error)
      }
      
      // Convert Supabase alerts to local format and enrich with device names
      const enrichedSupabaseAlerts = supabaseAlerts.map(alert => ({
        id: alert.id,
        device_id: alert.device_id,
        user_id: alert.user_id,
        reminder_date: alert.reminder_date,
        warranty_expire_date: alert.warranty_expire_date,
        device_name: deviceMap[alert.device_id] || 'Unknown device',
        created_at: alert.created_at || new Date().toISOString()
      }))
      
      // Update local storage with Supabase data (master priority)
      await AsyncStorage.setItem('warranty_alerts', JSON.stringify(enrichedSupabaseAlerts))
      
      const alertsProcessed = enrichedSupabaseAlerts.length
      console.log(`✅ Warranty alerts sync complete: ${alertsProcessed} alerts processed`)
      
      return { alertsProcessed }
      
    } catch (error) {
      console.error('❌ Error syncing warranty alerts:', error)
      // Don't fail the entire sync for alert sync issues
      return { alertsProcessed: 0 }
    }
  }
}

export const backgroundSyncService = BackgroundSyncService.getInstance()
