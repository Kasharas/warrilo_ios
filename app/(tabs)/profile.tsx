import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { User, Settings, Bell, Shield, CreditCard, HelpCircle, LogOut, ChevronRight, Edit } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => signOut()
        }
      ]
    );
  };

  const profileSections = [
    {
      title: 'Account',
      items: [
        { 
          icon: <User size={20} color={theme.colors.primary[600]} />, 
          title: 'Personal Information', 
          subtitle: 'Update your profile details',
          onPress: () => router.push('/settings?section=personal')
        },
        { 
          icon: <Shield size={20} color={theme.colors.primary[600]} />, 
          title: 'Security & Privacy', 
          subtitle: 'Password, 2FA, and privacy settings',
          onPress: () => router.push('/settings?section=security')
        },
        { 
          icon: <Bell size={20} color={theme.colors.primary[600]} />, 
          title: 'Notifications', 
          subtitle: 'Manage your notification preferences',
          onPress: () => router.push('/settings?section=notifications')
        }
      ]
    },
    {
      title: 'Preferences',
      items: [
        { 
          icon: <Settings size={20} color={theme.colors.primary[600]} />, 
          title: 'App Settings', 
          subtitle: 'Language, theme, and display options',
          onPress: () => router.push('/settings?section=app')
        },
        { 
          icon: <CreditCard size={20} color={theme.colors.primary[600]} />, 
          title: 'Subscription', 
          subtitle: 'Manage your plan and billing',
          onPress: () => router.push('/settings?section=subscription')
        }
      ]
    },
    {
      title: 'Support',
      items: [
        { 
          icon: <HelpCircle size={20} color={theme.colors.primary[600]} />, 
          title: 'Help & Support', 
          subtitle: 'Get help and contact support',
          onPress: () => router.push('/settings?section=support')
        }
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Pressable style={styles.editButton} onPress={() => router.push('/settings?section=personal')}>
            <Edit size={20} color={theme.colors.primary[600]} />
          </Pressable>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={40} color={theme.colors.white} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.user_metadata?.full_name || user?.email || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <Text style={styles.userStatus}>Active Account</Text>
            </View>
          </View>
        </View>

        {/* Quick Settings */}
        <View style={styles.quickSettings}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Bell size={20} color={theme.colors.neutral[600]} />
              <Text style={styles.settingText}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: theme.colors.neutral[200], true: theme.colors.primary[300] }}
              thumbColor={notificationsEnabled ? theme.colors.primary[600] : theme.colors.neutral[400]}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Shield size={20} color={theme.colors.neutral[600]} />
              <Text style={styles.settingText}>Biometric Login</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: theme.colors.neutral[200], true: theme.colors.primary[300] }}
              thumbColor={biometricEnabled ? theme.colors.primary[600] : theme.colors.neutral[400]}
            />
          </View>
        </View>

        {/* Profile Sections */}
        {profileSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <Pressable
                key={itemIndex}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  {item.icon}
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <ChevronRight size={20} color={theme.colors.neutral[400]} />
              </Pressable>
            ))}
          </View>
        ))}

        {/* Sign Out Button */}
        <View style={styles.signOutSection}>
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={20} color={theme.colors.error[600]} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Warrilo v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[900],
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing.xs,
  },
  userStatus: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.success[600],
    fontWeight: theme.fontWeight.medium,
  },
  quickSettings: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  settingText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[700],
    fontWeight: theme.fontWeight.medium,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[800],
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.xs,
  },
  menuItemSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[500],
  },
  signOutSection: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.error[50],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.error[200],
    gap: theme.spacing.sm,
  },
  signOutText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.error[600],
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  versionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[400],
  },
});