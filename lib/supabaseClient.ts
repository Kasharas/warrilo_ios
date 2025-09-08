import { createClient } from '@supabase/supabase-js';
import { Linking, Platform } from 'react-native';
import * as ExpoLinking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { SUPABASE_CONFIG } from './config';

console.log('=== SUPABASE CLIENT INITIALIZATION ===');
console.log('1. Supabase URL:', SUPABASE_CONFIG.url);
console.log('2. Supabase Anon Key exists:', !!SUPABASE_CONFIG.anonKey);

const supabaseUrl = SUPABASE_CONFIG.url;
const supabaseAnonKey = SUPABASE_CONFIG.anonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
});

console.log('3. Supabase client created successfully');
console.log('4. Supabase auth methods available:', !!supabase.auth);
console.log('5. Supabase OAuth method available:', !!supabase.auth.signInWithOAuth);

export const signInWithGoogle = async (options?: { redirectTo?: string }) => {
  // Platform-specific redirect URLs
  const getDefaultRedirectUrl = () => {
    if (Platform.OS === 'web') {
      return 'http://localhost:8081/auth-callback';
    } else {
      // Use distinct scheme to avoid domain fallback (com.warrilo.mobile vs warrilo.com)
      const deepLink = 'com.warrilo.mobile://auth-callback';
      console.log('Generated deep link:', deepLink);
      return deepLink;
    }
  };
  
  const redirectUrl = options?.redirectTo || getDefaultRedirectUrl();
  
  console.log('=== GOOGLE OAUTH FUNCTION CALLED ===');
  console.log('6. Platform detected:', Platform.OS);
  console.log('6a. Using redirect URL:', redirectUrl);
  console.log('6b. Is HTTP URL being used?', redirectUrl.startsWith('http://'));
  console.log('6c. Platform-specific redirect:', Platform.OS === 'web' ? 'WEB (http://192.168.1.8:8081)' : 'MOBILE (com.warrilo.mobile://auth-callback)');
  console.log('6. Calling supabase.auth.signInWithOAuth...');
  
  try {
    // Start OAuth and get provider URL
    const oauthStart = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        skipBrowserRedirect: Platform.OS !== 'web'
      }
    });

    console.log('7. OAuth start result:', oauthStart);
    if (oauthStart.error) return { error: oauthStart.error };

    if (!oauthStart.data?.url) {
      console.log('No OAuth URL returned');
      return oauthStart;
    }

    const authUrl = String(oauthStart.data.url);

    if (Platform.OS === 'web') {
      // Web redirect
      setTimeout(() => {
        try {
          (window.location as any).href = authUrl;
        } catch {}
      }, 50);
      return { error: null };
    }

    // Native: Use Expo AuthSession for better deep link handling
    console.log('Using Expo AuthSession instead of WebBrowser');

    try {
      // Open browser and wait for callback via deep link
      await Linking.openURL(authUrl);
      console.log('Browser opened, waiting for deep link callback...');

      // Return immediately - the auth-callback route will handle the code exchange
      return { error: null };
    } catch (error) {
      console.error('Failed to open OAuth URL:', error);
      return { error } as any;
    }
  } catch (error) {
    console.error('15. OAuth error:', error);
    throw error;
  }
};

export default supabase;
