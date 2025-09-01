import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';

// CRITICAL: REMOVE the problematic NetInfo import completely
// DELETE THIS LINE if it exists:
// import NetInfo from '@react-native-community/netinfo';

export interface SupabaseWarrantyAlert {
  id?: string;
  device_id: string;
  user_id: string;
  reminder_date: string;
  warranty_expire_date: string;
}

// Web-safe network check - NO NetInfo import
const checkConnectivity = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    // Web: Use browser API
    return navigator?.onLine ?? true;
  }
  
  // Mobile: Conditional require (not import)
  try {
    if (Platform.OS === 'web') {
      return navigator?.onLine ?? true;
    }
    const NetInfo = require('@react-native-community/netinfo');
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected ?? true;
  } catch (error) {
    console.warn('NetInfo unavailable, assuming connected');
    return true;
  }
};

// Rest of service code stays the same...
export const warrantyAlertService = {
  async fetchUserAlerts(userId: string): Promise<SupabaseWarrantyAlert[]> {
    const isConnected = await checkConnectivity();
    if (!isConnected) {
      throw new Error('No internet connection');
    }
    
    try {
      const { data, error } = await supabase
        .from('warranty_reminders')
        .select('id, device_id, user_id, reminder_date, warranty_expire_date')
        .eq('user_id', userId)
        .order('reminder_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching warranty alerts:', error);
      throw error;
    }
  },
  
  async createAlerts(alerts: Omit<SupabaseWarrantyAlert, 'id'>[]): Promise<SupabaseWarrantyAlert[]> {
    const isConnected = await checkConnectivity();
    if (!isConnected) {
      console.warn('Offline - alerts will sync later');
      return [];
    }
    
    if (alerts.length === 0) return [];
    
    try {
      const { data, error } = await supabase
        .from('warranty_reminders')
        .insert(alerts)
        .select('id, device_id, user_id, reminder_date, warranty_expire_date');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error creating warranty alerts:', error);
      throw error;
    }
  },
  
  async deleteAlertsByDeviceId(deviceId: string): Promise<void> {
    const isConnected = await checkConnectivity();
    if (!isConnected) {
      console.warn('Offline - deletion will sync later');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('warranty_reminders')
        .delete()
        .eq('device_id', deviceId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting warranty alerts:', error);
      throw error;
    }
  },
  
  async isOnline(): Promise<boolean> {
    return await checkConnectivity();
  }
};
