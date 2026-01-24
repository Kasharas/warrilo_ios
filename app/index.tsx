import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/src/styles/theme';

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [hasNavigated, setHasNavigated] = useState(false);

  // Timeout detection for stuck loading states
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.error('⚠️ INDEX: Loading timeout - stuck in loading state for 10 seconds');
        console.error('⚠️ INDEX: Forcing navigation to welcome as fallback');
        try {
          router.replace('/welcome');
        } catch (error) {
          console.error('❌ INDEX: Emergency navigation failed:', error);
        }
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading, router]);

  useEffect(() => {
    const handleInitialRoute = () => {
      console.log('=== INDEX ROUTE ===');
      console.log('1. Index loaded - User:', user ? 'logged in' : 'not logged in');
      console.log('2. Loading state:', loading);
      console.log('3. Has already navigated:', hasNavigated);

      // Prevent multiple navigation attempts
      if (hasNavigated) {
        console.log('INDEX: Already navigated, skipping');
        return;
      }

      // Wait for loading to complete
      if (loading) {
        console.log('INDEX: Still loading, waiting...');
        return;
      }

      // Route based on authentication status
      console.log('INDEX: Authentication check completed');
      console.log('INDEX: User exists?', !!user);
      console.log('INDEX: About to navigate to:', user ? 'dashboard' : 'welcome');

      try {
        if (user) {
          console.log('4. User authenticated, going to dashboard');
          router.replace('/(tabs)');
        } else {
          console.log('4. No user, going to welcome');
          router.replace('/welcome');
        }
        setHasNavigated(true);
      } catch (error) {
        console.error('❌ INDEX: Navigation error:', error);
        // Fallback to welcome on error
        try {
          router.replace('/welcome');
          setHasNavigated(true);
        } catch (fallbackError) {
          console.error('❌ INDEX: Fallback navigation also failed:', fallbackError);
        }
      }
    };

    handleInitialRoute();
  }, [user, loading, router, hasNavigated]);

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.white
    }}>
      <ActivityIndicator size="large" color={theme.colors.systemBlue} />
      <Text style={{
        marginTop: theme.spacing.md,
        color: theme.colors.neutral[600],
        fontSize: theme.fontSize.base
      }}>
        Loading Warrilo...
      </Text>
    </View>
  );
}