// Global service to reset sync state across the app
class SyncResetService {
  private static instance: SyncResetService
  private resetCallbacks: Set<() => void> = new Set()

  private constructor() {}

  public static getInstance(): SyncResetService {
    if (!SyncResetService.instance) {
      SyncResetService.instance = new SyncResetService()
    }
    return SyncResetService.instance
  }

  // Register a callback to be called when sync state needs to be reset
  public registerResetCallback(callback: () => void): () => void {
    this.resetCallbacks.add(callback)
    
    // Return unregister function
    return () => {
      this.resetCallbacks.delete(callback)
    }
  }

  // Reset all registered sync states
  public resetAllSyncStates(): void {
    console.log('🔄 SyncResetService: Resetting all sync states...')
    this.resetCallbacks.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('Error in sync reset callback:', error)
      }
    })
    console.log('✅ SyncResetService: All sync states reset')
  }
}

export const syncResetService = SyncResetService.getInstance()
