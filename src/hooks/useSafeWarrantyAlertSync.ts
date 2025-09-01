import { useEffect, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

// Use proper ES6 imports - NO require() statements
import { useAuth } from '../../contexts/AuthContext';
import { useWarrantyAlertStore } from '../stores/warrantyAlertStore';
import { warrantyAlertService } from '../services/warrantyAlertService';

export const useSafeWarrantyAlertSync = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use hooks normally
  let auth;
  let alertStore;
  
  try {
    auth = useAuth();
    alertStore = useWarrantyAlertStore();
  } catch (hookError) {
    console.error('Hook initialization error:', hookError);
    return { 
      isEnabled: false, 
      error: 'Hook initialization failed',
      syncAlerts: () => Promise.resolve()
    };
  }

  // Safety check - only enable if auth is working
  useEffect(() => {
    try {
      if (auth && typeof auth === 'object' && 'user' in auth) {
        console.log('Auth detected - enabling warranty alert sync');
        setIsEnabled(true);
        setError(null);
      } else {
        console.log('Auth not ready - warranty alert sync disabled');
        setIsEnabled(false);
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setIsEnabled(false);
      setError('Auth check failed');
    }
  }, [auth]);

  const syncAlerts = useCallback(async () => {
    if (!isEnabled) {
      console.log('Warranty alert sync not enabled - skipping');
      return;
    }

    try {
      // Safety checks
      if (!auth?.user || !auth?.session) {
        console.log('No authenticated user - clearing alerts');
        alertStore?.clearAll?.();
        return;
      }

      const isOnline = await warrantyAlertService.isOnline();
      if (!isOnline) {
        console.log('Offline - using cached warranty alerts');
        return;
      }

      console.log('Safe sync: Fetching warranty alerts from Supabase...');
      const supabaseAlerts = await warrantyAlertService.fetchUserAlerts(auth.user.id);
      
      // Convert to local format
      const localAlerts = supabaseAlerts.map((alert: any) => {
        return {
          id: alert.id || `synced_${Date.now()}_${Math.random()}`,
          device_id: alert.device_id,
          user_id: alert.user_id,
          reminder_date: alert.reminder_date,
          warranty_expire_date: alert.warranty_expire_date,
          created_at: new Date().toISOString()
        };
      });
      
      alertStore.setAlerts(localAlerts);
      console.log(`Safe sync complete - ${localAlerts.length} alerts loaded`);
      
    } catch (error) {
      console.error('Safe sync failed:', error);
      setError(error instanceof Error ? error.message : 'Sync failed');
    }
  }, [isEnabled, auth, alertStore]);

  // Initial sync when enabled and user authenticated
  useEffect(() => {
    if (isEnabled && auth?.user && auth?.session && !alertStore?.isLoaded) {
      console.log('Safe sync: Starting initial warranty alert sync');
      syncAlerts().catch(err => {
        console.warn('Initial sync failed:', err);
      });
    }
  }, [isEnabled, auth?.user, auth?.session, alertStore?.isLoaded, syncAlerts]);

  // App state sync (with error handling)
  useEffect(() => {
    if (!isEnabled) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && auth?.user && auth?.session) {
        console.log('Safe sync: App became active - syncing alerts');
        syncAlerts().catch(err => {
          console.warn('App state sync failed:', err);
        });
      }
    };

    try {
      const subscription = AppState.addEventListener('change', handleAppStateChange);
      
      return () => {
        subscription?.remove();
      };
    } catch (err) {
      console.warn('App state listener setup failed:', err);
    }
  }, [isEnabled, auth?.user, auth?.session, syncAlerts]);

  return { 
    isEnabled, 
    error, 
    syncAlerts: () => syncAlerts().catch(err => console.warn('Manual sync failed:', err))
  };
};
