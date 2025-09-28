import { createClient } from '@supabase/supabase-js';
import { Platform, Linking } from 'react-native';
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
      // Mobile: Use OAuth with deep linking (force-launch browser via Linking)
      console.log('Mobile: Using OAuth with deep linking...');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getOAuthRedirectUrl(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // Prevent supabase-js from trying to handle the browser
          // so we can open it explicitly with React Native Linking
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error('❌ Mobile OAuth error:', error);
        return { error: (error as any)?.message ?? String(error) };
      }

      const authUrl = (data as any)?.url;
      if (authUrl) {
        console.log('✅ Mobile OAuth initiated, opening browser URL:', authUrl);
        try {
          await Linking.openURL(authUrl);
        } catch (openErr) {
          console.error('❌ Failed to open auth URL via Linking:', openErr);
          return { error: 'Failed to open browser for Google sign-in' };
        }
        return { data: { url: authUrl }, error: null } as any;
      }

      console.error('❌ No auth URL returned from Supabase OAuth initiation');
      return { error: 'No auth URL returned from Supabase' };
    }
  } catch (error) {
    console.error('Google Sign-In exception:', error);
    return { error };
  }
};

export default supabase;
