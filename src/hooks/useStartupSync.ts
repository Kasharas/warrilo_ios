import { useEffect, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { backgroundSyncService } from '../services/backgroundSyncService'
import { syncStatusService } from '../services/syncStatusService'
import { useAuth } from '../../contexts/AuthContext'

interface UseStartupSyncOptions {
  enableAutoSync?: boolean
  syncOnAppResume?: boolean
  syncIntervalMinutes?: number
  retryOnFailure?: boolean
  maxRetries?: number
}

export const useStartupSync = (options: UseStartupSyncOptions = {}) => {
  const {
    enableAutoSync = true,
    syncOnAppResume = true,
    syncIntervalMinutes = 30,
    retryOnFailure = true,
    maxRetries = 3
  } = options

  const { user, loading: authLoading } = useAuth()
  
  const retryCountRef = useRef(0)
  const syncIntervalRef = useRef<number | null>(null)
  const hasInitialSyncedRef = useRef(false)

  // Main sync function with retry logic
  const performSyncWithRetry = async (): Promise<void> => {
    if (!user?.id || syncStatusService.isCurrentlySyncing()) {
      return
    }

    console.log('=== STARTUP SYNC TRIGGERED ===')
    console.log('User ID:', user.id)
    console.log('Retry attempt:', retryCountRef.current + 1)

    try {
      const result = await backgroundSyncService.performSync(user.id)
      
      if (result.success) {
        retryCountRef.current = 0 // Reset retry count on success
        console.log('Startup sync completed successfully')
      } else if (retryOnFailure && retryCountRef.current < maxRetries) {
        retryCountRef.current++
        console.log(`Sync failed, scheduling retry ${retryCountRef.current}/${maxRetries}`)
        
        // Exponential backoff: 2s, 4s, 8s
        const retryDelay = Math.pow(2, retryCountRef.current) * 1000
        setTimeout(performSyncWithRetry, retryDelay)
      }

    } catch (error) {
      console.error('Sync error in useStartupSync:', error)

      if (retryOnFailure && retryCountRef.current < maxRetries) {
        retryCountRef.current++
        const retryDelay = Math.pow(2, retryCountRef.current) * 1000
        setTimeout(performSyncWithRetry, retryDelay)
      }
    }
  }

  // Initial sync on app startup
  useEffect(() => {
    if (!authLoading && user?.id && enableAutoSync && !hasInitialSyncedRef.current) {
      console.log('Triggering initial startup sync')
      hasInitialSyncedRef.current = true
      
      // Small delay to ensure app is fully loaded
      const timeoutId = setTimeout(() => {
        performSyncWithRetry()
      }, 1000)

      return () => clearTimeout(timeoutId)
    }
  }, [user?.id, authLoading, enableAutoSync])

  // Handle app state changes (foreground/background)
  useEffect(() => {
    if (!syncOnAppResume || !user?.id) return

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && hasInitialSyncedRef.current) {
        console.log('App became active, checking sync status')
        
        // Check if enough time has passed since last sync
        const lastSyncTime = syncStatusService.getLastSyncTime()
        if (lastSyncTime) {
          const timeSinceLastSync = Date.now() - lastSyncTime.getTime()
          const syncIntervalMs = syncIntervalMinutes * 60 * 1000
          
          if (timeSinceLastSync > syncIntervalMs) {
            console.log('Sufficient time passed, triggering sync')
            retryCountRef.current = 0 // Reset retry count for app resume
            performSyncWithRetry()
          }
        } else {
          // No previous sync, trigger one
          performSyncWithRetry()
        }
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => subscription?.remove()
  }, [user?.id, syncOnAppResume, syncIntervalMinutes])

  // Periodic sync interval (optional)
  useEffect(() => {
    if (!user?.id || syncIntervalMinutes <= 0) return

    console.log(`Setting up periodic sync every ${syncIntervalMinutes} minutes`)
    
    syncIntervalRef.current = setInterval(() => {
      if (!syncStatusService.isCurrentlySyncing()) {
        console.log('Periodic sync triggered')
        retryCountRef.current = 0
        performSyncWithRetry()
      }
    }, syncIntervalMinutes * 60 * 1000)

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [user?.id, syncIntervalMinutes])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [])

  // Return minimal interface (no UI state needed)
  return {
    // Empty return - this is purely for side effects
  }
}
