import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Menu, CreditCard as Edit } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();

  const accountStats = [
    { label: 'Member Since', value: 'August 2025' },
    { label: 'Total Devices', value: '12 devices' },
    { label: 'Active Warranties', value: '7 active' },
    { label: 'Total Value Protected', value: '$4,250' },
  ];

  const familyMembers = [
    { name: 'Sarah Miller', email: 'sarah.m@email.com', initials: 'SM' },
    { name: 'Mike Doe', email: 'mike.d@email.com', initials: 'MD' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.menuButton}>
            <Menu size={20} color={theme.colors.white} />
          </View>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <Text style={styles.userName}>John Doe</Text>
          <Text style={styles.userEmail}>john.doe@email.com</Text>
          
          <View style={styles.planBadgeContainer}>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>PRO PLAN</Text>
            </View>
            <Text style={styles.planPrice}>€1.99/month</Text>
          </View>

          <View style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </View>
        </View>

        {/* Account Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Overview</Text>
          {accountStats.map((stat, index) => (
            <View key={index} style={styles.statRow}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={[
                styles.statValue,
                stat.label === 'Active Warranties' && { color: theme.colors.success[500] },
                stat.label === 'Total Value Protected' && { color: theme.colors.primary[600] },
              ]}>
                {stat.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Family Sharing */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Family Sharing</Text>
          {familyMembers.map((member, index) => (
            <View key={index} style={styles.memberRow}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>{member.initials}</Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
              </View>
            </View>
          ))}
          
          <View style={styles.inviteButton}>
            <Text style={styles.inviteButtonText}>Invite Family Member</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: 100, // Space for tab bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing['3xl'],
    marginTop: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[900],
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: theme.spacing['3xl'],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  avatarText: {
    fontSize: theme.fontSize['4xl'],
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  userName: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.sm,
  },
  userEmail: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing.lg,
  },
  planBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing['2xl'],
  },
  planBadge: {
    backgroundColor: theme.colors.success[500],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  planBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  planPrice: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[600],
  },
  editButton: {
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
  },
  editButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary[600],
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing['2xl'],
    ...theme.shadows.sm,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.xl,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  statLabel: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
  },
  statValue: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.neutral[900],
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[600],
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.neutral[900],
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[600],
  },
  inviteButton: {
    borderColor: theme.colors.primary[600],
    borderWidth: 2,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  inviteButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary[600],
  },
});