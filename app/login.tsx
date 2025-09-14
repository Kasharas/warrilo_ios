import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/src/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle, signIn, resetPassword, resendVerification, loading: isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form validation functions
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPassword = (password: string) => {
    return password.length >= 6;
  };

  const handleLogin = async () => {
    console.log('=== EMAIL LOGIN DEBUG START ===');
    console.log('1. Email login button clicked');
    console.log('2. Email:', email);
    console.log('3. Password length:', password.length);
    console.log('4. Current loading state:', loading);
    
    // Prevent multiple simultaneous login attempts
    if (loading) {
      console.log('4. Login already in progress, ignoring duplicate call');
      return;
    }
    
    if (!email || !password) {
      console.log('4. Validation failed: Missing email or password');
      setError('Please fill in all fields');
      return;
    }

    if (!isValidEmail(email)) {
      console.log('4. Validation failed: Invalid email format');
      setError('Please enter a valid email address');
      return;
    }

    if (!isValidPassword(password)) {
      console.log('4. Validation failed: Password too short');
      setError('Password must be at least 6 characters long');
      return;
    }

    console.log('4. Validation passed, starting login process...');
    setLoading(true);
    setError(null);
    
    try {
      console.log('5. Calling signIn function from AuthContext...');
      const { error, needsVerification, needsGoogleAuth } = await signIn(email, password);
      
      if (needsVerification) {
        console.log('6. Email needs verification - showing verification popup');
        Alert.alert(
          'Email Verification Required',
          'Your account exists but your email address has not been verified. We\'ve sent you a new verification email.',
          [
            {
              text: 'Resend Verification',
              onPress: () => handleResendVerification(email)
            },
            {
              text: 'OK',
              style: 'default'
            }
          ]
        );
      } else if (needsGoogleAuth) {
        console.log('6. User exists but uses Google OAuth - showing Google auth popup');
        Alert.alert(
          'Account Created with Google',
          'This account was created using Google Sign-In. Please use the "Sign in with Google" button instead.',
          [
            {
              text: 'Use Google Sign-In',
              onPress: () => handleGoogleLogin()
            },
            {
              text: 'OK',
              style: 'default'
            }
          ]
        );
      } else if (error) {
        console.error('6. SignIn error:', error.message);
        setError(error.message);
      } else {
        console.log('6. SignIn successful - user will be redirected automatically');
        // Success - user will be redirected automatically by AuthContext
      }
    } catch (error) {
      console.error('7. Unexpected error during signIn:', error);
      setError('An unexpected error occurred');
    } finally {
      console.log('8. Login process completed, setting loading to false');
      setLoading(false);
    }
    
    console.log('=== EMAIL LOGIN DEBUG END ===');
  };

  const handleResendVerification = async (email: string) => {
    console.log('=== RESEND VERIFICATION DEBUG START ===');
    console.log('1. Resend verification requested for email:', email);
    
    setLoading(true);
    
    try {
      const { error } = await resendVerification(email);
      
      if (error) {
        console.error('2. Resend verification error:', error.message);
        Alert.alert('Error', error.message);
      } else {
        console.log('2. Verification email resent successfully');
        Alert.alert(
          'Verification Email Sent',
          'A new verification email has been sent to your email address. Please check your inbox and click the verification link.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('3. Unexpected error during resend verification:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      console.log('4. Resend verification process completed');
      setLoading(false);
    }
    
    console.log('=== RESEND VERIFICATION DEBUG END ===');
  };

  const handleForgotPassword = async () => {
    console.log('=== FORGOT PASSWORD DEBUG START ===');
    console.log('1. Forgot password clicked for email:', email);
    
    if (!email) {
      console.log('2. No email provided, showing alert');
      Alert.alert(
        'Email Required',
        'Please enter your email address first, then tap "Forgot password?"',
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('3. Email provided, starting password reset...');
    setLoading(true);
    
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        console.error('4. Password reset error:', error.message);
        Alert.alert('Error', error.message);
      } else {
        console.log('4. Password reset email sent successfully');
        Alert.alert(
          'Password Reset',
          'A password reset link has been sent to your email address.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('5. Unexpected error during password reset:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      console.log('6. Password reset process completed');
      setLoading(false);
    }
    
    console.log('=== FORGOT PASSWORD DEBUG END ===');
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


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="shield" size={40} color={"#007AFF"} />
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
                <Ionicons name="eye-off" size={20} color={"#007AFF"} />
              ) : (
                                  <Ionicons name="eye" size={20} color={"#007AFF"} />
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