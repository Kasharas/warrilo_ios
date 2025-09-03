import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Platform } from 'react-native';

export default function AuthCallback() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('=== AUTH CALLBACK HANDLER ===');
        console.log('1. Platform:', Platform.OS);
        console.log('2. Received params:', params);
        
        // Handle different callback scenarios
        if (Platform.OS === 'web') {
          // Web handles OAuth automatically via Supabase
          console.log('3. Web platform - checking session...');
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('4. Web auth callback error:', error);
          } else if (data.session) {
            console.log('5. Web auth callback success:', data.session.user?.id);
            router.replace('/(tabs)');
          } else {
            console.log('6. No session found, redirecting to login...');
            router.replace('/login');
          }
        } else {
          // Mobile deep link handling
          console.log('3. Mobile platform - processing deep link...');
          
          // Extract OAuth parameters from URL params
          const code = params.code as string;
          const error = params.error as string;
          
          if (error) {
            console.error('4. Mobile OAuth error:', error);
            router.replace('/login');
            return;
          }
          
          if (code) {
            console.log('5. Mobile OAuth code received, exchanging for session...');
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            
            if (exchangeError) {
              console.error('6. Code exchange error:', exchangeError);
              router.replace('/login');
            } else if (data.session) {
              console.log('7. Mobile auth success:', data.session.user?.id);
              router.replace('/(tabs)');
            } else {
              console.log('8. No session after code exchange');
              router.replace('/login');
            }
          } else {
            console.log('4. No OAuth code found in mobile callback');
            router.replace('/login');
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/login');
      }
    };
    
    handleAuthCallback();
  }, [params]);
  
  return null;
}