export interface SyncStatus {
  isActive: boolean
  lastSyncTime: Date | null
  status: 'idle' | 'syncing' | 'success' | 'error'
  error?: string
}

class SyncStatusService {
  private static instance: SyncStatusService
  private status: SyncStatus = {
    isActive: false,
    lastSyncTime: null,
    status: 'idle'
  }

  private constructor() {}

  public static getInstance(): SyncStatusService {
    if (!SyncStatusService.instance) {
      SyncStatusService.instance = new SyncStatusService()
    }
    return SyncStatusService.instance
  }

  public getStatus(): SyncStatus {
    return { ...this.status }
  }

  public updateStatus(updates: Partial<SyncStatus>): void {
    this.status = { ...this.status, ...updates }
  }

  public startSync(): boolean {
    if (this.status.isActive) {
      return false // Sync already in progress
    }
    
    this.updateStatus({
      isActive: true,
      status: 'syncing',
      error: undefined
    })
    return true
  }

  public completeSync(success: boolean, error?: string): void {
    this.updateStatus({
      isActive: false,
      status: success ? 'success' : 'error',
      lastSyncTime: new Date(),
      error
    })
  }

  public canSync(): boolean {
    return !this.status.isActive
  }

  public isCurrentlySyncing(): boolean {
    return this.status.isActive
  }

  public getLastSyncTime(): Date | null {
    return this.status.lastSyncTime
  }
}

export const syncStatusService = SyncStatusService.getInstance()
