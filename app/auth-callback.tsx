// app/auth-callback.tsx
import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    console.log('🔐 Auth callback screen mounted');

    // The Supabase SDK automatically handles OAuth callbacks via deep link
    // when detectSessionInUrl: true is set
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth event:', event);

        if (event === 'SIGNED_IN' && session) {
          console.log('✅ User signed in successfully:', session.user.email);

          // Small delay to ensure session is fully persisted
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 500);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          router.replace('/login');
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed');
        } else {
          console.log('⚠️ Unhandled auth event:', event);
        }
      }
    );

    return () => {
      console.log('🧹 Cleaning up auth listener');
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
});
