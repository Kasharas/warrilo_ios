import { useEffect, useState } from 'react';
import { useSupabaseOAuth } from './authSession';
import { supabaseSecure } from './supabaseClientSecure';
import * as Linking from 'expo-linking';

export const useIntegratedAuth = () => {
  console.log('=== INTEGRATED AUTH HOOK INITIALIZATION ===');
  
  const [authState, setAuthState] = useState({
    isLoading: false,
    isAuthenticated: false,
    user: null,
    session: null,
    error: null
  });

  const { startSupabaseOAuth } = useSupabaseOAuth();

  // Add deep link listener for OAuth return
  useEffect(() => {
    console.log('🔗 SETTING UP OAUTH DEEP LINK LISTENER 🔗');
    
    const handleDeepLink = (url: string) => {
      console.log('🔗 OAUTH DEEP LINK RECEIVED:', url);
      
      if (url.includes('auth-callback')) {
        console.log('✅ OAuth callback detected, processing...');
        
        // The URL contains the OAuth result, Supabase should handle it automatically
        // Force a session check to pick up the new session
        supabaseSecure.auth.getSession().then(({ data: { session }, error }) => {
          console.log('📱 Session check after OAuth callback:', {
            hasSession: !!session,
            hasUser: !!session?.user,
            error: !!error
          });
          
          if (session) {
            console.log('🎉 OAuth authentication completed successfully');
            setAuthState({
              isLoading: false,
              isAuthenticated: true,
              user: session.user,
              session: session,
              error: null
            });
          } else if (error) {
            console.error('❌ Session check error after OAuth:', error);
            setAuthState(prev => ({
              ...prev,
              isLoading: false,
              error: error.message
            }));
          }
        });
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Check initial URL in case app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => subscription?.remove();
  }, []);

  // Listen for auth state changes from Supabase
  useEffect(() => {
    console.log('🔄 SETTING UP SUPABASE AUTH LISTENER 🔄');
    
    const { data: { subscription } } = supabaseSecure.auth.onAuthStateChange(
      (event, session) => {
        console.log('📱 SUPABASE AUTH STATE CHANGE 📱');
        console.log('Event:', event);
        console.log('Session exists:', !!session);
        
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ Authentication successful via auth state change:', {
            userId: session.user.id,
            email: session.user.email
          });
          
          setAuthState({
            isLoading: false,
            isAuthenticated: true,
            user: session.user,
            session: session,
            error: null
          });
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 User signed out via auth state change');
          setAuthState({
            isLoading: false,
            isAuthenticated: false,
            user: null,
            session: null,
            error: null
          });
        }
      }
    );

    // Check for existing session
    supabaseSecure.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('♻️ Existing session found');
        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user: session.user,
          session: session,
          error: null
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    console.log('🚀 STARTING GOOGLE SIGN IN VIA SUPABASE 🚀');
    
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const result = await startSupabaseOAuth();
    
    if (!result.success) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: result.error
      }));
    }
    // If successful, the auth state change listener will handle the rest
  };

  const signOut = async () => {
    console.log('🚪 SIGNING OUT 🚪');
    
    try {
      const { error } = await supabaseSecure.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
      } else {
        console.log('✅ Sign out successful');
      }
    } catch (error) {
      console.error('Sign out exception:', error);
    }
  };

  return {
    ...authState,
    signInWithGoogle,
    signOut,
    authSessionReady: true // Supabase is always ready
  };
};

// Test function for integrated auth
export const testIntegratedAuth = () => {
  console.log('🧪 TESTING INTEGRATED AUTH SETUP 🧪');
  console.log('useSupabaseOAuth available:', !!useSupabaseOAuth);
  console.log('useIntegratedAuth available:', !!useIntegratedAuth);
  console.log('supabaseSecure available:', !!supabaseSecure);
};