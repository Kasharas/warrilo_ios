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
      console.log('4. Window location search:', window.location.search);
      console.log('5. Window location hash:', window.location.hash);

      // Check auth system
      const currentUser = user;
      const currentLoading = loading;
      
      // If user is already authenticated, go straight to dashboard
      if (!currentLoading && currentUser) {
        console.log('INDEX: Current navigation state');
        console.log('INDEX: Available routes:', router.canGoBack());
        console.log('INDEX: Authentication check completed');
        console.log('INDEX: User exists?', !!currentUser);
        console.log('INDEX: Loading state?', currentLoading);
        console.log('INDEX: About to navigate to:', currentUser ? 'dashboard' : 'welcome');
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
      
      console.log('6. Checking for OAuth code in URL...');
      console.log('6a. URL search params:', window.location.search);
      console.log('6b. Extracted code:', code);
      console.log('6c. Code exists:', !!code);
      console.log('6d. User exists:', !!user);
      
      if (code && !currentUser) {  // <- Added !currentUser condition
        console.log('4. OAuth code detected:', code);
        console.log('4a. Code length:', code.length);
        console.log('4b. Code preview:', code.substring(0, 20) + '...');
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
      if (!currentLoading && !code) {
        console.log('INDEX: Current navigation state');
        console.log('INDEX: Available routes:', router.canGoBack());
        console.log('INDEX: Authentication check completed');
        console.log('INDEX: User exists?', !!currentUser);
        console.log('INDEX: Loading state?', currentLoading);
        console.log('INDEX: About to navigate to:', currentUser ? 'dashboard' : 'welcome');
        if (currentUser) {
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
              <ActivityIndicator size="large" color={theme.colors.systemBlue} />
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