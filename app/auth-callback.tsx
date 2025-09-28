import { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Processing OAuth callback...');

        // Prefer reading the auth code directly from route params (string or string[])
        const rawCodeParam = (params as any)?.code as unknown;
        let code: string | undefined = Array.isArray(rawCodeParam)
          ? (typeof rawCodeParam[0] === 'string' ? rawCodeParam[0] : undefined)
          : (typeof rawCodeParam === 'string' ? rawCodeParam : undefined);

        // Fallback: get full URL (cold start) and parse code parameter
        if (!code) {
          let incomingUrl: string | null = null;
          if (typeof (params as any)?.url === 'string') {
            incomingUrl = decodeURIComponent((params as any).url as string);
          } else {
            incomingUrl = await Linking.getInitialURL();
          }
          console.log('🔗 Incoming OAuth URL:', incomingUrl || 'null');
          if (incomingUrl) {
            const parsed = Linking.parse(incomingUrl);
            const qp: any = parsed?.queryParams || {};
            code = typeof qp.code === 'string' ? qp.code : undefined;
          }
        }

        if (!code) {
          console.warn('⚠️ No authorization code found in callback URL');
          router.replace('/login');
          return;
        }

        // Exchange the authorization code for a session (PKCE)
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
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



