import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { theme } from '@/src/styles/theme';

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.white }}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
        <Text style={{ marginTop: 16, color: theme.colors.neutral[600] }}>Initializing...</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <Stack
        screenOptions={{ headerShown: false }}
        // Add this line to set initial route
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
    </AuthProvider>
  );
}
