import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Processing OAuth callback...');

        // Try to get the deep link URL from params (when app was already open) or initial URL (cold start)
        let incomingUrl: string | null = null;
        if (typeof params?.url === 'string') {
          incomingUrl = decodeURIComponent(params.url);
        } else {
          incomingUrl = await Linking.getInitialURL();
        }

        console.log('🔗 Incoming OAuth URL:', incomingUrl || 'null');

        // Parse code from the URL
        let code: string | undefined = undefined;
        if (incomingUrl) {
          const parsed = Linking.parse(incomingUrl);
          const qp: any = parsed?.queryParams || {};
          code = typeof qp.code === 'string' ? qp.code : undefined;
        }

        if (!code) {
          console.warn('⚠️ No authorization code found in callback URL');
          router.replace('/login');
          return;
        }

        // Exchange the authorization code for a session (PKCE)
        const { data, error } = await supabase.auth.exchangeCodeForSession({ code });
        if (error) {
          console.error('❌ Code exchange error:', error);
          router.replace('/login');
          return;
        }

        console.log('✅ Session established for user:', data?.user?.id || 'unknown');
        router.replace('/(tabs)');
      } catch (error) {
        console.error('❌ Auth callback exception:', error);
        router.replace('/login');
      }
    };

    handleAuthCallback();
  }, [router, params]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={{ marginTop: 16, fontSize: 16, color: '#6b7280' }}>
        Completing sign in...
      </Text>
    </View>
  );
}



