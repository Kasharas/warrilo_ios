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

  private constructor() { }

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

      console.log(`📥 Fetched ${(data || []).length} devices from Supabase, converting to signed URLs...`);

      // Convert relative storage paths to authenticated signed URLs (for private buckets)
      const devicesWithSignedUrls = await Promise.all(
        (data || []).map(async (device) => {
          console.log(`🔄 Converting URLs for device: ${device.name} (${device.id})`);
          console.log(`   📷 Original photo_irl: ${device.photo_irl}`);
          console.log(`   📄 Original invoice_url: ${device.invoice_url}`);

          const convertedDevice = {
            ...device,
            photo_irl: device.photo_irl ? await this.getSignedUrl(device.photo_irl, 'device-photos') : device.photo_irl,
            invoice_url: device.invoice_url ? await this.getSignedUrl(device.invoice_url, 'device-invoices') : device.invoice_url,
          };

          console.log(`   ✅ Converted photo_irl: ${convertedDevice.photo_irl?.substring(0, 80)}...`);
          console.log(`   ✅ Converted invoice_url: ${convertedDevice.invoice_url?.substring(0, 80)}...`);

          return convertedDevice;
        })
      );

      console.log(`✅ All URLs converted successfully, returning ${devicesWithSignedUrls.length} devices`);
      return devicesWithSignedUrls
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

  // Helper method to convert storage path to authenticated signed URL (for private buckets)
  private async getSignedUrl(path: string, bucket: 'device-photos' | 'device-invoices'): Promise<string> {
    console.log(`🔐 getSignedUrl called - Path: ${path}, Bucket: ${bucket}`);

    // If already a file:// URL (local), return as-is
    if (path.startsWith('file://')) {
      console.log(`🔐 Path is local file, returning as-is`);
      return path;
    }

    // If it's a full public URL, extract the path
    if (path.startsWith('http://') || path.startsWith('https://')) {
      console.log(`🔐 Path is a full URL, extracting path...`);
      // Extract path from URL like: https://.../storage/v1/object/public/bucket-name/userId/file.jpg
      const match = path.match(/\/storage\/v1\/object\/public\/[^\/]+\/(.+)$/);
      if (match && match[1]) {
        path = match[1]; // Extract "userId/file.jpg"
        console.log(`🔐 Extracted path: ${path}`);
      } else {
        console.warn(`⚠️ Could not extract path from URL: ${path}`);
        return path; // Return as-is if can't extract
      }
    }

    // For private buckets, create a signed URL with 1 hour expiry
    try {
      console.log(`🔐 Creating signed URL for: ${path}`);
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600); // 1 hour expiry

      if (error) {
        console.error(`❌ Error creating signed URL for ${bucket}:`, error);
        return path;
      }

      console.log(`✅ Signed URL created: ${data.signedUrl.substring(0, 80)}...`);
      return data.signedUrl;
    } catch (error) {
      console.error(`❌ Exception creating signed URL for ${bucket}:`, error);
      return path;
    }
  }
}

export const supabaseDataService = SupabaseDataService.getInstance()
