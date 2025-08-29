import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, signInWithGoogle as supabaseSignInWithGoogle } from '../lib/supabaseClient';
import { DeviceLocalStorage } from '../src/lib/localStorage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  syncReady: boolean; // NEW: Indicates when sync can safely run
  lastSyncTime: Date | null; // NEW: Track sync status
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: (options?: { redirectTo?: string }) => Promise<{ error: any }>;
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
    // Prevent multiple initializations
    if (isInitialized.current) {
      console.log('=== AUTH CONTEXT: Already initialized, skipping ===');
      return;
    }
    
    console.log('=== AUTH CONTEXT useEffect TRIGGERED ===');
    console.log('0a. useEffect dependency array changed');
    console.log('0b. Current window.location.href:', window.location.href);
    console.log('0c. Current window.location.search:', window.location.search);
    
    const getInitialSession = async () => {
      console.log('=== AUTH CONTEXT INITIALIZATION ===');
      console.log('1. Getting initial session...');
      
      // Handle OAuth callback first - this is crucial!
      const handleAuthCallback = async () => {
        try {
          console.log('2a. Checking for OAuth callback in URL...');
          console.log('2b. Current URL:', window.location.href);
          console.log('2c. URL Hash:', window.location.hash);
          console.log('2d. URL Search:', window.location.search);
          
          // Check if we have OAuth tokens in URL hash
          if (window.location.hash && window.location.hash.includes('access_token')) {
            console.log('3a. OAuth callback detected in URL hash');
            const { data, error } = await supabase.auth.getSessionFromUrl();
            if (error) {
              console.error('3b. OAuth callback error:', error);
            }
                    if (data.session) {
          console.log('3c. OAuth session established:', data.session.user.id);
          setSession(data.session);
          setUser(data.session.user);
          setLoading(false);
          setSyncReady(true); // NEW: Mark sync as ready after OAuth success
          return;
        }
          }
          
          // NEW: Also check for OAuth code in query parameters
          console.log('2e. Checking query parameters...');
          console.log('2f. Raw search string:', window.location.search);
          console.log('2g. Search string length:', window.location.search.length);
          console.log('2h. Search string type:', typeof window.location.search);
          
          const urlParams = new URLSearchParams(window.location.search);
          console.log('2i. URLSearchParams created');
          console.log('2j. All URL params:', Object.fromEntries(urlParams.entries()));
          
          const code = urlParams.get('code');
          console.log('2k. Code parameter value:', code);
          
          if (code) {
            console.log('3d. OAuth code detected in query parameters:', code);
            
            try {
              console.log('3e. Attempting to process OAuth code with Supabase...');
              
              // Method 1: Try exchangeCodeForSession (modern Supabase method)
              if (supabase.auth.exchangeCodeForSession) {
                console.log('3f. Method 1: exchangeCodeForSession');
                const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                console.log('3g. Method 1 result:', { data, error });
                
                if (data?.session) {
                  console.log('3h. Method 1 successful - OAuth session established:', data.session.user.id);
                  setSession(data.session);
                  setUser(data.session.user);
                  setLoading(false);
                  setSyncReady(true); // NEW: Mark sync as ready after OAuth success
                  
                  // Clean up URL by removing the code parameter
                  window.history.replaceState({}, '', window.location.origin);
                  return;
                }
              } else {
                console.log('3f. exchangeCodeForSession method not available');
              }
              
              // Method 2: Try to refresh session (fallback)
              console.log('3i. Method 2: refreshSession fallback');
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              console.log('3j. Method 2 result:', { data: refreshData, error: refreshError });
              
              if (refreshData?.session) {
                console.log('3k. Method 2 successful - Session refreshed:', refreshData.session.user.id);
                setSession(refreshData.session);
                setUser(refreshData.session.user);
                setLoading(false);
                setSyncReady(true); // NEW: Mark sync as ready after OAuth success
                
                // Clean up URL by removing the code parameter
                window.history.replaceState({}, '', window.location.origin);
                return;
              }
              
              // Method 3: Manual OAuth processing via direct API call
              console.log('3l. Method 3: Manual OAuth processing via API');
              try {
                const response = await fetch(`${supabase.supabaseUrl}/auth/v1/token?grant_type=authorization_code&code=${code}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabase.supabaseKey
                  }
                });
                
                const tokenData = await response.json();
                console.log('3m. Manual API response:', tokenData);
                
                if (tokenData.access_token) {
                  console.log('3n. Manual API successful, setting session...');
                  
                  // Set the session manually
                  const { data: manualData, error: manualError } = await supabase.auth.setSession({
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token
                  });
                  
                  console.log('3o. Manual session set result:', { data: manualData, error: manualError });
                  
                  if (manualData?.session) {
                                      console.log('3p. Manual method successful - OAuth session established:', manualData.session.user.id);
                  setSession(manualData.session);
                  setUser(manualData.session.user);
                  setLoading(false);
                  setSyncReady(true); // NEW: Mark sync as ready after OAuth success
                  
                  // Clean up URL by removing the code parameter
                  window.history.replaceState({}, '', window.location.origin);
                  return;
                  }
                }
              } catch (apiError) {
                console.error('3q. Manual API method failed:', apiError);
              }
              
              console.log('3r. All OAuth processing methods failed');
              
            } catch (error) {
              console.error('3s. Error during OAuth processing:', error);
            }
          } else {
            console.log('3d. No OAuth code found in query parameters');
          }
        } catch (error) {
          console.error('3g. Error handling OAuth callback:', error);
        }
        
        // Regular session check if no OAuth callback
        console.log('4. No OAuth callback, checking regular session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('DEBUG: Initial session check:', session?.user?.id || 'No session');
        console.log('DEBUG: Session access token exists:', !!session?.access_token);
        console.log('DEBUG: Full session:', session);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // NEW: Mark sync as ready if we have a valid session
        if (session?.user?.id) {
          setSyncReady(true);
          console.log('5a. Sync marked as ready for user:', session.user.id);
        }
        
        console.log('5. Initial session set, user:', session?.user?.id || 'No user');
      };

      // Add a small delay to ensure URL is fully loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Debug Supabase client state
      console.log('1a. Supabase client available:', !!supabase);
      console.log('1b. Supabase auth available:', !!supabase.auth);
      console.log('1c. Supabase auth methods:', Object.keys(supabase.auth || {}));
      console.log('1d. exchangeCodeForSession available:', !!supabase.auth?.exchangeCodeForSession);
      
      await handleAuthCallback();
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('=== AUTH STATE CHANGE ===');
        console.log('DEBUG: Auth state changed:', event);
        console.log('DEBUG: New session user ID:', session?.user?.id || 'No user');
        console.log('DEBUG: New session access token exists:', !!session?.access_token);
        console.log('DEBUG: Full new session:', session);
        console.log('DEBUG: Event type:', event);
        
        // Only update state if there's an actual change
        const currentUserId = user?.id;
        const newUserId = session?.user?.id;
        
        if (currentUserId !== newUserId || event === 'SIGNED_OUT') {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);

          // NEW: Update sync readiness based on auth state
          if (session?.user?.id) {
            setSyncReady(true);
            console.log('DEBUG: Sync marked as ready for user:', session.user.id);
          } else {
            setSyncReady(false);
            console.log('DEBUG: Sync marked as not ready - no user session');
          }
        } else {
          console.log('DEBUG: No user change detected, skipping state update');
        }

        // Handle user preferences creation
        if (event === 'SIGNED_IN' && session?.user && !loading) {
          console.log('DEBUG: User signed in, creating preferences for:', session.user.id);
          await createUserPreferencesIfNeeded(session.user.id);
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async (options?: { redirectTo?: string }) => {
    const { error } = await supabaseSignInWithGoogle(options);
    return { error };
  };

  const signOut = async () => {
    try {
      console.log('🔄 AuthContext: Starting sign out process...');
      console.log('🔄 AuthContext: Current user ID:', user?.id);
      console.log('🔄 AuthContext: Current session exists:', !!session);
      
      // Clear all local storage data first
      console.log('🗑️ AuthContext: Clearing local storage data...');
      try {
        await DeviceLocalStorage.clearAll();
        console.log('✅ AuthContext: Local storage cleared successfully');
      } catch (storageError) {
        console.warn('⚠️ AuthContext: Local storage clear warning:', storageError);
        // Continue with sign out even if storage clear fails
      }
      
      // Sign out from Supabase
      console.log('🔐 AuthContext: Signing out from Supabase...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ AuthContext: Supabase sign out error:', error);
        throw error;
      }
      
      console.log('✅ AuthContext: Supabase sign out completed successfully');
      
      // Reset local state
      console.log('🔄 AuthContext: Resetting local state...');
      setUser(null);
      setSession(null);
      setSyncReady(false);
      setLastSyncTime(null);
      
      console.log('✅ AuthContext: Sign out completed successfully - user state reset');
      console.log('✅ AuthContext: User is now:', user);
      console.log('✅ AuthContext: Session is now:', session);
      
    } catch (error) {
      console.error('❌ AuthContext: Error during sign out:', error);
      // Even if there's an error, try to reset the user state
      console.log('🔄 AuthContext: Attempting to reset state despite error...');
      setUser(null);
      setSession(null);
      setSyncReady(false);
      setLastSyncTime(null);
      throw error;
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
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
