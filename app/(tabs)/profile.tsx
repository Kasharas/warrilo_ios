import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/src/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useDeviceSync } from '@/src/hooks/useDeviceSync';
import { LocalDevice } from '@/src/lib/localStorage';

// WARRANTY ALERT SYSTEM TEMPORARILY DISABLED TO FIX IMPORT.META ERROR

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { getLocalDevices } = useDeviceSync();
  
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [devices, setDevices] = useState<LocalDevice[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [activeWarranties, setActiveWarranties] = useState(0);

  // Load device data for live statistics
  useEffect(() => {
    if (user) {
      loadDeviceData();
    }
  }, [user]);

  // Debug modal state changes
  useEffect(() => {
    console.log('🔘 Profile: Modal visibility changed:', showSignOutModal);
  }, [showSignOutModal]);

  // Debug loading state changes
  useEffect(() => {
    console.log('🔘 Profile: Sign out loading state changed:', isSigningOut);
  }, [isSigningOut]);

  const loadDeviceData = async () => {
    try {
      const localDevices = await getLocalDevices();
      setDevices(localDevices);
      
      // Calculate total value from devices with valid purchase prices
      const devicesWithValidPrices = localDevices.filter(device => 
        device.purchase_price && typeof device.purchase_price === 'number' && device.purchase_price > 0
      );
      
      const totalPurchaseValue = devicesWithValidPrices.reduce((total, device) => {
        return total + (device.purchase_price || 0);
      }, 0);
      
      setTotalValue(totalPurchaseValue);
      
      // Calculate active warranties (devices with warranty end date in the future)
      const now = new Date();
      const activeWarrantyCount = localDevices.filter(device => {
        if (!device.warranty_end_date) return false;
        const warrantyEnd = new Date(device.warranty_end_date);
        return warrantyEnd > now;
      }).length;
      
      setActiveWarranties(activeWarrantyCount);
      
    } catch (error) {
      console.error('Error loading device data for profile:', error);
    }
  };

  const handleSignOut = () => {
    console.log('🔘 Profile: Sign out button clicked');
    console.log('🔘 Profile: Current user state:', { user: !!user, userId: user?.id });
    console.log('🔘 Profile: Current loading state:', isSigningOut);
    console.log('🔘 Profile: Setting modal to visible');
    setShowSignOutModal(true);
  };

  const performSignOut = async () => {
    try {
      console.log('🔄 Profile: Starting sign out process...');
      console.log('🔄 Profile: Current user before sign out:', { user: !!user, userId: user?.id });
      console.log('🔄 Profile: Setting loading state to true');
      setIsSigningOut(true);
      console.log('🔄 Profile: Closing modal');
      setShowSignOutModal(false);
      
      console.log('🔄 Profile: Calling AuthContext signOut function...');
      await signOut();
      console.log('✅ Profile: Sign out completed successfully');
      console.log('✅ Profile: User after sign out:', { user: !!user, userId: user?.id });
      
      // Navigation will be handled automatically by the auth guard in _layout.tsx
      console.log('✅ Profile: Sign out completed - auth guard will handle navigation');
      
    } catch (error) {
      console.error('❌ Profile: Sign out error:', error);
      console.log('🔄 Profile: Resetting loading state due to error');
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
    console.log('❌ Profile: Closing modal');
    setShowSignOutModal(false);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
            <View style={[styles.planBadge, { backgroundColor: theme.colors.systemRed }]}>
              <Text style={styles.planText}>FREE PLAN</Text>
            </View>
            <Text style={styles.planPrice}>€0/month</Text>
          </View>
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
            <Text style={styles.overviewValue}>{devices.length} devices</Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Active Warranties</Text>
            <Text style={[styles.overviewValue, { color: theme.colors.systemGreen }]}>{activeWarranties} active</Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Total Value Protected</Text>
            <Text style={[styles.overviewValue, { color: theme.colors.systemBlue }]}>{formatCurrency(totalValue)}</Text>
          </View>
        </View>
        
        {/* Family Sharing Card */}
        <View style={styles.familyCard}>
          <Text style={styles.cardTitle}>Family Sharing</Text>
          <Pressable style={styles.inviteButton} onPress={() => router.push('/plan-selection')}>
            <Ionicons name="people" size={16} color={theme.colors.systemBlue} />
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
            onPress={() => {
              console.log('🔘 Profile: Pressable onPress triggered');
              console.log('🔘 Profile: Button disabled state:', isSigningOut);
              handleSignOut();
            }} 
            disabled={isSigningOut}
          >
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
        onRequestClose={() => {
          console.log('🔘 Profile: Modal onRequestClose triggered');
          cancelSignOut();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>Are you sure you want to sign out?</Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButton} onPress={() => {
                console.log('🔘 Profile: Modal Cancel button pressed');
                cancelSignOut();
              }}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalButton} onPress={() => {
                console.log('🔘 Profile: Modal Sign Out button pressed');
                performSignOut();
              }}>
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
    marginBottom: theme.spacing.xxxl,
    marginTop: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.fontSize.largeTitle,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.label,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  menuButton: {
    width: 32,
    height: 32,
    backgroundColor: theme.colors.systemBlue,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLine: {
    width: 20,
    height: 2,
    backgroundColor: theme.colors.systemBackground,
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
    backgroundColor: '#007AFF',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarText: {
    fontSize: theme.fontSize['5xl'],
    fontWeight: '600',
    color: 'white',
  },
  userName: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.neutral[900],
  },
  userEmail: {
    color: theme.colors.neutral[500],
    fontSize: theme.fontSize.base,
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
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
  },
  planPrice: {
    color: theme.colors.neutral[500],
    fontSize: theme.fontSize.sm,
  },
  overviewCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    marginBottom: 20,
    color: theme.colors.neutral[900],
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  overviewLabel: {
    color: theme.colors.neutral[500],
    fontSize: theme.fontSize.base,
  },
  overviewValue: {
    fontWeight: '500',
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[900],
  },
  familyCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    marginHorizontal: 0,
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
    color: theme.colors.neutral[500],
    fontSize: theme.fontSize.base,
    fontWeight: '600',
  },
  familyInfo: {
    flex: 1,
  },
  familyName: {
    fontWeight: '500',
    marginBottom: 2,
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[900],
  },
  familyEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[500],
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.systemBlue,
    borderRadius: 12,
    paddingVertical: theme.spacing.buttonY,
    paddingHorizontal: theme.spacing.buttonX,
    gap: 8,
  },
  inviteButtonText: {
    color: theme.colors.systemBlue,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
  },
  signOutSection: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing['3xl'],
    paddingHorizontal: 0,
  },
  signOutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.systemRed,
    paddingVertical: theme.spacing.buttonY,
    paddingHorizontal: theme.spacing.buttonX,
    borderRadius: theme.borderRadius.md,
    minHeight: 44,
  },
  signOutButtonDisabled: {
    opacity: 0.7,
  },
  signOutText: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: 'white',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[500],
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
    padding: theme.spacing.xl,
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
    backgroundColor: '#007AFF',
    width: '45%',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
});