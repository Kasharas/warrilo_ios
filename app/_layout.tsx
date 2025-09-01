import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SyncProvider } from '@/contexts/SyncContext';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { theme } from '@/src/styles/theme';
import { useStartupSync } from '@/src/hooks/useStartupSync';
import { StatusBar } from 'expo-status-bar';

// Main app content component that can use auth context
function AppContent() {
  const { user, syncReady } = useAuth();
  
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
