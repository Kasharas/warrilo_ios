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
import { testSecureStorage } from '@/lib/secureStorage';
import { validateAuthConfiguration } from '@/lib/config';
import { requestNotificationPermissions } from '@/src/utils/permissions';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Main app content component that can use auth context
function AppContent() {
  const { user, syncReady, loading } = useAuth();
  const router = useRouter();

  // Debug auth state changes
  useEffect(() => {
    console.log('🔐 APP CONTENT: Auth state changed');
    console.log('🔐 APP CONTENT: User:', user ? `ID: ${user.id}` : 'null');
    console.log('🔐 APP CONTENT: Loading:', loading);
    console.log('🔐 APP CONTENT: SyncReady:', syncReady);
  }, [user, loading, syncReady]);

  // Auth-driven navigation guard
  useEffect(() => {
    console.log('🔐 AUTH GUARD: Checking auth state for navigation...');
    console.log('🔐 AUTH GUARD: Loading:', loading);
    console.log('🔐 AUTH GUARD: User exists:', !!user);
    console.log('🔐 AUTH GUARD: User ID:', user?.id || 'none');

    // Don't navigate while still loading
    if (loading) {
      console.log('🔐 AUTH GUARD: Still loading, waiting...');
      return;
    }

    // Navigate based on auth state
    if (user) {
      console.log('🔐 AUTH GUARD: User authenticated, ensuring in tabs');
      // User is logged in, make sure they're in the tabs area
      router.replace('/(tabs)');
    } else {
      console.log('🔐 AUTH GUARD: No user, redirecting to welcome');
      // User is not logged in, redirect to welcome
      router.replace('/welcome');
    }
  }, [user, loading, router]);

  // Additional effect to catch sign out specifically
  useEffect(() => {
    if (!loading && !user) {
      console.log('🔐 AUTH GUARD: Sign out detected, forcing navigation to welcome');
      router.replace('/welcome');
    }
  }, [user, loading, router]);

  // App initialization
  useEffect(() => {
    console.log('APP LAYOUT: Setting up app...');

    // Test Secure Storage setup
    testSecureStorage();

    // Validate Auth Configuration
    validateAuthConfiguration();

    // Request notification permissions on app startup
    requestNotificationPermissions().then(granted => {
      if (granted) {
        console.log('✅ Notification permissions granted');
      } else {
        console.log('❌ Notification permissions denied');
      }
    });

    // Configure Google Sign-In (commented out until native build)
    // GoogleSignin.configure({
    //   webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // Replace with your actual web client ID
    //   // scopes: ['openid', 'profile', 'email'], // Optional
    // });

    // Note: Deep link handling is now automatically managed by Supabase SDK
    // with detectSessionInUrl: true in lib/supabaseClient.ts
  }, []);

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
      <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
    </Stack>
  );
}

export default function RootLayout() {
  console.log('🚀🚀🚀 ROOT LAYOUT INITIALIZING - BUNDLE VERSION: ' + new Date().getTime());
  const router = useRouter();
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.white }}>
        <ActivityIndicator size="large" color={theme.colors.systemBlue} />
        <Text style={{ marginTop: 16, color: theme.colors.neutral[600] }}>Initializing...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.white }}>
      <StatusBar backgroundColor={theme.colors.white} style="dark" />
      <AuthProvider>
        <SyncProvider>
          <AppContent />
        </SyncProvider>
      </AuthProvider>
    </View>
  );
}