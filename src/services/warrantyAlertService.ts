import { Platform } from 'react-native';
import { supabase } from '../../lib/supabaseClient';

export interface SupabaseWarrantyAlert {
  id?: string;
  device_id: string;
  user_id: string;
  reminder_date: string;
  warranty_expire_date: string;
  device_name?: string; // Optional device name for local storage
}

// Web-safe network check
const checkConnectivity = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return navigator?.onLine ?? true;
  }
  
  try {
    const NetInfo = require('@react-native-community/netinfo');
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected ?? true;
  } catch (error) {
    console.warn('NetInfo unavailable, assuming connected');
    return true;
  }
};

export const warrantyAlertService = {
  async fetchUserAlerts(userId: string): Promise<SupabaseWarrantyAlert[]> {
    const isConnected = await checkConnectivity();
    if (!isConnected) {
      throw new Error('No internet connection');
    }
    
    try {
      const { data, error } = await supabase
        .from('warranty_reminders')
        .select('id, device_id, user_id, reminder_date, warranty_expire_date, created_at')
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
    
    if (alerts.length === 0) {
      console.log('No alerts to create');
      return [];
    }
    
    try {
      console.log('🔧 Attempting to create warranty alerts in Supabase...');
      console.log('📊 Alert data to insert:', JSON.stringify(alerts, null, 2));
      
      // ✅ VALIDATE DATA BEFORE INSERT
      const validAlerts = alerts.filter(alert => {
        const isValid = alert.device_id && alert.user_id && alert.reminder_date && 
                       alert.warranty_expire_date;
        if (!isValid) {
          console.warn('⚠️ Invalid alert data:', alert);
        }
        return isValid;
      });
      
      // ✅ PREPARE DATA FOR SUPABASE (remove fields not in the schema)
      const supabaseAlerts = validAlerts.map(alert => {
        const { device_name, local_device_id, ...supabaseAlert } = alert as any;
        return supabaseAlert;
      });
      
      if (validAlerts.length === 0) {
        console.warn('⚠️ No valid alerts to insert');
        return [];
      }
      
      console.log(`📝 Inserting ${supabaseAlerts.length} valid alerts...`);
      
      // ✅ SIMPLIFIED INSERT - NO .select() to avoid URL corruption
      const { data, error } = await supabase
        .from('warranty_reminders')
        .insert(supabaseAlerts);
      
      if (error) {
        console.error('❌ Supabase insert error:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('✅ Successfully created warranty alerts in Supabase');
      console.log('📊 Created alerts count:', supabaseAlerts.length);
      
      // Return the alerts with generated IDs (since we didn't select, we generate temp IDs)
      // Include device_name from original alerts for local storage
      return validAlerts.map((alert, index) => ({
        ...alert,
        id: `temp_${Date.now()}_${index}`
      }));
      
    } catch (error) {
      console.error('❌ Error creating warranty alerts:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
      
      // ✅ ADDITIONAL DEBUGGING
      if (error && typeof error === 'object' && 'code' in error) {
        console.error('❌ Error code:', (error as any).code);
      }
      if (error && typeof error === 'object' && 'details' in error) {
        console.error('❌ Error details:', (error as any).details);
      }
      
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
      console.log('🗑️ Deleting warranty alerts for device:', deviceId);
      
      const { error } = await supabase
        .from('warranty_reminders')
        .delete()
        .eq('device_id', deviceId);
      
      if (error) {
        console.error('❌ Error deleting warranty alerts:', error);
        throw error;
      }
      
      console.log('✅ Successfully deleted warranty alerts for device:', deviceId);
    } catch (error) {
      console.error('❌ Error deleting warranty alerts:', error);
      throw error;
    }
  },
  
  async isOnline(): Promise<boolean> {
    return await checkConnectivity();
  }
};
