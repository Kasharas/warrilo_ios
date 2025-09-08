import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { theme } from '@/src/styles/theme';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      console.log('🔗 AUTH CALLBACK: Starting processing...');
      console.log('🔗 AUTH CALLBACK: Received params:', JSON.stringify(params, null, 2));

      try {
        // Extract code from params (handle both string and array)
        let code = params.code;
        if (Array.isArray(code)) {
          code = code[0];
        }

        console.log('🔗 AUTH CALLBACK: Extracted code:', code);

        if (code && typeof code === 'string') {
          console.log('🔗 AUTH CALLBACK: Exchanging code for session...');
          
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('🔗 AUTH CALLBACK: Exchange error:', error);
            router.replace('/login');
            return;
          }
          
          if (data.session) {
            console.log('🔗 AUTH CALLBACK: Session created! User:', data.session.user.id);
            console.log('🔗 AUTH CALLBACK: Redirecting to dashboard...');
            router.replace('/(tabs)');
          } else {
            console.error('🔗 AUTH CALLBACK: No session in response');
            router.replace('/login');
          }
        } else {
          console.error('🔗 AUTH CALLBACK: No valid code found');
          router.replace('/login');
        }
      } catch (error) {
        console.error('🔗 AUTH CALLBACK: Processing error:', error);
        router.replace('/login');
      } finally {
        setProcessing(false);
      }
    };

    // Add a small delay to ensure params are fully loaded
    const timer = setTimeout(processCallback, 100);
    return () => clearTimeout(timer);
  }, [params, router]);

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
        fontSize: 16,
        textAlign: 'center'
      }}>
        {processing ? 'Completing sign-in...' : 'Redirecting...'}
      </Text>
    </View>
  );
}