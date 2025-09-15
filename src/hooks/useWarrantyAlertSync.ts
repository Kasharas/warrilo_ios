import { useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '../../contexts/AuthContext'; // Your existing auth hook - DO NOT MODIFY
import { useWarrantyAlertStore } from '../stores/warrantyAlertStore';
import { warrantyAlertService } from '../services/warrantyAlertService';

export const useWarrantyAlertSync = () => {
  const { user, session } = useAuth(); // Using existing auth - DO NOT MODIFY
  const { setAlerts, isLoaded, clearAll } = useWarrantyAlertStore();
  
  const syncAlerts = useCallback(async () => {
    // Only sync after authentication is complete
    if (!user || !session) {
      console.log('No authenticated user - clearing alerts');
      clearAll();
      return;
    }
    
    try {
      const isOnline = await warrantyAlertService.isOnline();
      if (!isOnline) {
        console.log('Offline - using cached warranty alerts');
        return;
      }
      
      console.log('Syncing warranty alerts from Supabase...');
      const supabaseAlerts = await warrantyAlertService.fetchUserAlerts(user.id);
      
      // Convert Supabase alerts to local format and enrich with device names
      const localAlerts = supabaseAlerts.map(alert => {
        return {
          id: alert.id || `synced_${Date.now()}_${Math.random()}`,
          device_id: alert.device_id,
          user_id: alert.user_id,
          reminder_date: alert.reminder_date,
          warranty_expire_date: alert.warranty_expire_date,
          device_name: alert.device_name || 'Unknown device', // Include device name if available
          created_at: new Date().toISOString()
        };
      });
      
      setAlerts(localAlerts);
      console.log(`Warranty alert sync complete - ${localAlerts.length} alerts loaded`);
      
    } catch (error) {
      console.error('Failed to sync warranty alerts:', error);
      // Don't clear local data on sync failure
    }
  }, [user, session, setAlerts, clearAll]);
  
  // Initial sync when user is authenticated (AFTER auth completes)
  useEffect(() => {
    if (user && session && !isLoaded) {
      console.log('User authenticated - starting initial warranty alert sync');
      syncAlerts();
    }
  }, [user, session, isLoaded, syncAlerts]);
  
  // Sync when app becomes active (iOS/Android app state changes)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && user && session) {
        console.log('App became active - syncing warranty alerts');
        syncAlerts();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [user, session, syncAlerts]);
  
  return { syncAlerts };
};
