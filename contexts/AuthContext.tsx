import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { supabase, signInWithGoogle as supabaseSignInWithGoogle } from '../lib/supabaseClient';
import { DeviceLocalStorage } from '../src/lib/localStorage';
import { validateSupabaseSession } from '../src/lib/sessionValidator';

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
    
    // Platform-specific URL logging
    const isWeb = typeof window !== 'undefined';
    console.log('0b. Current window.location.href:', isWeb ? window.location.href : 'N/A (mobile)');
    console.log('0c. Current window.location.search:', isWeb ? window.location.search : 'N/A (mobile)');
    
    const getInitialSession = async () => {
      console.log('=== AUTH CONTEXT INITIALIZATION ===');
      console.log('1. Getting initial session...');
      
              // Handle OAuth callback first - now delegated to dedicated screen
        const handleAuthCallback = async () => {
          try {
            // OAuth processing is now handled by auth-callback.tsx
            console.log('AuthContext: OAuth processing delegated to auth-callback.tsx');

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

              try {
                const sessionValidation = await validateSupabaseSession();

                if (sessionValidation.isValid) {
                  console.log('Mobile auth: Session validated successfully - enabling sync', {
                    userId: session.user.id,
                    syncReady: true,
                    platform: 'mobile'
                  });
                  setSyncReady(true);
                } else {
                  console.error('Mobile auth: Session validation failed for regular session:', {
                    error: sessionValidation.error,
                    userId: session.user.id,
                    syncReady: false,
                    platform: 'mobile'
                  });
                  setSyncReady(false);
                }
              } catch (validationError) {
                console.error('Mobile auth: Session validation exception for regular session:', {
                  error: validationError instanceof Error ? validationError.message : 'Unknown error',
                  userId: session.user.id,
                  platform: 'mobile'
                });
                setSyncReady(false);
              }
            }

            console.log('5. Initial session set, user:', session?.user?.id || 'No user');
          } catch (error) {
            console.error('AuthContext: Error during regular session check:', error);
          }
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
        console.log('🔄 AUTH STATE CHANGE DETECTED 🔄');
        // Only update state if there's an actual change
        const currentUserId = user?.id;
        const newUserId = session?.user?.id;
        console.log('Event type:', event);
        console.log('Previous user ID:', currentUserId);
        console.log('New user ID:', newUserId);
        console.log('State will update:', currentUserId !== newUserId || event === 'SIGNED_OUT');
        console.log('DEBUG: Auth state changed:', event);
        console.log('DEBUG: New session user ID:', session?.user?.id || 'No user');
        console.log('DEBUG: New session access token exists:', !!session?.access_token);
        console.log('DEBUG: Full new session:', session);
        console.log('DEBUG: Event type:', event);
        
        if (currentUserId !== newUserId || event === 'SIGNED_OUT') {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);

          // NEW: Update sync readiness based on auth state with session validation
          if (session?.user?.id) {
            console.log('Mobile auth: Auth state change - validating session for sync readiness...', {
              userId: session.user.id,
              platform: 'mobile'
            });
            
            try {
              const sessionValidation = await validateSupabaseSession();
              
              if (sessionValidation.isValid) {
                console.log('Mobile auth: Session validated successfully - enabling sync', {
                  userId: session.user.id,
                  syncReady: true,
                  platform: 'mobile'
                });
                setSyncReady(true);
              } else {
                console.error('Mobile auth: Session validation failed in auth state change:', {
                  error: sessionValidation.error,
                  userId: session.user.id,
                  syncReady: false,
                  platform: 'mobile'
                });
                setSyncReady(false);
              }
            } catch (validationError) {
              console.error('Mobile auth: Session validation exception in auth state change:', {
                error: validationError instanceof Error ? validationError.message : 'Unknown error',
                userId: session.user.id,
                platform: 'mobile'
              });
              setSyncReady(false);
            }
          } else {
            setSyncReady(false);
            console.log('Mobile auth: Sync marked as not ready - no user session', {
              platform: 'mobile'
            });
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
