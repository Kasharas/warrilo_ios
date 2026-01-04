import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import 'react-native-url-polyfill/auto';
import { LargeSecureStore } from './LargeSecureStore';
import { SUPABASE_CONFIG } from './config';

// Use constants from config.ts as process.env might be unreliable in this environment
const supabaseUrl = SUPABASE_CONFIG.url;
const supabaseAnonKey = SUPABASE_CONFIG.anonKey;

WebBrowser.maybeCompleteAuthSession();

// Initialize Supabase client with proper auth configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: LargeSecureStore,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // CRITICAL: Enables automatic OAuth callback handling
    flowType: 'pkce', // Explicitly set PKCE flow
  },
});

// Configure app state listeners for session management
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

// Google Sign-In Function - Simplified
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'warrilo://auth-callback',
        skipBrowserRedirect: true,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) throw error;

    if (!data?.url) {
      throw new Error('No authorization URL returned from Supabase');
    }

    console.log('📱 Opening OAuth URL:', data.url);

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      'warrilo://auth-callback'
    );

    console.log('🔄 Browser session result:', result.type);
    if (result.type === 'success' && result.url) {
      console.log('🔗 Redirect URL received:', result.url.substring(0, 50) + '...');
    }

    if (result.type !== 'success') {
      throw new Error(`OAuth flow ${result.type}`);
    }

    return { result, error: null };
  } catch (error) {
    console.error('❌ Google Sign-In Error:', error);
    throw error;
  }
};

export default supabase;
