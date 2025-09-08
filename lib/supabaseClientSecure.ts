import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { createSecureStorageAdapter } from './secureStorage';
import { SUPABASE_CONFIG } from './config';

console.log('=== SECURE SUPABASE CLIENT INITIALIZATION ===');

// Create secure storage adapter
const secureStorage = createSecureStorageAdapter();

// Create new Supabase client with secure storage
export const supabaseSecure = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  {
    auth: {
      storage: Platform.OS !== 'web' ? secureStorage : undefined,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // AuthSession will handle URL detection
      flowType: 'pkce'
    },
  }
);

console.log('Secure Supabase client created successfully');
console.log('Auth methods available:', !!supabaseSecure.auth);
console.log('Storage adapter:', Platform.OS !== 'web' ? 'SecureStore' : 'localStorage');

// Test function for secure Supabase client
export const testSecureSupabaseClient = async () => {
  console.log('🧪 TESTING SECURE SUPABASE CLIENT 🧪');
  
  try {
    // Test basic client functionality
    console.log('Client URL:', SUPABASE_CONFIG.url);
    console.log('Client Key exists:', !!SUPABASE_CONFIG.anonKey);
    
    // Test auth methods availability
    console.log('Auth methods:', Object.keys(supabaseSecure.auth));
    console.log('getSession available:', !!supabaseSecure.auth.getSession);
    console.log('exchangeCodeForSession available:', !!supabaseSecure.auth.exchangeCodeForSession);
    
    // Test session retrieval (should be null initially)
    const { data: { session }, error } = await supabaseSecure.auth.getSession();
    console.log('Initial session test:', { hasSession: !!session, error: !!error });
    
    console.log('✅ Secure Supabase client test completed');
    
  } catch (error) {
    console.error('❌ Secure Supabase client test failed:', error);
  }
};

// AuthSession integration hook (not connected to UI yet)
export const useSecureSupabaseAuth = () => {
  console.log('=== SECURE SUPABASE AUTH HOOK ===');
  
  const handleAuthSuccess = async (code: string) => {
    console.log('📋 HANDLING AUTH SUCCESS 📋');
    console.log('OAuth code received, length:', code?.length);
    
    try {
      const { data, error } = await supabaseSecure.auth.exchangeCodeForSession(code);
      
      console.log('Code exchange result:', {
        hasSession: !!data?.session,
        hasUser: !!data?.session?.user,
        hasAccessToken: !!data?.session?.access_token,
        error: error?.message
      });
      
      if (error) {
        console.error('Code exchange error:', error);
        return { success: false, error };
      }
      
      if (data.session) {
        console.log('✅ Authentication successful:', {
          userId: data.session.user.id,
          email: data.session.user.email
        });
        return { success: true, session: data.session };
      }
      
      return { success: false, error: 'No session returned' };
      
    } catch (error) {
      console.error('Code exchange exception:', error);
      return { success: false, error };
    }
  };

  return { handleAuthSuccess };
};
