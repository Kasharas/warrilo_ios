import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG } from '../../lib/config'

const supabaseUrl = SUPABASE_CONFIG.url
const supabaseAnonKey = SUPABASE_CONFIG.anonKey

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type for our database
export type Database = {
  public: {
    Tables: {
      devices: {
        Row: {
          id: string
          user_id: string
          name: string
          brand_name: string | null
          category: string | null
          purchase_date: string | null
          purchase_price: number | null
          supplier: string | null
          warranty_months: number | null
          warranty_end_date: string | null
          photo_irl: string | null
          invoice_url: string | null
          identifiers: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          brand_name?: string | null
          category?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          supplier?: string | null
          warranty_months?: number | null
          warranty_end_date?: string | null
          photo_irl?: string | null
          invoice_url?: string | null
          identifiers?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      device_photos: {
        Row: {
          id: string
          device_id: string
          photo_url: string
          upload_order: number
          created_at: string
        }
        Insert: {
          id?: string
          device_id: string
          photo_url: string
          upload_order?: number
          created_at?: string
        }
      }
    }
  }
}
