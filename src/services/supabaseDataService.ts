import { supabase } from '../../lib/supabaseClient'

export interface SupabaseDevice {
  id: string
  user_id: string
  name: string
  supplier?: string | null
  category?: string | null
  purchase_date?: string
  purchase_price?: number | null
  location?: string | null
  photo_irl?: string | null
  notes?: string | null
  invoice_url?: string
  identifiers?: string | null
  warranty_months?: number
  warranty_end_date?: string
  created_at: string
}

class SupabaseDataService {
  private static instance: SupabaseDataService
  
  private constructor() {}
  
  public static getInstance(): SupabaseDataService {
    if (!SupabaseDataService.instance) {
      SupabaseDataService.instance = new SupabaseDataService()
    }
    return SupabaseDataService.instance
  }

  // Get all devices for a user
  public async getUserDevices(userId: string): Promise<SupabaseDevice[]> {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        // Check for authentication errors
        if (error.message?.includes('AuthApiError') || 
            error.message?.includes('invalid request') ||
            error.message?.includes('auth code')) {
          
          console.error('Mobile background sync: Authentication error during fetch:', {
            error: error.message,
            userId,
            platform: 'mobile',
            errorType: 'AuthAPIError'
          });
          
          throw new Error('Background sync failed: Authentication error. Please log out and log in again.');
        }
        
        console.error('Error fetching devices from Supabase:', error)
        throw error
      }

      return data || []
    } catch (error) {
      if (error instanceof Error && error.message.includes('AuthApiError')) {
        console.error('Mobile background sync: Caught AuthAPIError:', {
          error: error.message,
          userId,
          platform: 'mobile'
        });
        
        throw new Error('Background sync authentication error');
      }
      
      console.error('Error in getUserDevices:', error)
      throw error
    }
  }

  // Get device IDs only (for efficient comparison)
  public async getUserDeviceIds(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('id')
        .eq('user_id', userId)

      if (error) {
        // Check for authentication errors
        if (error.message?.includes('AuthApiError') || 
            error.message?.includes('invalid request') ||
            error.message?.includes('auth code')) {
          
          console.error('Mobile background sync: Authentication error during device IDs fetch:', {
            error: error.message,
            userId,
            platform: 'mobile',
            errorType: 'AuthAPIError'
          });
          
          throw new Error('Background sync failed: Authentication error. Please log out and log in again.');
        }
        
        console.error('Error fetching device IDs from Supabase:', error)
        throw error
      }

      return (data || []).map(device => device.id)
    } catch (error) {
      if (error instanceof Error && error.message.includes('AuthApiError')) {
        console.error('Mobile background sync: Caught AuthAPIError in getUserDeviceIds:', {
          error: error.message,
          userId,
          platform: 'mobile'
        });
        
        throw new Error('Background sync authentication error');
      }
      
      console.error('Error in getUserDeviceIds:', error)
      throw error
    }
  }

  // Get devices count for user
  public async getUserDevicesCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('devices')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (error) {
        // Check for authentication errors
        if (error.message?.includes('AuthApiError') || 
            error.message?.includes('invalid request') ||
            error.message?.includes('auth code')) {
          
          console.error('Mobile background sync: Authentication error during device count:', {
            error: error.message,
            userId,
            platform: 'mobile',
            errorType: 'AuthAPIError'
          });
          
          throw new Error('Background sync failed: Authentication error. Please log out and log in again.');
        }
        
        console.error('Error counting user devices:', error)
        throw error
      }

      return count || 0
    } catch (error) {
      if (error instanceof Error && error.message.includes('AuthApiError')) {
        console.error('Mobile background sync: Caught AuthAPIError in getUserDevicesCount:', {
          error: error.message,
          userId,
          platform: 'mobile'
        });
        
        throw new Error('Background sync authentication error');
      }
      
      console.error('Error in getUserDevicesCount:', error)
      return 0
    }
  }
}

export const supabaseDataService = SupabaseDataService.getInstance()
