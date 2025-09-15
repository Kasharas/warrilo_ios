import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/src/styles/theme';

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleInitialRoute = () => {
      console.log('=== INDEX ROUTE ===');
      console.log('1. Index loaded - User:', user ? 'logged in' : 'not logged in');
      console.log('2. Loading state:', loading);

      // Wait for loading to complete
      if (loading) {
        console.log('INDEX: Still loading, waiting...');
        return;
      }

      // OAuth is now handled by Supabase's built-in flow
      console.log('3. OAuth handled by Supabase built-in flow');

      // Route based on authentication status
      console.log('INDEX: Authentication check completed');
      console.log('INDEX: User exists?', !!user);
      console.log('INDEX: About to navigate to:', user ? 'dashboard' : 'welcome');
      
      if (user) {
        console.log('4. User authenticated, going to dashboard');
        router.replace('/(tabs)');
      } else {
        console.log('4. No user, going to welcome');
        router.replace('/welcome');
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
        marginTop: theme.spacing.base, 
        color: theme.colors.neutral[600],
        fontSize: theme.fontSize.base
      }}>
        Loading Warrilo...
      </Text>
    </View>
  );
}