import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Plus, Eye, Clock, Smartphone, Laptop, Watch, Headphones, AlertTriangle } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { FabButton } from '@/src/components/FabButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Mock data - replace with real data later
  const [devices] = useState<any[]>([
    {
      id: '1',
      name: 'iPhone 15 Pro',
      status: 'Active',
      statusColor: 'success',
      iconName: 'Smartphone',
      iconColor: '#8B5CF6'
    },
    {
      id: '2',
      name: 'MacBook Pro',
      status: 'Expiring',
      statusColor: 'warning',
      iconName: 'Laptop',
      iconColor: '#06B6D4'
    },
    {
      id: '3',
      name: 'Apple Watch',
      status: 'Active',
      statusColor: 'success',
      iconName: 'Watch',
      iconColor: '#8B5CF6'
    },
    {
      id: '4',
      name: 'AirPods Pro',
      status: 'Active',
      statusColor: 'success',
      iconName: 'Headphones',
      iconColor: '#10B981'
    }
  ]);
  const [totalValue] = useState(4250);
  const [deviceCount] = useState(7);

  const handleDevicePress = (deviceId: string) => {
    router.push(`/device-details?id=${deviceId}`);
  };

  const handleRefresh = () => {
    setLoading(true);
    // Simulate refresh delay
    setTimeout(() => setLoading(false), 1000);
  };

  const getStatusColor = (statusColor: string) => {
    switch (statusColor) {
      case 'success':
        return theme.colors.success[600];
      case 'warning':
        return theme.colors.warning[600];
      case 'error':
        return theme.colors.error[600];
      default:
        return theme.colors.neutral[600];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary[600]]}
            tintColor={theme.colors.primary[600]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Pressable style={styles.menuButton} onPress={() => router.push('/settings')}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </Pressable>
        </View>

        {/* Total Warranty Value Card */}
        <View style={styles.warrantyValueCard}>
          <Text style={styles.warrantyValueTitle}>Total Warranty Value</Text>
          <Text style={styles.warrantyValueAmount}>${totalValue.toLocaleString()}</Text>
          <Text style={styles.warrantyValueSubtitle}>{deviceCount} active warranties</Text>
        </View>
        
        {/* Warranty Alert */}
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <AlertTriangle size={20} color={theme.colors.warning[600]} />
            <Text style={styles.alertTitle}>Warranty Expiring Soon</Text>
          </View>
          <Text style={styles.alertMessage}>
            Your MacBook Pro warranty expires in 15 days
          </Text>
          <View style={styles.alertActions}>
            <Pressable style={styles.alertButton}>
              <Eye size={16} color={theme.colors.white} />
              <Text style={styles.alertButtonText}>View Details</Text>
            </Pressable>
            <Pressable style={[styles.alertButton, styles.alertButtonSecondary]}>
              <Clock size={16} color={theme.colors.warning[600]} />
              <Text style={[styles.alertButtonText, styles.alertButtonSecondaryText]}>
                Remind Later
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Recent Devices Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Devices</Text>
          <Pressable onPress={() => router.push('/devices')}>
            <Text style={styles.viewAllText}>View All</Text>
          </Pressable>
        </View>
        
        <View style={styles.deviceGrid}>
          {devices.map((device) => {
            const getIconComponent = (iconName: string) => {
              switch (iconName) {
                case 'Smartphone': return Smartphone;
                case 'Laptop': return Laptop;
                case 'Watch': return Watch;
                case 'Headphones': return Headphones;
                default: return Smartphone;
              }
            };
            
            const IconComponent = getIconComponent(device.iconName);
            return (
              <View key={device.id} style={styles.deviceCard}>
                <View style={styles.deviceIconContainer}>
                  <IconComponent size={24} color={device.iconColor} />
                </View>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Text style={[styles.deviceStatus, { color: getStatusColor(device.statusColor) }]}>
                  {device.status}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <FabButton onPress={() => router.push('/add-device')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
  },
  scrollView: {
    flex: 1,
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
  },
  menuLine: {
    width: 20,
    height: 2,
    backgroundColor: theme.colors.white,
    borderRadius: 1,
    marginVertical: 1,
  },
  warrantyValueCard: {
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing['2xl'],
    marginBottom: theme.spacing.lg,
    elevation: 3,
  },
  warrantyValueTitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.white,
    opacity: 0.9,
    marginBottom: theme.spacing.sm,
  },
  warrantyValueAmount: {
    fontSize: theme.fontSize['4xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  warrantyValueSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.8,
  },
  alertCard: {
    backgroundColor: '#fef3c7',
    borderColor: theme.colors.warning[500],
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  alertTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: '#92400e',
    marginLeft: theme.spacing.sm,
  },
  alertMessage: {
    fontSize: theme.fontSize.sm,
    color: '#92400e',
    marginBottom: theme.spacing.md,
  },
  alertActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  alertButton: {
    backgroundColor: theme.colors.warning[500],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  alertButtonSecondary: {
    backgroundColor: 'transparent',
  },
  alertButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
  },
  alertButtonSecondaryText: {
    color: theme.colors.warning[600],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
  },
  viewAllText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.fontWeight.medium,
  },
  deviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
    marginBottom: 120, // Space for FAB and tab bar
    paddingBottom: theme.spacing.xl,
  },
  deviceCard: {
    width: '48%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  deviceName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  deviceStatus: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
});