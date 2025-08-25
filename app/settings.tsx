import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { ArrowLeft, Users, Mail, CreditCard, Bell, Download, Shield, CircleHelp as HelpCircle, LogOut } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ModalProNotice } from '@/src/components/ModalProNotice';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';

const settingsData = [
  {
    section: 'Premium Features',
    items: [
      { 
        icon: Users, 
        label: 'Family Sharing', 
        isPro: true, 
        toggle: true,
        iconColor: theme.colors.success[500] 
      },
      { 
        icon: Mail, 
        label: 'Email Integration', 
        isPro: true, 
        toggle: true,
        iconColor: theme.colors.secondary[500] 
      },
    ]
  },
  {
    section: 'Account',
    items: [
      { 
        icon: CreditCard, 
        label: 'Subscription & Billing',
        iconColor: theme.colors.success[500] 
      },
    ]
  },
  {
    section: 'Preferences',
    items: [
      { 
        icon: Bell, 
        label: 'Notifications', 
        toggle: true, 
        defaultValue: true,
        iconColor: theme.colors.warning[500] 
      },
      { 
        icon: Download, 
        label: 'Export Data',
        iconColor: theme.colors.neutral[500] 
      },
      { 
        icon: Shield, 
        label: 'Privacy Policy',
        iconColor: theme.colors.neutral[500] 
      },
      { 
        icon: Shield, 
        label: 'Terms of Service',
        iconColor: theme.colors.neutral[500] 
      },
      { 
        icon: HelpCircle, 
        label: 'Help & Support',
        iconColor: theme.colors.neutral[500] 
      },
    ]
  },
  {
    section: 'Account Actions',
    items: [
      { 
        icon: LogOut, 
        label: 'Sign Out', 
        destructive: true,
        iconColor: theme.colors.error[500] 
      },
    ]
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { fromScreen } = useLocalSearchParams();
  const { signOut } = useAuth();
  const { clearData } = useData();
  const [showProModal, setShowProModal] = useState(false);
  const [toggleStates, setToggleStates] = useState<{ [key: string]: boolean }>({
    'Notifications': true,
    'Family Sharing': false,
    'Email Integration': false,
  });

  const handleBackPress = () => {
    if (fromScreen === 'devices') {
      router.push('/(tabs)/devices');
    } else if (fromScreen === 'dashboard') {
      router.push('/(tabs)');
    } else {
      router.back();
    }
  };

  const handleItemPress = async (item: any) => {
    if (item.isPro) {
      setShowProModal(true);
      return;
    }

    if (item.label === 'Sign Out') {
      try {
        console.log('Settings: Starting sign out process...');
        
        // Clear data first
        console.log('Settings: Clearing DataContext...');
        await clearData();
        console.log('Settings: DataContext cleared successfully');
        
        // Then sign out
        console.log('Settings: Calling AuthContext signOut...');
        await signOut();
        console.log('Settings: AuthContext signOut completed successfully');
        
        // After successful sign out, navigate to welcome screen
        console.log('Settings: Navigating to welcome screen...');
        router.replace('/welcome');
        console.log('Settings: Navigation completed');
      } catch (error) {
        console.error('Settings: Error during sign out:', error);
        Alert.alert('Error', 'Failed to sign out. Please try again.');
      }
      return;
    }

    // Handle other settings items
    console.log('Settings item pressed:', item.label);
  };

  const handleToggleChange = (label: string, value: boolean) => {
    const item = settingsData
      .flatMap(section => section.items)
      .find(item => item.label === label);
    
    if (item?.isPro) {
      setShowProModal(true);
      return;
    }

    setToggleStates(prev => ({ ...prev, [label]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleBackPress}>
          <ArrowLeft size={24} color={theme.colors.neutral[900]} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {settingsData.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <View style={styles.settingsGroup}>
              {section.items.map((item, itemIndex) => (
                <Pressable
                  key={itemIndex}
                  style={[
                    styles.settingsItem,
                    itemIndex === section.items.length - 1 && styles.settingsItemLast
                  ]}
                  onPress={() => handleItemPress(item)}
                >
                  <View style={styles.settingsLeft}>
                    <View style={[styles.settingsIcon, { backgroundColor: item.iconColor }]}>
                      <item.icon size={16} color={theme.colors.white} />
                    </View>
                    <Text style={[
                      styles.settingsLabel,
                      item.destructive && { color: theme.colors.error[500] }
                    ]}>
                      {item.label}
                    </Text>
                  </View>
                  
                  <View style={styles.settingsRight}>
                    {item.isPro && (
                      <View style={styles.proBadge}>
                        <Text style={styles.proBadgeText}>PRO</Text>
                      </View>
                    )}
                    {item.toggle && (
                      <Switch
                        value={toggleStates[item.label] || false}
                        onValueChange={(value) => handleToggleChange(item.label, value)}
                        trackColor={{
                          false: theme.colors.neutral[300],
                          true: theme.colors.primary[600]
                        }}
                        thumbColor={theme.colors.white}
                      />
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <ModalProNotice
        visible={showProModal}
        onClose={() => setShowProModal(false)}
        onViewPlans={() => {
          setShowProModal(false);
          router.push('/plan-selection');
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
  section: {
    marginBottom: theme.spacing['2xl'],
  },
  settingsGroup: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  settingsItemLast: {
    borderBottomWidth: 0,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    flex: 1,
  },
  settingsIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsLabel: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.neutral[900],
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  proBadge: {
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  proBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.success[500],
  },
});