import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Shield, Eye, EyeOff } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import * as Linking from 'expo-linking';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle, loading: isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // For now, show a message that email/password login is not implemented in new system
      Alert.alert('Info', 'Email/password login will be implemented in the new auth system');
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Password Reset',
      'Password reset functionality is currently a stub. In the full app, you would receive an email with reset instructions.',
      [{ text: 'OK' }]
    );
  };

  const handleGoogleLogin = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    console.log('=== GOOGLE LOGIN DEBUG START ===');
    console.log('1. Button clicked, using auth system...');
    console.log('2. Current auth state:', { isLoading, error });
    
    try {
      console.log('3. Calling signInWithGoogle function...');
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('4. Google sign-in error:', error);
        setError(error.message || 'Google sign-in failed');
      } else {
        console.log('4. OAuth flow started successfully - redirecting to Google...');
        console.log('5. User should see Google account selection page now');
      }
    } catch (error) {
      console.error('6. Unexpected error during Google sign-in:', error);
      setError('An unexpected error occurred during Google Sign-In');
    }
    
    console.log('=== GOOGLE LOGIN DEBUG END ===');
  };

  const testDeepLink = () => {
    const testUrl = 'com.warrilo.mobile://auth-callback?code=test123&state=test';
    console.log('🧪 TESTING DEEP LINK:', testUrl);
    Alert.alert('Testing Deep Link', testUrl);
    Linking.openURL(testUrl).catch(err => {
      console.error('🧪 DEEP LINK TEST FAILED:', err);
      Alert.alert('Deep Link Test Failed', err.message);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Shield size={40} color="#007AFF" />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={theme.colors.neutral[400]}
            onSubmitEditing={() => {}}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor={theme.colors.neutral[400]}
              onSubmitEditing={() => {}}
            />
            <Pressable
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color="#007AFF" />
              ) : (
                                  <Eye size={20} color="#007AFF" />
              )}
            </Pressable>
          </View>
          <Text style={styles.passwordHint}>Not less than 6 symbols</Text>

          <Pressable style={styles.forgotPassword} onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </Pressable>

          <Pressable 
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </Pressable>

          <Text style={styles.dividerText}>or continue with</Text>

          <Pressable 
            style={[
              styles.secondaryButton,
              isLoading && styles.secondaryButtonDisabled
            ]}
            onPress={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={[styles.secondaryButtonText, styles.loadingText]}>
                  Connecting to Google...
                </Text>
              </View>
            ) : (
              <Text style={styles.secondaryButtonText}>Sign in with Google</Text>
            )}
          </Pressable>

          {error && (
            <Text style={styles.errorText}>
              {error}
            </Text>
          )}

          {/* Add this test button */}
          <Pressable onPress={testDeepLink} style={{ 
            padding: 10, 
            backgroundColor: '#f0f0f0', 
            margin: 10, 
            borderRadius: 8,
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 14, color: '#666' }}>🧪 Test Deep Link</Text>
          </Pressable>

          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <Pressable onPress={() => router.push('/signup')}>
              <Text style={styles.signUpLink}>Sign up</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing['4xl'],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing['4xl'],
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
    ...theme.shadows.md,
  },
  title: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
  },
  form: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    fontSize: theme.fontSize.base,
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing.lg,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing.lg,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    fontSize: theme.fontSize.base,
  },
  passwordToggle: {
    paddingHorizontal: theme.spacing.lg,
  },
  passwordHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[400],
    marginTop: -theme.spacing.md,
    marginBottom: theme.spacing.lg,
    marginLeft: theme.spacing.lg,
    fontStyle: 'italic',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing['2xl'],
  },
  forgotPasswordText: {
    fontSize: theme.fontSize.sm,
    color: '#007AFF',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing['3xl'],
    ...theme.shadows.sm,
  },
  primaryButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  dividerText: {
    textAlign: 'center',
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing['3xl'],
  },
  secondaryButton: {
    borderColor: '#007AFF',
    borderWidth: 2,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  secondaryButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: '#007AFF',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  signUpText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
  },
  signUpLink: {
    fontSize: theme.fontSize.base,
    color: '#007AFF',
    fontWeight: theme.fontWeight.medium,
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: theme.spacing.sm,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
});