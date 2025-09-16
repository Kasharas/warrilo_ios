import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_CONFIG } from './config';
import { getOAuthRedirectUrl } from './urlConfig';

console.log('=== SUPABASE CLIENT INITIALIZATION ===');
console.log('1. Supabase URL:', SUPABASE_CONFIG.url);
console.log('2. Supabase Anon Key exists:', !!SUPABASE_CONFIG.anonKey);

const supabaseUrl = SUPABASE_CONFIG.url;
const supabaseAnonKey = SUPABASE_CONFIG.anonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce'
  },
});

console.log('3. Supabase client created successfully');
console.log('4. Supabase auth methods available:', !!supabase.auth);
console.log('5. Supabase OAuth method available:', !!supabase.auth.signInWithOAuth);

export const signInWithGoogle = async () => {
  console.log('=== GOOGLE SIGN-IN WITH REACT NATIVE GOOGLE SIGNIN ===');
  console.log('Platform detected:', Platform.OS);
  
  try {
    if (Platform.OS === 'web') {
      // Web: Use Supabase's built-in OAuth flow
      const redirectUrl = getOAuthRedirectUrl();
      console.log('Web OAuth: Using built-in flow with redirect:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false
        }
      });

      if (error) {
        console.error('Web OAuth error:', error);
        return { error };
      }

      console.log('Web OAuth initiated successfully');
      return { error: null };
    } else {
      // Mobile: Use OAuth with deep linking
      console.log('Mobile: Using OAuth with deep linking...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getOAuthRedirectUrl(), // Deep link to your app
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false
        }
      });
      
      if (error) {
        console.error('❌ Mobile OAuth error:', error);
        return { error: error.message };
      }
      
      console.log('✅ Mobile OAuth initiated');
      return { data, error: null };
    }
  } catch (error) {
    console.error('Google Sign-In exception:', error);
    return { error };
  }
};

export default supabase;
