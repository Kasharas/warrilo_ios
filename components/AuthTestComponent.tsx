import React from 'react';
import { View, Text, Button } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export const AuthTestComponent = () => {
  const { 
    loading: isLoading, 
    user, 
    signInWithGoogle, 
    signOut
  } = useAuth();
  const isAuthenticated = !!user;
  const error = null; // Old auth doesn't expose error in context
  const authSessionReady = true; // Old auth is always ready

  console.log('🧪 AUTH TEST COMPONENT RENDER 🧪');
  console.log('State:', { isLoading, isAuthenticated, hasUser: !!user, authSessionReady, error });

  return (
    <View style={{ padding: 20, backgroundColor: '#f0f0f0', margin: 10 }}>
      <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>🧪 New Auth System Test</Text>
      <Text>Loading: {isLoading ? 'Yes' : 'No'}</Text>
      <Text>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</Text>
      <Text>User: {user?.email || 'None'}</Text>
      <Text>Auth Ready: {authSessionReady ? 'Yes' : 'No'}</Text>
      <Text>Error: {error || 'None'}</Text>
      
      {!isAuthenticated && authSessionReady && (
        <Button 
          title="🧪 Test New Google Sign In" 
          onPress={signInWithGoogle}
          disabled={isLoading}
        />
      )}
      
      {isAuthenticated && (
        <Button 
          title="🧪 Test Sign Out" 
          onPress={signOut}
        />
      )}
    </View>
  );
};
