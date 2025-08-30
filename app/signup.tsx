import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Shield, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    console.log('Signup attempt started'); // Debug log
    
    if (!email || !password || !confirmPassword) {
      console.log('Validation failed: missing fields'); // Debug log
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      console.log('Validation failed: passwords do not match'); // Debug log
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      console.log('Validation failed: password too short'); // Debug log
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    console.log('Starting signup process...'); // Debug log
    setLoading(true);
    
    try {
      console.log('Calling signUp function...'); // Debug log
      const { error } = await signUp(email, password);
      console.log('SignUp result:', { error }); // Debug log
      
      if (error) {
        console.log('Signup failed:', error.message); // Debug log
        Alert.alert('Signup Failed', error.message);
      } else {
        console.log('Signup successful!'); // Debug log
        Alert.alert(
          'Success', 
          'Account created successfully! Please check your email to verify your account.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.log('Signup error caught:', error); // Debug log
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.colors.neutral[600]} />
        </Pressable>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Shield size={40} color="#007AFF" />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
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
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor={theme.colors.neutral[400]}
            />
            <Pressable
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color={theme.colors.neutral[400]} />
              ) : (
                <Eye size={20} color={theme.colors.neutral[400]} />
              )}
            </Pressable>
          </View>
          <Text style={styles.passwordHint}>Not less than 6 symbols</Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              placeholderTextColor={theme.colors.neutral[400]}
            />
            <Pressable
              style={styles.passwordToggle}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color={theme.colors.neutral[400]} />
              ) : (
                <Eye size={20} color={theme.colors.neutral[400]} />
              )}
            </Pressable>
          </View>
          <Text style={styles.passwordHint}>Not less than 6 symbols</Text>

          <Pressable 
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} 
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account</Text>
            )}
          </Pressable>

          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.signInLink}>Sign in</Text>
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
  backButton: {
    position: 'absolute',
    top: theme.spacing['2xl'],
    left: theme.spacing['2xl'],
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: theme.spacing['4xl'],
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
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  signInText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
  },
  signInLink: {
    fontSize: theme.fontSize.base,
            color: '#007AFF',
    fontWeight: theme.fontWeight.medium,
  },
});
