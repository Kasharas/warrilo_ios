import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Shield, Check } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';

const features = [
  'Store receipts securely in the cloud',
  'Track warranty expiry dates',
  'Get proactive alerts before expiry',
  'Access from anywhere, anytime',
];

export default function WelcomeScreen() {
  const router = useRouter();

  // Note: Auto-redirect logic removed - now handled by app/index.tsx
  // This prevents redirect loops and provides cleaner routing

  const handleGetStarted = () => {
    // User is not logged in (welcome screen only shows for unauthenticated users)
    // Go to login screen
    router.push('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View 
          entering={FadeInUp.delay(200).duration(600)}
          style={styles.logoContainer}
        >
          <View style={styles.logo}>
            <Shield size={60} color={theme.colors.primary[600]} />
          </View>
        </Animated.View>

        {/* Title and Subtitle */}
        <Animated.View 
          entering={FadeInUp.delay(400).duration(600)}
          style={styles.titleContainer}
        >
          <Text style={styles.title}>Warrilo</Text>
          <Text style={styles.subtitle}>
            Never lose a receipt or miss a warranty deadline again
          </Text>
        </Animated.View>

        {/* Feature List */}
        <Animated.View 
          entering={FadeInUp.delay(600).duration(600)}
          style={styles.featureList}
        >
          {features.map((feature, index) => (
            <Animated.View
              key={index}
              entering={FadeInUp.delay(800 + index * 100).duration(600)}
              style={styles.featureItem}
            >
              <View style={styles.featureIcon}>
                <Check size={20} color={theme.colors.white} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View 
          entering={FadeInUp.delay(1200).duration(600)}
          style={styles.buttonContainer}
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
    backgroundColor: theme.colors.primary[600],
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