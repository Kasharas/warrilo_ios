import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, Alert, ScrollView } from 'react-native';
import { Shield, Bell, Mail, CreditCard, LogOut, User, Settings as SettingsIcon, Moon, Sun, ArrowLeft, Trash2, FileText, Info } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  
  // Mock settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailReminders, setEmailReminders] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  const handleBackPress = () => {
    router.back();
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: async () => {
          try {
            await signOut();
            router.replace('/login');
          } catch (error) {
            console.error('Error signing out:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        }}
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your devices, warranties, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All Data', style: 'destructive', onPress: () => {
          console.log('Data cleared (mock)');
          Alert.alert('Success', 'All data has been cleared.');
        }}
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Data export functionality would be implemented here.');
  };

  const handleBackupData = () => {
    Alert.alert('Backup Data', 'Data backup functionality would be implemented here.');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Privacy policy would be displayed here.');
  };

  const handleTermsOfService = () => {
    Alert.alert('Terms of Service', 'Terms of service would be displayed here.');
  };

  const handleSupport = () => {
    Alert.alert('Support', 'Support contact information would be displayed here.');
  };

  const handleAbout = () => {
    Alert.alert('About Warrilo', 'App version and information would be displayed here.');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBackPress}>
          <ArrowLeft size={24} color={theme.colors.neutral[900]} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <User size={20} color={theme.colors.systemBlue} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Email</Text>
                <Text style={styles.settingValue}>{user?.email || 'Not signed in'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Shield size={20} color={theme.colors.success[600]} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Account Status</Text>
                <Text style={styles.settingValue}>Active</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Bell size={20} color={theme.colors.warning[600]} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>Get notified about warranty expirations</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
                      trackColor={{ false: theme.colors.neutral[300], true: theme.colors.primary[400] }}
        thumbColor={notificationsEnabled ? theme.colors.systemBlue : theme.colors.neutral[400]}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Mail size={20} color={theme.colors.secondary[600]} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Email Reminders</Text>
                <Text style={styles.settingDescription}>Receive email notifications</Text>
              </View>
            </View>
            <Switch
              value={emailReminders}
              onValueChange={setEmailReminders}
                      trackColor={{ false: theme.colors.neutral[300], true: theme.colors.primary[400] }}
        thumbColor={emailReminders ? theme.colors.systemBlue : theme.colors.neutral[400]}
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                {darkMode ? <Moon size={20} color={theme.colors.neutral[600]} /> : <Sun size={20} color={theme.colors.warning[600]} />}
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Dark Mode</Text>
                <Text style={styles.settingDescription}>Switch between light and dark themes</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
                      trackColor={{ false: theme.colors.neutral[300], true: theme.colors.primary[400] }}
        thumbColor={darkMode ? theme.colors.systemBlue : theme.colors.neutral[400]}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Shield size={20} color={theme.colors.success[600]} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Auto Sync</Text>
                <Text style={styles.settingDescription}>Automatically sync data in background</Text>
              </View>
            </View>
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
                      trackColor={{ false: theme.colors.neutral[300], true: theme.colors.primary[400] }}
        thumbColor={autoSync ? theme.colors.systemBlue : theme.colors.neutral[400]}
            />
          </View>
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <Pressable style={styles.settingRow} onPress={handleExportData}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <CreditCard size={20} color={theme.colors.systemBlue} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Export Data</Text>
                <Text style={styles.settingDescription}>Download your data as CSV</Text>
              </View>
            </View>
            <View style={styles.settingArrow}>
              <Text style={styles.settingArrowText}>›</Text>
            </View>
          </Pressable>

          <Pressable style={styles.settingRow} onPress={handleBackupData}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Shield size={20} color={theme.colors.secondary[600]} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Backup Data</Text>
                <Text style={styles.settingDescription}>Create a backup of your data</Text>
              </View>
            </View>
            <View style={styles.settingArrow}>
              <Text style={styles.settingArrowText}>›</Text>
            </View>
          </Pressable>

          <Pressable style={styles.settingRow} onPress={handleClearData}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Trash2 size={20} color={theme.colors.error[600]} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Clear All Data</Text>
                <Text style={styles.settingDescription}>Permanently delete all your data</Text>
              </View>
            </View>
            <View style={styles.settingArrow}>
              <Text style={styles.settingArrowText}>›</Text>
            </View>
          </Pressable>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <Pressable style={styles.settingRow} onPress={handlePrivacyPolicy}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Shield size={20} color={theme.colors.neutral[600]} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Privacy Policy</Text>
              </View>
            </View>
            <View style={styles.settingArrow}>
              <Text style={styles.settingArrowText}>›</Text>
            </View>
          </Pressable>

          <Pressable style={styles.settingRow} onPress={handleTermsOfService}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <FileText size={20} color={theme.colors.neutral[600]} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Terms of Service</Text>
              </View>
            </View>
            <View style={styles.settingArrow}>
              <Text style={styles.settingArrowText}>›</Text>
            </View>
          </Pressable>

          <Pressable style={styles.settingRow} onPress={handleSupport}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Mail size={20} color={theme.colors.systemBlue} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Contact Support</Text>
              </View>
            </View>
            <View style={styles.settingArrow}>
              <Text style={styles.settingArrowText}>›</Text>
            </View>
          </Pressable>

          <Pressable style={styles.settingRow} onPress={handleAbout}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Info size={20} color={theme.colors.neutral[600]} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>About</Text>
                <Text style={styles.settingDescription}>Version 1.0.0</Text>
              </View>
            </View>
            <View style={styles.settingArrow}>
              <Text style={styles.settingArrowText}>›</Text>
            </View>
          </Pressable>
        </View>

        {/* Sign Out Section */}
        <View style={styles.section}>
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={20} color={theme.colors.error[600]} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[100],
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.neutral[900],
  },
  settingValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[600],
  },
  settingDescription: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.neutral[500],
    marginTop: theme.spacing.xs,
  },
  settingArrow: {
    width: 24,
    alignItems: 'center',
  },
  settingArrowText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.neutral[500],
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.error[50],
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.error[100],
  },
  signOutText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.error[600],
    marginLeft: theme.spacing.sm,
  },
  bottomSpacing: {
    height: theme.spacing['2xl'],
  },
});