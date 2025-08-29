import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert, Platform, Modal } from 'react-native';
import { User, Settings, Bell, Shield, CreditCard, HelpCircle, LogOut, ChevronRight, Edit, Users, Calendar, Package, DollarSign } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { iosColors, iosFonts, iosSpacing, iosRadius } from '@/src/styles/iosDesignSystem';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleSignOut = () => {
    console.log('🔘 Profile: Sign out button clicked');
    
    // Show native iOS-style confirmation modal
    setShowSignOutModal(true);
  };

  const performSignOut = async () => {
    try {
      console.log('🔄 Profile: Starting sign out process...');
      setIsSigningOut(true);
      setShowSignOutModal(false);
      
      await signOut();
      console.log('✅ Profile: Sign out completed successfully');
      
      // Navigate to welcome screen after successful sign out
      router.replace('/welcome');
      
    } catch (error) {
      console.error('❌ Profile: Sign out error:', error);
      setIsSigningOut(false);
      
      // Show error message
      if (Platform.OS === 'web') {
        alert('Failed to sign out. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to sign out. Please try again.');
      }
    }
  };

  const cancelSignOut = () => {
    console.log('❌ Profile: Sign out cancelled');
    setShowSignOutModal(false);
  };

  const profileSections = [
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
          <Pressable style={styles.menuButton} onPress={() => router.push({
            pathname: '/settings',
            params: { fromScreen: 'profile' }
          })}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </Pressable>
        </View>

        {/* User Info Card - iOS Native Style */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.user_metadata?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 
                 user?.email?.split('@')[0].substring(0, 2).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.user_metadata?.full_name || user?.email || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.planBadge}>
                <Text style={styles.planText}>PRO PLAN</Text>
                <Text style={styles.planPrice}>€1.99/month</Text>
              </View>
            </View>
          </View>
          <Pressable style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </Pressable>
        </View>

        {/* Account Overview Card */}
        <View style={styles.overviewCard}>
          <Text style={styles.cardTitle}>Account Overview</Text>
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Calendar size={16} color={iosColors.systemGray} />
              <Text style={styles.overviewLabel}>Member Since</Text>
              <Text style={styles.overviewValue}>August 2025</Text>
            </View>
            <View style={styles.overviewItem}>
              <Package size={16} color={iosColors.systemGray} />
              <Text style={styles.overviewLabel}>Total Devices</Text>
              <Text style={styles.overviewValue}>12 devices</Text>
            </View>
          </View>
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Shield size={16} color={iosColors.systemGreen} />
              <Text style={styles.overviewLabel}>Active Warranties</Text>
              <Text style={[styles.overviewValue, { color: iosColors.systemGreen }]}>7 active</Text>
            </View>
            <View style={styles.overviewItem}>
              <DollarSign size={16} color={iosColors.systemBlue} />
              <Text style={styles.overviewLabel}>Total Value Protected</Text>
              <Text style={[styles.overviewValue, { color: iosColors.systemBlue }]}>$4,250</Text>
            </View>
          </View>
        </View>

        {/* Family Sharing Card */}
        <View style={styles.familyCard}>
          <Text style={styles.cardTitle}>Family Sharing</Text>
          <View style={styles.familyMember}>
            <View style={styles.familyAvatar}>
              <Text style={styles.familyAvatarText}>SM</Text>
            </View>
            <View style={styles.familyInfo}>
              <Text style={styles.familyName}>Sarah Miller</Text>
              <Text style={styles.familyEmail}>sarah.m@email.com</Text>
            </View>
          </View>
          <View style={styles.familyMember}>
            <View style={styles.familyAvatar}>
              <Text style={styles.familyAvatarText}>MD</Text>
            </View>
            <View style={styles.familyInfo}>
              <Text style={styles.familyName}>Mike Doe</Text>
              <Text style={styles.familyEmail}>mike.d@email.com</Text>
            </View>
          </View>
          <Pressable style={styles.inviteButton}>
            <Users size={16} color={iosColors.systemBlue} />
            <Text style={styles.inviteButtonText}>Invite Family Member</Text>
          </Pressable>
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
                <ChevronRight size={20} color={iosColors.systemGray} />
              </Pressable>
            ))}
          </View>
        ))}

        {/* Sign Out Button */}
        <View style={styles.signOutSection}>
          <Pressable 
            style={[
              styles.signOutButton, 
              isSigningOut && styles.signOutButtonDisabled
            ]} 
            onPress={handleSignOut} 
            disabled={isSigningOut}
          >
            <LogOut size={20} color={iosColors.systemRed} />
            <Text style={styles.signOutText}>
              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
            </Text>
          </Pressable>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Warrilo v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Native iOS-style confirmation modal */}
      <Modal
        visible={showSignOutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelSignOut}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>Are you sure you want to sign out?</Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButton} onPress={cancelSignOut}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalButton} onPress={performSignOut}>
                <Text style={styles.modalButtonText}>Sign Out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: iosFonts.title2,
    fontWeight: iosFonts.bold,
    color: iosColors.label,
    fontFamily: iosFonts.system,
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: iosRadius.md,
    backgroundColor: iosColors.systemBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLine: {
    width: 20,
    height: 2,
    backgroundColor: iosColors.systemBackground,
    borderRadius: 1,
    marginVertical: 1,
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
  avatarText: {
    fontSize: iosFonts.title2,
    fontWeight: iosFonts.bold,
    color: iosColors.systemBackground,
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
  planBadge: {
    backgroundColor: iosColors.systemGray + '10', // 10% opacity
    borderRadius: iosRadius.sm,
    paddingVertical: iosSpacing.xs,
    paddingHorizontal: iosSpacing.sm,
    alignSelf: 'flex-start',
  },
  planText: {
    fontSize: iosFonts.caption,
    fontWeight: iosFonts.medium,
    color: iosColors.systemGray,
    fontFamily: iosFonts.system,
  },
  planPrice: {
    fontSize: iosFonts.title3,
    fontWeight: iosFonts.bold,
    color: iosColors.systemGray,
    fontFamily: iosFonts.system,
  },
  editProfileButton: {
    backgroundColor: iosColors.systemBlue + '10', // 10% opacity
    paddingVertical: iosSpacing.md,
    paddingHorizontal: iosSpacing.lg,
    borderRadius: iosRadius.md,
    alignSelf: 'flex-start',
    marginTop: iosSpacing.sm,
  },
  editProfileText: {
    fontSize: iosFonts.body,
    fontWeight: iosFonts.medium,
    color: iosColors.systemBlue,
    fontFamily: iosFonts.system,
  },
  overviewCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  cardTitle: {
    fontSize: iosFonts.title3,
    fontWeight: iosFonts.bold,
    color: iosColors.label,
    marginBottom: iosSpacing.sm,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: iosSpacing.sm,
  },
  overviewItem: {
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: iosFonts.caption,
    color: iosColors.systemGray,
    marginTop: iosSpacing.xs,
  },
  overviewValue: {
    fontSize: iosFonts.title3,
    fontWeight: iosFonts.bold,
    color: iosColors.label,
  },
  familyCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  familyMember: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: iosSpacing.sm,
  },
  familyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: iosColors.systemGray + '20', // 20% opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: iosSpacing.sm,
  },
  familyAvatarText: {
    fontSize: iosFonts.body,
    fontWeight: iosFonts.medium,
    color: iosColors.systemGray,
  },
  familyInfo: {
    flex: 1,
  },
  familyName: {
    fontSize: iosFonts.body,
    fontWeight: iosFonts.medium,
    color: iosColors.label,
  },
  familyEmail: {
    fontSize: iosFonts.caption,
    color: iosColors.systemGray,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: iosColors.systemBlue + '10', // 10% opacity
    paddingVertical: iosSpacing.md,
    paddingHorizontal: iosSpacing.lg,
    borderRadius: iosRadius.md,
    alignSelf: 'flex-start',
  },
  inviteButtonText: {
    fontSize: iosFonts.body,
    fontWeight: iosFonts.medium,
    color: iosColors.systemBlue,
    marginLeft: iosSpacing.sm,
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
    backgroundColor: iosColors.systemRed + '10', // 10% opacity
    padding: iosSpacing.lg,
    borderRadius: iosRadius.md,
    borderWidth: 1,
    borderColor: iosColors.systemRed + '30', // 30% opacity
    gap: iosSpacing.sm,
  },
  signOutButtonDisabled: {
    opacity: 0.7,
  },
  signOutText: {
    fontSize: iosFonts.body,
    fontWeight: iosFonts.medium,
    color: iosColors.systemRed,
    fontFamily: iosFonts.system,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  versionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[400],
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: iosRadius.lg,
    padding: iosSpacing.lg,
    width: '80%',
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  modalTitle: {
    fontSize: iosFonts.title2,
    fontWeight: iosFonts.bold,
    color: iosColors.label,
    marginBottom: iosSpacing.sm,
  },
  modalMessage: {
    fontSize: iosFonts.body,
    color: iosColors.label,
    textAlign: 'center',
    marginBottom: iosSpacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    paddingVertical: iosSpacing.md,
    paddingHorizontal: iosSpacing.lg,
    borderRadius: iosRadius.md,
    backgroundColor: iosColors.systemBlue,
    width: '45%',
  },
  modalButtonText: {
    fontSize: iosFonts.body,
    fontWeight: iosFonts.medium,
    color: iosColors.systemBackground,
    textAlign: 'center',
  },
});