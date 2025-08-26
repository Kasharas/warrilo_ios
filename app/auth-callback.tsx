import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/src/styles/theme';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    const processCallback = async () => {
      if (processed) return;
      setProcessed(true);

      console.log('=== AUTH CALLBACK PROCESSING ===');
      console.log('1. Auth callback route loaded');
      console.log('2. Current user:', user?.id || 'No user');
      console.log('3. Loading state:', loading);
      console.log('4. Current URL:', window.location.href);
      console.log('5. URL Hash:', window.location.hash);
      console.log('6. URL Search:', window.location.search);

      // Check if we have OAuth tokens in URL
      if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log('7a. OAuth tokens detected in URL, processing...');
        
        try {
          // Force session refresh from URL
          const { data, error } = await supabase.auth.refreshSession();
          console.log('7b. Session refresh result:', { data, error });
          
          if (data.session?.user) {
            console.log('7c. User found after refresh, going to dashboard');
            router.replace('/(tabs)');
            return;
          }
        } catch (error) {
          console.error('7d. Error refreshing session:', error);
        }
      }

      // Wait for authentication to complete
      if (!loading) {
        if (user) {
          console.log('8. User authenticated, redirecting to dashboard...');
          // User is authenticated, redirect to dashboard
          router.replace('/(tabs)');
        } else {
          console.log('9. No user found, redirecting to welcome...');
          // No user found, redirect to welcome
          router.replace('/welcome');
        }
      }
    };

    processCallback();
  }, [user, loading, router, processed]);

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: theme.colors.white 
    }}>
      <ActivityIndicator size="large" color={theme.colors.primary[600]} />
      <Text style={{ 
        marginTop: 16, 
        color: theme.colors.neutral[600],
        fontSize: 16
      }}>
        Completing authentication...
      </Text>
    </View>
  );
}

