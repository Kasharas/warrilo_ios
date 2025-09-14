import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/src/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ModalProNotice } from '@/src/components/ModalProNotice';

const plans = {
  pro: {
    name: 'Pro Plan',
    monthlyPrice: 1.99,
    yearlyPrice: 19.99,
    features: [
      'Unlimited devices',
      'OCR receipt scanning',
      'Family sharing (up to 6 members)',
      'Email integration',
      'Advanced alert customization',
      'Priority customer support',
    ],
  },
  free: {
    name: 'Free Plan',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Up to 10 devices',
      'Basic warranty alerts',
      'Manual receipt upload',
      'Individual account only',
    ],
  },
};

export default function PlanSelectionScreen() {
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [showProNotice, setShowProNotice] = useState(false);

  const handleUpgrade = () => {
    Alert.alert(
      'Start Free Trial',
      'Starts 7-day free trial. Payment functionality is currently a UI stub in this demo.',
      [{ text: 'OK' }]
    );
  };

  const savings = Math.round(((plans.pro.monthlyPrice * 12) - plans.pro.yearlyPrice) / (plans.pro.monthlyPrice * 12) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.neutral[900]} />
        </Pressable>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Logo and Title */}
        <View style={styles.titleSection}>
          <View style={styles.logo}>
            <Ionicons name="shield" size={40} color={theme.colors.systemBlue} />
          </View>
          <Text style={styles.title}>Select Your Plan</Text>
          <Text style={styles.subtitle}>Choose the plan that works best for you</Text>
          
          {/* Billing Toggle */}
          <View style={styles.billingToggle}>
            <Text style={[styles.billingLabel, !isYearly && styles.billingLabelActive]}>
              Monthly
            </Text>
            <Pressable
              style={[styles.toggle, isYearly && styles.toggleActive]}
              onPress={() => setIsYearly(!isYearly)}
            >
              <View style={[styles.toggleKnob, isYearly && styles.toggleKnobActive]} />
            </Pressable>
            <View style={styles.yearlyContainer}>
              <Text style={[styles.billingLabel, isYearly && styles.billingLabelActive]}>
                Yearly
              </Text>
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsBadgeText}>SAVE {savings}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pro Plan */}
        <View style={[styles.planCard, styles.planCardRecommended]}>
          {/* COMING SOON Banner - Overlay on top */}
          <View style={styles.comingSoonBanner}>
            <Text style={styles.comingSoonText}>COMING SOON</Text>
          </View>
          
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
          </View>
          
          <View style={styles.planHeader}>
            <View style={styles.planInfo}>
              <Text style={styles.planName}>{plans.pro.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>
                  €{isYearly ? (plans.pro.yearlyPrice / 12).toFixed(2) : plans.pro.monthlyPrice.toFixed(2)}
                </Text>
                <Text style={styles.pricePeriod}>/month</Text>
              </View>
            </View>
            <View style={[styles.radioButton, selectedPlan === 'pro' && styles.radioButtonSelected]}>
              {selectedPlan === 'pro' && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </View>

          <View style={styles.featuresContainer}>
            {plans.pro.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name="checkmark" size={12} color={theme.colors.white} />
                </View>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <Pressable style={styles.upgradeButton} onPress={handleUpgrade}>
            <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
          </Pressable>
          
          <Text style={styles.trialText}>7-day free trial • Cancel anytime</Text>
        </View>

        {/* Free Plan */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={styles.planInfo}>
              <Text style={styles.planName}>{plans.free.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={[styles.price, { color: theme.colors.neutral[600] }]}>
                  €{plans.free.monthlyPrice}
                </Text>
                <Text style={styles.pricePeriod}>/month</Text>
              </View>
            </View>
            <View style={[styles.radioButton, selectedPlan === 'free' && styles.radioButtonSelected]}>
              {selectedPlan === 'free' && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </View>

          <View style={styles.featuresContainer}>
            {plans.free.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name="checkmark" size={12} color={theme.colors.white} />
                </View>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <View style={styles.currentPlanButton}>
            <Text style={styles.currentPlanButtonText}>Current Plan</Text>
          </View>
        </View>
      </ScrollView>

      <ModalProNotice
        visible={showProNotice}
        onClose={() => setShowProNotice(false)}
        onViewPlans={() => {
          setShowProNotice(false);
          // Navigate to plans page - this is already the plans page
          // So we can just close the modal or show a message
          Alert.alert('Plans', 'You are already on the plans page!');
        }}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[900],
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: theme.spacing['3xl'],
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    ...theme.shadows.md,
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing['2xl'],
    textAlign: 'center',
  },
  billingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
  },
  billingLabel: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.neutral[600],
  },
  billingLabelActive: {
    color: theme.colors.systemBlue,
  },
  toggle: {
    width: 44,
    height: 24,
    backgroundColor: theme.colors.neutral[300],
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: theme.colors.systemBlue,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    ...theme.shadows.sm,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  yearlyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  savingsBadge: {
    backgroundColor: theme.colors.success[500],
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
  },
  savingsBadgeText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  planCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    position: 'relative',
    ...theme.shadows.sm,
  },
  planCardRecommended: {
    borderWidth: 2,
    borderColor: theme.colors.systemBlue,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: theme.colors.systemBlue,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  recommendedBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.xs,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.systemBlue,
  },
  pricePeriod: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.normal,
    color: theme.colors.neutral[600],
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.systemBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: theme.colors.systemBlue,
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.white,
  },
  featuresContainer: {
    marginBottom: theme.spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  featureIcon: {
    width: 16,
    height: 16,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.success[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.neutral[700],
  },
  upgradeButton: {
    backgroundColor: theme.colors.systemBlue,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  upgradeButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  trialText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.neutral[600],
    textAlign: 'center',
  },
  currentPlanButton: {
    backgroundColor: theme.colors.neutral[100],
    borderColor: theme.colors.neutral[200],
    borderWidth: 2,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  currentPlanButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[600],
  },
  comingSoonBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.warning[500],
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    transform: [{ rotate: '0deg' }],
    zIndex: 1,
    ...theme.shadows.lg,
  },
  comingSoonText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    textAlign: 'center',
    letterSpacing: 1,
  },
});