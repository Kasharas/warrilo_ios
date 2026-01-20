import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { supabase, signInWithGoogle as supabaseSignInWithGoogle } from '../lib/supabaseClient';
import * as Linking from 'expo-linking';
import { DeviceLocalStorage } from '../src/lib/localStorage';
import { validateSupabaseSession } from '../src/lib/sessionValidator';
import { syncResetService } from '../src/services/syncResetService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  syncReady: boolean; // NEW: Indicates when sync can safely run
  lastSyncTime: Date | null; // NEW: Track sync status
  signIn: (email: string, password: string) => Promise<{ error: any; needsVerification?: boolean; needsGoogleAuth?: boolean }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: (options?: { redirectTo?: string }) => Promise<{ error: any }>;
  signInWithApple: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  resendVerification: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncReady, setSyncReady] = useState<boolean>(false); // NEW: Sync readiness state
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null); // NEW: Last sync timestamp
  const isInitialized = useRef(false);

  useEffect(() => {
    // Check if AuthContext initialization state persists incorrectly
    console.log('AUTH CONTEXT INIT:', {
      isInitialized: isInitialized.current,
      userExists: !!user,
      sessionExists: !!session
    });

    // Prevent multiple initializations
    if (isInitialized.current) {
      console.log('=== AUTH CONTEXT: Already initialized, skipping ===');
      return;
    }

    console.log('=== AUTH CONTEXT useEffect TRIGGERED ===');
    console.log('0a. useEffect dependency array changed');

    // Platform-specific URL logging (guard window access on native)
    const isWeb = Platform.OS === 'web';
    const currentHref = isWeb ? (typeof window !== 'undefined' ? (window.location?.href ?? 'N/A') : 'N/A') : 'N/A (mobile)';
    const currentSearch = isWeb ? (typeof window !== 'undefined' ? (window.location?.search ?? 'N/A') : 'N/A') : 'N/A (mobile)';
    console.log('0b. Current window.location.href:', currentHref);
    console.log('0c. Current window.location.search:', currentSearch);

    const getInitialSession = async () => {
      console.log('=== AUTH CONTEXT INITIALIZATION ===');
      console.log('1. Getting initial session...');

      try {
        // Regular session check
        console.log('4. Checking regular session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('DEBUG: Initial session check:', session?.user?.id || 'No session');
        console.log('DEBUG: Session access token exists:', !!session?.access_token);
        console.log('DEBUG: Full session:', session);

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // NEW: Validate session before marking sync as ready
        if (session?.user?.id) {
          console.log('Mobile auth: Regular session found, validating for sync readiness...', {
            userId: session.user.id,
            platform: 'mobile'
          });

          // Enable sync immediately - session validation is causing hangs
          console.log('Mobile auth: Enabling sync immediately after login', {
            userId: session.user.id,
            syncReady: true,
            platform: 'mobile'
          });
          setSyncReady(true);
        }

        console.log('5. Initial session set, user:', session?.user?.id || 'No user');
      } catch (error) {
        console.error('AuthContext: Error during regular session check:', error);
        setLoading(false);
      }
    };

    // Add a small delay to ensure URL is fully loaded
    setTimeout(() => {
      // Debug Supabase client state
      console.log('1a. Supabase client available:', !!supabase);
      console.log('1b. Supabase auth available:', !!supabase.auth);
      console.log('1c. Supabase auth methods:', Object.keys(supabase.auth || {}));
      console.log('1d. Supabase auth methods ready');

      getInitialSession();
    }, 100);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('=== AUTH STATE CHANGE ===');
        console.log('🔄 AUTH STATE CHANGE DETECTED 🔄');
        console.log('Event type:', event);
        console.log('Session exists:', !!session);
        console.log('User ID:', session?.user?.id || 'No user');
        console.log('User email:', session?.user?.email || 'No email');
        console.log('Access token exists:', !!session?.access_token);

        // Always update state for auth state changes
        console.log('Updating AuthContext state for event:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Update sync readiness based on auth state
        if (session?.user?.id) {
          console.log('Mobile auth: Auth state change - validating session for sync readiness...', {
            userId: session.user.id,
            platform: 'mobile'
          });
          // Enable sync immediately - session validation is causing hangs
          console.log('Mobile auth: Enabling sync immediately after auth state change', {
            userId: session.user.id,
            syncReady: true,
            platform: 'mobile'
          });
          setSyncReady(true);
        } else {
          setSyncReady(false);
          console.log('Mobile auth: Sync marked as not ready - no user session', {
            platform: 'mobile'
          });
        }

        // Handle user preferences creation
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('DEBUG: User signed in, deferring preferences creation for:', session.user.id);
          // Defer database call to avoid corrupting OAuth client state
          setTimeout(async () => {
            await createUserPreferencesIfNeeded(session.user.id);
          }, 2000);
        }

        if (event === 'TOKEN_REFRESHED') {
          console.log('DEBUG: Token refreshed for user:', session?.user?.id);
        }

        if (event === 'SIGNED_OUT') {
          console.log('DEBUG: User signed out');
          setSyncReady(false); // NEW: Reset sync readiness on sign out
          setLastSyncTime(null); // NEW: Clear last sync time on sign out
        }
      }
    );

    // Mark as initialized to prevent re-runs
    isInitialized.current = true;

    return () => subscription.unsubscribe();
  }, []);

  const createUserPreferencesIfNeeded = async (userId: string) => {
    try {
      const { data: existingPrefs } = await supabase
        .from('user_preferences')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      if (!existingPrefs) {
        await supabase.from('user_preferences').insert({
          user_id: userId,
          warranty_reminder_days: 30,
          email_reminders_enabled: true,
          warranty_display_format: 'days'
        });
      }
    } catch (error) {
      console.error('Error handling user preferences:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('=== SUPABASE SIGNIN DEBUG START ===');
    console.log('1. Calling supabase.auth.signInWithPassword with email:', email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('2. Supabase signIn response data:', data);
      console.log('3. Supabase signIn response error:', error);

      if (error) {
        // Use warn instead of error to avoid triggering dev-mode LogBox for expected auth failures
        console.warn('4. SignIn failed:', error.message);

        // Check for email verification errors
        if (error.message.toLowerCase().includes('email not confirmed') ||
          error.message.toLowerCase().includes('not verified') ||
          error.message.toLowerCase().includes('confirm your email')) {
          console.log('5. Email verification required');
          return { error: null, needsVerification: true };
        }

        // Return the actual error for all other cases
        return { error };
      } else {
        console.log('4. SignIn successful');
        return { error: null };
      }
    } catch (error) {
      console.error('5. Unexpected error during signIn:', error);
      return { error };
    } finally {
      console.log('=== SUPABASE SIGNIN DEBUG END ===');
    }
  };

  const signUp = async (email: string, password: string) => {
    console.log('=== SUPABASE SIGNUP DEBUG START ===');
    console.log('1. Calling supabase.auth.signUp with email:', email);
    console.log('1a. AUTH CONTEXT VERSION: Enhanced with detailed logging');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log('2. Supabase signUp response data:', data);
      console.log('3. Supabase signUp response error:', error);

      if (error) {
        console.error('4. SignUp failed with error:', error.message);
        return { error };
      } else {
        console.log('4. SignUp successful');
        console.log('5. User created:', data.user ? 'Yes' : 'No');
        console.log('6. User ID:', data.user?.id || 'No ID');
        console.log('7. User email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
        console.log('8. Session created:', data.session ? 'Yes' : 'No');
        console.log('9. Confirmation email sent:', data.user?.email_confirmed_at ? 'No (already confirmed)' : 'Yes (pending confirmation)');
        return { error: null };
      }
    } catch (error) {
      console.error('5. Unexpected error during signUp:', error);
      return { error };
    } finally {
      console.log('=== SUPABASE SIGNUP DEBUG END ===');
    }
  };

  const signInWithGoogle = async (options?: { redirectTo?: string }) => {
    try {
      const { result, error } = await supabaseSignInWithGoogle();

      if (error) return { error };

      if (result?.type === 'success' && result.url) {
        console.log('🔄 AuthContext: OAuth success, processing URL...');

        // Parse the URL to get the code
        const parsed = Linking.parse(result.url);
        const code = parsed.queryParams?.code as string;

        if (code) {
          console.log('🔑 AuthContext: Exchanging code for session...');
          const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

          if (sessionError) {
            console.error('❌ AuthContext: Exchange error:', sessionError.message);
            return { error: sessionError };
          }

          if (data.session) {
            console.log('✅ AuthContext: Session exchanged successfully');
            setSession(data.session);
            setUser(data.session.user);
          }
        } else {
          console.warn('⚠️ AuthContext: No code found in redirect URL');
        }
      }

      return { error: null };
    } catch (e: any) {
      console.error('❌ AuthContext: Google Sign-In Error:', e.message);
      return { error: e };
    }
  };

  const signInWithApple = async () => {
    console.log('=== APPLE SIGNIN DEBUG START ===');
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign-In is only supported on iOS');
      }

      const { signInAsync, AppleAuthenticationScope } = await import('expo-apple-authentication');
      const Crypto = await import('expo-crypto');

      // Generate a random nonce
      const rawNonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // Use the algorithm directly as a string to avoid enum import issues
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      console.log('1. Generated nonce:', { rawNonce, hashedNonce });

      const credential = await signInAsync({
        requestedScopes: [
          AppleAuthenticationScope.FULL_NAME,
          AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      console.log('2. Apple credential received');
      console.log('   Identity Token length:', credential.identityToken?.length);
      console.log('   Auth Code length:', credential.authorizationCode?.length);

      if (!credential.identityToken) {
        throw new Error('No identity token provided by Apple');
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce, // Supabase expects the RAW nonce, not the hashed one
      });

      console.log('3. Supabase signInWithIdToken result:', error ? 'Error' : 'Success');

      if (error) {
        console.error('!!! SUPABASE ERROR DETAILS !!!');
        console.error(JSON.stringify(error, null, 2));
        return { error };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }

      return { error: null };
    } catch (error: any) {
      console.error('Apple Sign-In Error:', error);
      console.error('Full Error Object:', JSON.stringify(error, null, 2));
      return { error };
    } finally {
      console.log('=== APPLE SIGNIN DEBUG END ===');
    }
  };

  const resetPassword = async (email: string) => {
    console.log('=== PASSWORD RESET DEBUG START ===');
    console.log('1. Password reset requested for email:', email);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'com.warrilo.mobile://reset-password',
      });

      if (error) {
        console.error('2. Password reset error:', error.message);
        return { error };
      } else {
        console.log('2. Password reset email sent successfully');
        return { error: null };
      }
    } catch (error) {
      console.error('3. Unexpected error during password reset:', error);
      return { error };
    } finally {
      console.log('=== PASSWORD RESET DEBUG END ===');
    }
  };

  const resendVerification = async (email: string) => {
    console.log('=== RESEND VERIFICATION DEBUG START ===');
    console.log('1. Resend verification requested for email:', email);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        console.error('2. Resend verification error:', error.message);
        return { error };
      } else {
        console.log('2. Verification email resent successfully');
        return { error: null };
      }
    } catch (error) {
      console.error('3. Unexpected error during resend verification:', error);
      return { error };
    } finally {
      console.log('=== RESEND VERIFICATION DEBUG END ===');
    }
  };

  const signOut = async () => {
    console.log('🔄 AuthContext: Starting robust sign out process...');

    try {
      // 1. Manually clear state immediately for instant UI feedback
      console.log('🧹 AuthContext: Manually clearing user state...');
      setUser(null);
      setSession(null);
      setSyncReady(false);
      setLastSyncTime(null);

      // 2. Perform cleanup tasks in parallel (non-blocking if possible)
      console.log('🗑️ AuthContext: Triggering secondary cleanup...');

      // We wrap these in their own try/catch to ensure one failure doesn't stop others
      Promise.allSettled([
        DeviceLocalStorage.clearAll().catch(e => console.warn('LocalStorage clear failed:', e)),
        Promise.resolve(syncResetService.resetAllSyncStates())
      ]);

      // 3. Finally, tell Supabase to sign out
      console.log('🔐 AuthContext: Calling Supabase signOut...');
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.warn('⚠️ AuthContext: Supabase reported sign out error (ignoring):', error.message);
      } else {
        console.log('✅ AuthContext: Supabase sign out successful');
      }

    } catch (error) {
      console.error('❌ AuthContext: Critical error during sign out:', error);
      // Even on critical error, ensure we at least clear the local state
      setUser(null);
      setSession(null);
    }
  };

  const value = {
    user,
    session,
    loading,
    syncReady, // NEW: Include sync readiness in context
    lastSyncTime, // NEW: Include last sync time in context
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    resetPassword,
    resendVerification,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
