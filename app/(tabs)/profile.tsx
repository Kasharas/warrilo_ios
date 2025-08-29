import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { LogOut, Users } from 'lucide-react-native';
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
    setShowSignOutModal(true);
  };

  const performSignOut = async () => {
    try {
      console.log('🔄 Profile: Starting sign out process...');
      setIsSigningOut(true);
      setShowSignOutModal(false);
      
      await signOut();
      console.log('✅ Profile: Sign out completed successfully');
      
      router.replace('/welcome');
      
    } catch (error) {
      console.error('❌ Profile: Sign out error:', error);
      setIsSigningOut(false);
      
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerRight}>
            <Pressable style={styles.menuButton} onPress={() => router.push('/settings')}>
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
            </Pressable>
          </View>
        </View>
        
        {/* User Info Section - Centered */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.user_metadata?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 
               user?.email?.split('@')[0].substring(0, 2).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.user_metadata?.full_name || user?.email || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.planContainer}>
            <View style={styles.planBadge}>
              <Text style={styles.planText}>PRO PLAN</Text>
            </View>
            <Text style={styles.planPrice}>€1.99/month</Text>
          </View>
          <Pressable style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </Pressable>
        </View>
        
        {/* Account Overview Card */}
        <View style={styles.overviewCard}>
          <Text style={styles.cardTitle}>Account Overview</Text>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Member Since</Text>
            <Text style={styles.overviewValue}>August 2025</Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Total Devices</Text>
            <Text style={styles.overviewValue}>12 devices</Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Active Warranties</Text>
            <Text style={[styles.overviewValue, { color: iosColors.systemGreen }]}>7 active</Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Total Value Protected</Text>
            <Text style={[styles.overviewValue, { color: iosColors.systemBlue }]}>$4,250</Text>
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
    backgroundColor: 'white',
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: iosSpacing.xxxl,
    marginTop: iosSpacing.lg,
  },
  headerTitle: {
    fontSize: iosFonts.largeTitle,
    fontWeight: iosFonts.bold,
    color: iosColors.label,
    fontFamily: iosFonts.system,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosSpacing.md,
  },
  menuButton: {
    width: 32,
    height: 32,
    backgroundColor: iosColors.systemBlue,
    borderRadius: iosRadius.md,
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
  userSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 0,
  },
  avatar: {
    width: 100,
    height: 100,
    backgroundColor: '#2563eb',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '600',
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    color: '#111827',
  },
  userEmail: {
    color: '#6b7280',
    fontSize: 16,
    marginBottom: 16,
  },
  planContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  planBadge: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  planText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  planPrice: {
    color: '#6b7280',
    fontSize: 14,
  },
  editProfileButton: {
    backgroundColor: '#f9fafb',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  editProfileText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  overviewCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#111827',
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  overviewLabel: {
    color: '#6b7280',
    fontSize: 16,
  },
  overviewValue: {
    fontWeight: '500',
    fontSize: 16,
    color: '#111827',
  },
  familyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  familyMember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  familyAvatar: {
    width: 40,
    height: 40,
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  familyAvatarText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  familyInfo: {
    flex: 1,
  },
  familyName: {
    fontWeight: '500',
    marginBottom: 2,
    fontSize: 16,
    color: '#111827',
  },
  familyEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  inviteButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutSection: {
    marginTop: 16,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  signOutButtonDisabled: {
    opacity: 0.7,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    width: '45%',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
});