import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';
import { supabaseSecure } from './supabaseClientSecure';

// Required for AuthSession - must be called at module level
WebBrowser.maybeCompleteAuthSession();

export const useSupabaseOAuth = () => {
  console.log('=== SUPABASE OAUTH HOOK INITIALIZATION ===');
  console.log('Platform:', Platform.OS);
  
  const redirectUri = makeRedirectUri({
    scheme: 'com.warrilo.mobile',
    path: 'auth-callback'
  });
  
  console.log('Generated redirect URI:', redirectUri);

  const startSupabaseOAuth = async () => {
    console.log('🚀 STARTING SUPABASE OAUTH FLOW 🚀');
    
    try {
      // Use Supabase's OAuth method - this is the correct approach
      const { data, error } = await supabaseSecure.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Supabase OAuth initiation error:', error);
        return { success: false, error };
      }

      if (data?.url) {
        console.log('✅ Supabase OAuth URL generated:', data.url);
        console.log('🔗 Opening Supabase OAuth URL...');
        
        // Open the Supabase-generated OAuth URL
        const result = await WebBrowser.openBrowserAsync(data.url);
        console.log('Browser result:', result);
        
        // Add timeout logging
        console.log('⏱️ OAuth browser opened, waiting for deep link callback...');
        console.log('⏱️ If no callback received in 60 seconds, there may be a deep link issue');
        
        return { success: true, result };
      }

      return { success: false, error: 'No OAuth URL generated' };
    } catch (error) {
      console.error('Supabase OAuth exception:', error);
      return { success: false, error };
    }
  };

  return { startSupabaseOAuth, redirectUri };
};

// Test function to validate Supabase OAuth setup
export const testAuthSessionSetup = () => {
  console.log('🧪 TESTING SUPABASE OAUTH SETUP 🧪');
  console.log('WebBrowser available:', !!WebBrowser);
  console.log('makeRedirectUri available:', !!makeRedirectUri);
  console.log('useSupabaseOAuth available:', !!useSupabaseOAuth);
  console.log('supabaseSecure available:', !!supabaseSecure);
  
  const testRedirectUri = makeRedirectUri({
    scheme: 'com.warrilo.mobile',
    path: 'auth-callback'
  });
  console.log('Test redirect URI generation:', testRedirectUri);
  console.log('✅ Using app → Supabase → Google → Supabase → app flow');
};
