import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Menu } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { NotificationItem } from '@/src/components/NotificationItem';
import { SafeAreaView } from 'react-native-safe-area-context';

const mockAlerts = [
  {
    id: '1',
    type: 'warning' as const,
    title: 'Warranty Expiring Soon',
    message: 'MacBook Pro warranty expires in 15 days',
    timestamp: '2 hours ago',
    icon: '⚠️',
  },
  {
    id: '2',
    type: 'success' as const,
    title: 'Device Added Successfully',
    message: 'iPhone 15 Pro has been added to your devices',
    timestamp: '1 day ago',
    icon: '✅',
  },
  {
    id: '3',
    type: 'error' as const,
    title: 'Warranty Expired',
    message: 'iPad Air warranty has expired',
    timestamp: '3 days ago',
    icon: '❌',
  },
  {
    id: '4',
    type: 'info' as const,
    title: 'Email Receipt Found',
    message: 'New Amazon receipt detected in your email',
    timestamp: '1 week ago',
    icon: '🔧',
  },
];

export default function AlertsScreen() {
  const [selectedTab, setSelectedTab] = useState('Active');
  
  const tabs = ['Active', 'All'];
  const activeAlerts = mockAlerts.filter(alert => alert.type === 'warning' || alert.type === 'error');
  const displayAlerts = selectedTab === 'Active' ? activeAlerts : mockAlerts;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        <View style={styles.menuButton}>
          <Menu size={20} color={theme.colors.white} />
        </View>
      </View>

      {/* Tab Filters */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <View
            key={tab}
            style={[
              styles.tab,
              selectedTab === tab && styles.tabActive
            ]}
          >
            <Text style={[
              styles.tabText,
              selectedTab === tab && styles.tabTextActive
            ]}>
              {tab} ({tab === 'Active' ? activeAlerts.length : mockAlerts.length})
            </Text>
          </View>
        ))}
      </View>

      {/* Alerts List */}
      <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false}>
        {displayAlerts.map((alert) => (
          <NotificationItem
            key={alert.id}
            title={alert.title}
            message={alert.message}
            timestamp={alert.timestamp}
            type={alert.type}
          />
        ))}
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
    marginBottom: theme.spacing['2xl'],
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
  tabContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing['2xl'],
  },
  tab: {
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  tabActive: {
    backgroundColor: theme.colors.primary[600],
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[600],
    fontWeight: theme.fontWeight.medium,
  },
  tabTextActive: {
    color: theme.colors.white,
  },
  alertsList: {
    flex: 1,
    marginBottom: 100, // Space for tab bar
  },
});