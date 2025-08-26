import { createClient } from '@supabase/supabase-js';
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
  const redirectUrl = options?.redirectTo || 'http://localhost:8081';
  
  console.log('=== GOOGLE OAUTH FUNCTION CALLED ===');
  console.log('6. Calling supabase.auth.signInWithOAuth...');
  console.log('6b. Redirect URL will be:', redirectUrl);
  
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
        window.location.href = testResult.data.url;
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
