import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { theme } from '@/src/styles/theme';

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [processingOAuth, setProcessingOAuth] = useState(false);

  useEffect(() => {
    const handleInitialRoute = async () => {
      console.log('=== INDEX ROUTE ===');
      console.log('1. Index loaded - User:', user ? 'logged in' : 'not logged in');
      console.log('2. Loading state:', loading);
      console.log('3. Current URL:', window.location.href);

      // If user is already authenticated, go straight to dashboard
      if (!loading && user) {
        console.log('4. User already authenticated, going to dashboard');
        // Clean URL if it still has OAuth code
        if (window.location.search.includes('code=')) {
          window.history.replaceState({}, '', window.location.origin);
        }
        router.replace('/(tabs)');
        return;
      }

      // Only process OAuth code if user is NOT authenticated
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code && !user) {  // <- Added !user condition
        console.log('4. OAuth code detected:', code);
        console.log('5. Processing OAuth code directly in index.tsx...');
        setProcessingOAuth(true);
        
        try {
          // Process OAuth code immediately
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('6. OAuth processing error:', error);
            console.log('7. Redirecting to welcome due to OAuth error');
            router.replace('/welcome');
            return;
          }
          
          if (data.session) {
            console.log('6. OAuth session established:', data.session.user.id);
            console.log('7. Cleaning URL and redirecting to dashboard');
            
            // Clean URL immediately
            window.history.replaceState({}, '', window.location.origin);
            
            // Navigate to dashboard
            router.replace('/(tabs)');
            return;
          }
        } catch (error) {
          console.error('6. OAuth processing failed:', error);
          console.log('7. Redirecting to welcome due to processing failure');
          router.replace('/welcome');
          return;
        }
        
        setProcessingOAuth(false);
      }

      // No OAuth code and not loading - normal routing
      if (!loading && !code) {
        if (user) {
          console.log('4. User authenticated, going to dashboard');
          router.replace('/(tabs)');
        } else {
          console.log('4. No user, going to welcome');
          router.replace('/welcome');
        }
      }
    };

    handleInitialRoute();
  }, [user, loading, router]);

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: theme.colors.white 
    }}>
              <ActivityIndicator size="large" color="#007AFF" />
      <Text style={{ 
        marginTop: 16, 
        color: theme.colors.neutral[600],
        fontSize: 16
      }}>
        {processingOAuth ? 'Completing sign-in...' : 'Loading Warrilo...'}
      </Text>
    </View>
  );
}