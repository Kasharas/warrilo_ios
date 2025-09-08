import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SyncProvider } from '@/contexts/SyncContext';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { theme } from '@/src/styles/theme';
import { useStartupSync } from '@/src/hooks/useStartupSync';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { testAuthSessionSetup } from '@/lib/authSession';
import { testSecureStorage } from '@/lib/secureStorage';
import { testSecureSupabaseClient } from '@/lib/supabaseClientSecure';
import { testIntegratedAuth } from '@/lib/authIntegration';
import { validateAuthConfiguration } from '@/lib/config';

// Main app content component that can use auth context
function AppContent() {
  const { user, syncReady } = useAuth();
  const router = useRouter();
  
  // Deep link testing and debugging
  useEffect(() => {
    console.log('APP LAYOUT: Setting up deep link listeners...');
    
    // Test AuthSession setup
    testAuthSessionSetup();
    
    // Test Secure Storage setup
    testSecureStorage();
    
    // Test Secure Supabase Client setup
    testSecureSupabaseClient();
    
    // Test Integrated Auth setup
    testIntegratedAuth();
    
    // Validate Auth Configuration
    validateAuthConfiguration();
    
    // Listen for deep link events
    const handleDeepLink = (event: any) => {
      console.log('🔗 DEEP LINK RECEIVED - RAW EVENT:', JSON.stringify(event, null, 2));
      console.log('🔗 DEEP LINK URL:', event.url);
      console.log('🔗 DEEP LINK TYPE:', typeof event.url);
      console.log('🔗 DEEP LINK LENGTH:', event.url?.length);
      console.log('🔗 DEEP LINK CONTAINS auth-callback:', event.url?.includes('auth-callback'));
      console.log('🔗 DEEP LINK CONTAINS CODE:', event.url?.includes('code='));
      console.log('🔍 DEEP LINK VALIDATION 🔍');
      console.log('Original URL:', event.url);

      // Normalize Expo Dev Client wrapper (exp+... ?url=ENCODED_URL)
      let effectiveUrl = event.url || '';
      if (effectiveUrl.startsWith('exp+')) {
        const urlParamIndex = effectiveUrl.indexOf('url=');
        if (urlParamIndex !== -1) {
          const encoded = effectiveUrl.substring(urlParamIndex + 4);
          try {
            const decoded = decodeURIComponent(encoded);
            if (decoded) {
              effectiveUrl = decoded;
              console.log('🔗 Normalized effective URL:', effectiveUrl);
            }
          } catch (e) {
            console.warn('🔗 Failed to decode inner URL from exp+ wrapper');
          }
        }
      }

      console.log('Effective URL:', effectiveUrl);
      console.log('Contains auth-callback:', effectiveUrl.includes('auth-callback'));
      console.log('Contains question mark:', effectiveUrl.includes('?'));
      console.log('URL length:', effectiveUrl.length);

      // If this is the auth callback, navigate to the route with proper parameter handling
      if (effectiveUrl.includes('auth-callback')) {
        console.log('🔗 Auth callback detected in URL:', effectiveUrl);

        // Extract parameters properly
        let params = '';
        if (effectiveUrl.includes('?')) {
          const urlParts = effectiveUrl.split('?');
          params = urlParts[1] || '';
          console.log('🔗 Extracted URL parameters:', params);

          // Parse individual parameters for logging
          try {
            const urlParams = new URLSearchParams(params);
            console.log('🔗 Parsed parameters:', Object.fromEntries(urlParams.entries()));
            console.log('🔗 OAuth code present:', !!urlParams.get('code'));
            console.log('🔗 OAuth error present:', !!urlParams.get('error'));
          } catch (e) {
            console.warn('🔗 Failed to parse URLSearchParams from params string:', params);
          }
        }

        const targetRoute = params ? `/auth-callback?${params}` : '/auth-callback';
        console.log('🔗 Navigating to:', targetRoute);

        try {
          router.replace(targetRoute);
          console.log('🔗 Navigation successful');
        } catch (navigationError) {
          console.error('🔗 Navigation failed:', navigationError);
          // Fallback navigation without parameters
          router.replace('/auth-callback');
        }
      }
    };
    
    // Get initial URL if app was opened via deep link
    Linking.getInitialURL().then(url => {
      if (url) {
        console.log('🔗 INITIAL URL on app start:', url);
        handleDeepLink({ url });
      }
    });
    
    // Listen for subsequent deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    return () => subscription?.remove();
  }, [router]);
  
  // Only trigger startup sync when both conditions are met
  useStartupSync({
    enableAutoSync: !!user && syncReady,
    syncOnAppResume: !!user && syncReady,
    syncIntervalMinutes: 30,
    retryOnFailure: true,
    maxRetries: 3
  });

  return (
    <Stack
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.white }
      }}
      initialRouteName="index"
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="plan-selection" />
      <Stack.Screen name="add-device" />
      <Stack.Screen name="device-details" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="auth-callback" />
      <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initialization time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex:1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.white }}>
        <ActivityIndicator size="large" color={theme.colors.systemBlue} />
        <Text style={{ marginTop: 16, color: theme.colors.neutral[600] }}>Initializing...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.white }}>
      <StatusBar backgroundColor={theme.colors.white} style="dark" barStyle="dark-content" />
      <AuthProvider>
        <SyncProvider>
          <AppContent />
        </SyncProvider>
      </AuthProvider>
    </View>
  );
}