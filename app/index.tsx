import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // ALWAYS go to welcome screen first, regardless of authentication status
    router.replace('/welcome');
  }, [router]);

  // No loading screen needed since we're immediately redirecting
  return null;
}