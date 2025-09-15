import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/src/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

const features = [
  'Store receipts securely in the cloud',
  'Track warranty expiry dates',
  'Get proactive alerts before expiry',
  'Access from anywhere, anytime',
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Handle authentication redirect in useEffect to prevent render-time navigation
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('WelcomeScreen: User authenticated, redirecting to dashboard');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, user, router]);

  // Start animations on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    // User is not logged in (welcome screen only shows for unauthenticated users)
    // Go to login screen
    router.push('/login');
  };

  // Don't render anything if user is authenticated (will redirect)
  if (isAuthenticated && user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.logo}>
            <Ionicons name="shield" size={60} color={theme.colors.systemBlue} />
          </View>
        </Animated.View>

        {/* Title and Subtitle */}
        <Animated.View 
          style={[
            styles.titleContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>Warrilo</Text>
          <Text style={styles.subtitle}>
            Never lose a receipt or miss a warranty deadline again
          </Text>
        </Animated.View>

        {/* Feature List */}
        <Animated.View 
          style={[
            styles.featureList,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {features.map((feature, index) => (
            <Animated.View
              key={index}
              style={[
                styles.featureItem,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.featureIcon}>
                <Ionicons name="checkmark" size={20} color={theme.colors.white} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </Animated.View>
          ))}
        </Animated.View>


        {/* Action Buttons */}
        <Animated.View 
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Pressable 
            style={styles.primaryButton}
            onPress={handleGetStarted}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>
          
          <Pressable 
            style={styles.secondaryButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.secondaryButtonText}>Already have an account?</Text>
          </Pressable>
          
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing['6xl'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: theme.spacing['4xl'],
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing['6xl'],
  },
  title: {
    fontSize: theme.fontSize['5xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.lg,
  },
  subtitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.neutral[600],
    textAlign: 'center',
    lineHeight: 28,
  },
  featureList: {
    width: '100%',
    marginBottom: theme.spacing['6xl'],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.success[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  featureText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[700],
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  primaryButton: {
    backgroundColor: theme.colors.systemBlue,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  primaryButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  secondaryButton: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
    textDecorationLine: 'underline',
  },
});