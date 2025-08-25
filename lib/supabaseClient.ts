import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './config';

const supabaseUrl = SUPABASE_CONFIG.url;
const supabaseAnonKey = SUPABASE_CONFIG.anonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
