import React, { createContext, useContext, useState, useCallback } from 'react';
import { backgroundSyncService, SyncResult } from '@/src/services/backgroundSyncService';
import { useAuth } from './AuthContext';

export interface SyncStatus {
  isActive: boolean;
  lastSyncTime: Date | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  error?: string;
  operationsCompleted: number;
  operationsFailed: number;
}

interface SyncContextType {
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  triggerSync: () => Promise<SyncResult | undefined>;
  syncInProgress: boolean;
  resetSyncStatus: () => void;
}

const defaultSyncStatus: SyncStatus = {
  isActive: false,
  lastSyncTime: null,
  status: 'idle',
  operationsCompleted: 0,
  operationsFailed: 0
};

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, syncReady } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(defaultSyncStatus);

  const resetSyncStatus = useCallback(() => {
    setSyncStatus(defaultSyncStatus);
  }, []);

  const triggerSync = useCallback(async () => {
    if (!user?.id || !syncReady) {
      console.log('Sync not ready - user:', !!user?.id, 'syncReady:', syncReady);
      return undefined;
    }

    try {
      console.log('=== SYNC CONTEXT SYNC TRIGGERED ===');
      setSyncStatus(prev => ({
        ...prev,
        isActive: true,
        status: 'syncing',
        error: undefined
      }));

      const result = await backgroundSyncService.performSync(user.id);

      if (result.success) {
        console.log('Sync context sync completed successfully');
        setSyncStatus({
          isActive: false,
          lastSyncTime: new Date(),
          status: 'success',
          operationsCompleted: result.operationsCompleted,
          operationsFailed: result.operationsFailed
        });
      } else {
        console.error('Sync context sync failed:', result.error);
        setSyncStatus({
          isActive: false,
          lastSyncTime: new Date(),
          status: 'error',
          error: result.error,
          operationsCompleted: result.operationsCompleted,
          operationsFailed: result.operationsFailed
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      console.error('Error in sync context sync:', errorMessage);
      setSyncStatus({
        isActive: false,
        lastSyncTime: new Date(),
        status: 'error',
        error: errorMessage,
        operationsCompleted: 0,
        operationsFailed: 1
      });
      return undefined;
    }
  }, [user?.id, syncReady]);

  const value: SyncContextType = {
    syncStatus,
    lastSyncTime: syncStatus.lastSyncTime,
    triggerSync,
    syncInProgress: syncStatus.isActive,
    resetSyncStatus
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};
