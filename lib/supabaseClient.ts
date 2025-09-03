import { createClient } from '@supabase/supabase-js';
import { Linking, Platform } from 'react-native';
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
      return 'http://localhost:8081';
    } else {
      // Mobile platforms (iOS/Android) - use custom deep link scheme
      return 'warrilo://auth-callback';
    }
  };
  
  const redirectUrl = options?.redirectTo || getDefaultRedirectUrl();
  
  console.log('=== GOOGLE OAUTH FUNCTION CALLED ===');
  console.log('6. Platform detected:', Platform.OS);
  console.log('6a. Using redirect URL:', redirectUrl);
  console.log('6b. Is HTTP URL being used?', redirectUrl.startsWith('http://'));
  console.log('6c. Platform-specific redirect:', Platform.OS === 'web' ? 'WEB (http://localhost:8081)' : 'MOBILE (warrilo://auth-callback)');
  console.log('6. Calling supabase.auth.signInWithOAuth...');
  
  try {
    // Test the OAuth configuration first
    console.log('6a. Testing OAuth configuration...');
    const testResult = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    
    console.log('7. OAuth result:', testResult);
    console.log('8. OAuth data:', testResult.data);
    console.log('9. OAuth error:', testResult.error);
    
    if (testResult.error) {
      console.error('10. OAuth returned error:', testResult.error);
      return { error: testResult.error };
    }
    
    if (testResult.data?.url) {
      console.log('11. OAuth URL generated:', testResult.data.url);
      console.log('12. About to redirect to OAuth URL...');
      
      // For web, we need to redirect to the OAuth URL
      // Use setTimeout to ensure console logs are visible
      setTimeout(() => {
        console.log('13. Redirecting to:', testResult.data.url);
        console.log('14. After OAuth, user will be redirected to:', redirectUrl);
        
        // Platform-specific redirect
        try {
          // Try to set location.href (works on web)
          window.location.href = testResult.data.url;
        } catch (error) {
          // Mobile platform - use Linking with error handling
          try {
            console.log('Using Linking.openURL for mobile redirect');
            Linking.openURL(testResult.data.url);
          } catch (linkingError) {
            console.error('Failed to open URL with Linking:', linkingError);
            console.log('OAuth URL (fallback):', testResult.data.url);
          }
        }
      }, 100);
      
      return { error: null };
    }
    
    console.log('14. No OAuth URL generated, result:', testResult);
    return testResult;
  } catch (error) {
    console.error('15. OAuth error:', error);
    throw error;
  }
};

export default supabase;
