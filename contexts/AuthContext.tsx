import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { signInWithGoogle as supabaseSignInWithGoogle } from '../warrilo_app/lib/supabase';
import { supabase } from '../warrilo_app/lib/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
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
  const [loading, setLoading] = useState(true);
  const isInitializedRef = useRef(false);
  const authSubscriptionRef = useRef<any>(null);
  const oauthProcessedRef = useRef(false);

  // Explicit OAuth callback detection and processing
  const processOAuthCallback = async () => {
    if (typeof window === 'undefined' || oauthProcessedRef.current) return;
    
    try {
      const hash = window.location.hash;
      const searchParams = window.location.search;
      
      // Check both hash and search params for OAuth tokens
      const hasOAuthTokens = (hash && (hash.includes('access_token') || hash.includes('refresh_token'))) ||
                            (searchParams && (searchParams.includes('access_token') || searchParams.includes('refresh_token')));
      
      if (hasOAuthTokens) {
        console.log('🔐 OAuth callback detected, processing tokens...');
        console.log('📍 URL hash:', hash);
        console.log('📍 URL search params:', searchParams);
        oauthProcessedRef.current = true;
        
        // Wait for Supabase to process tokens automatically
        console.log('⏳ Waiting for Supabase to process OAuth tokens...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if session was established
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('✅ OAuth session established successfully:', session.user.id);
          setUser(session.user);
          setLoading(false);
        } else {
          console.log('⚠️ OAuth session not established, checking again...');
          // Force a refresh to trigger auth state change
          await supabase.auth.refreshSession();
          
          // Check again after refresh
          const { data: { session: refreshedSession } } = await supabase.auth.getSession();
          if (refreshedSession?.user) {
            console.log('✅ OAuth session established after refresh:', refreshedSession.user.id);
            setUser(refreshedSession.user);
            setLoading(false);
          } else {
            console.log('❌ OAuth session still not established after refresh');
          }
        }
        
        // Clear URL parameters to prevent repeated processing
        if (hash) {
          window.location.hash = '';
          console.log('🧹 URL hash cleared');
        }
        if (searchParams) {
          window.history.replaceState({}, document.title, window.location.pathname);
          console.log('🧹 URL search params cleared');
        }
      } else {
        console.log('ℹ️ No OAuth tokens detected in URL');
      }
    } catch (error) {
      console.error('❌ Error processing OAuth callback:', error);
      oauthProcessedRef.current = false;
    }
  };

  // Initialize authentication state
  const initializeAuth = async () => {
    if (isInitializedRef.current) {
      console.log('🔄 AuthContext already initialized, skipping...');
      return;
    }
    
    console.log('🚀 AuthContext: Initializing authentication...');
    isInitializedRef.current = true;
    
    // Add timeout protection to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('⏰ Auth initialization timeout reached, forcing loading to false');
      setLoading(false);
    }, 10000); // 10 second timeout
    
    try {
      // Step 1: Check for OAuth callback first
      await processOAuthCallback();
      
      // Step 2: Check current session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('✅ Existing session found:', session.user.id);
        setUser(session.user);
      } else {
        console.log('ℹ️ No existing session found');
      }
      
      // Step 3: Set up auth state change listener
      if (!authSubscriptionRef.current) {
        console.log('👂 Setting up auth state change listener...');
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔄 Auth state change:', event, session?.user?.id || 'no user');
            
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('✅ User signed in:', session.user.id);
              setUser(session.user);
              
              // Create user preferences if needed
              try {
                const { data: existingPrefs, error: checkError } = await supabase
                  .from('user_preferences')
                  .select('user_id')
                  .eq('user_id', session.user.id)
                  .single();
                
                if (checkError && checkError.code === 'PGRST116') {
                  console.log('📝 Creating default user preferences...');
                  const { error: insertError } = await supabase
                    .from('user_preferences')
                    .insert({
                      user_id: session.user.id,
                      warranty_reminder_days: 30,
                      email_reminders_enabled: true,
                      warranty_display_format: 'days'
                    });
                  
                  if (insertError) {
                    console.error('❌ Error creating user preferences:', insertError);
                  } else {
                    console.log('✅ User preferences created successfully');
                  }
                }
              } catch (error) {
                console.error('❌ Error handling user preferences:', error);
              }
            } else if (event === 'SIGNED_OUT') {
              console.log('👋 User signed out');
              setUser(null);
              oauthProcessedRef.current = false; // Reset for next login
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
              console.log('🔄 Token refreshed:', session.user.id);
              setUser(session.user);
            }
            
            setLoading(false);
          }
        );
        
        authSubscriptionRef.current = subscription;
      }
      
    } catch (error) {
      console.error('❌ Error initializing authentication:', error);
    } finally {
      clearTimeout(timeoutId); // Clear timeout
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🏗️ AuthProvider mounting...');
    
    initializeAuth();
    
    return () => {
      console.log('🧹 AuthProvider unmounting, cleaning up...');
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe();
        authSubscriptionRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, []);

  // Manual authentication methods
  const signIn = async (email: string, password: string) => {
    console.log('🔐 Manual sign in attempt for:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Manual sign in error:', error);
        return { error };
      }
      
      console.log('✅ Manual sign in successful:', data.user?.id);
      return { error: null };
    } catch (error: any) {
      console.error('❌ Manual sign in exception:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    console.log('📝 Manual sign up attempt for:', email);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Manual sign up error:', error);
        return { error };
      }
      
      console.log('✅ Manual sign up successful:', data.user?.id);
      return { error: null };
    } catch (error: any) {
      console.error('❌ Manual sign up exception:', error);
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    console.log('🔐 Google OAuth sign in attempt...');
    try {
      const { data, error } = await supabaseSignInWithGoogle();
      
      if (error) {
        console.error('❌ Google OAuth error:', error);
        return { error };
      }
      
      console.log('✅ Google OAuth initiated successfully');
      return { error: null };
    } catch (error: any) {
      console.error('❌ Google OAuth exception:', error);
      return { error };
    }
  };

  const signOut = async () => {
    console.log('👋 Starting sign out process...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Error signing out:', error);
        throw error;
      }
      
      console.log('✅ Sign out successful');
      
      // Clear local storage
      if (Platform.OS === 'web') {
        localStorage.clear();
      } else {
        await AsyncStorage.clear();
      }
      
      console.log('🧹 Local storage cleared');
    } catch (error) {
      console.error('❌ Sign out exception:', error);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };

  console.log('🎯 AuthContext state:', { 
    user: user?.id || 'null', 
    loading, 
    isInitialized: isInitializedRef.current 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
