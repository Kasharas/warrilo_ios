import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TriangleAlert as AlertTriangle, Eye, Clock } from 'lucide-react-native';
import { theme } from '../../src/styles/theme';
import { SummaryCard } from '../../src/components/SummaryCard';
import { DeviceCard } from '../../src/components/DeviceCard';
import { FabButton } from '../../src/components/FabButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useData } from '../../contexts/DataContext';
import { supabase } from '../../lib/supabaseClient';

export default function DashboardScreen() {
  const router = useRouter();
  const { devices, totalValue, deviceCount, refreshData } = useData();
  const [activeWarranties, setActiveWarranties] = useState(0);
  const [expiringWarranties, setExpiringWarranties] = useState(0);

  // Show all devices, not just recent ones
  const allDevices = devices;

  // Fetch warranty data
  useEffect(() => {
    const fetchWarrantyData = async () => {
      try {
        // Get all warranties for the user's devices
        const deviceIds = devices.map(d => d.id);
        if (deviceIds.length === 0) return;

        const { data: warranties, error } = await supabase
          .from('warranties')
          .select('*')
          .in('device_id', deviceIds);

        if (!error && warranties) {
          const today = new Date();
          const active = warranties.filter(w => new Date(w.end_date) > today).length;
          const expiring = warranties.filter(w => {
            const endDate = new Date(w.end_date);
            const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysRemaining <= 30 && daysRemaining > 0;
          }).length;

          setActiveWarranties(active);
          setExpiringWarranties(expiring);
        }
      } catch (error) {
        console.error('Error fetching warranty data:', error);
      }
    };

    fetchWarrantyData();
  }, [devices]);

  const handleDevicePress = (deviceId: string) => {
    router.push(`/device-details?id=${deviceId}`);
  };

  const handleRefresh = () => {
    refreshData();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
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

        {/* Summary Card */}
        <SummaryCard
          title="Total Items Value"
          value={`$${totalValue.toLocaleString()}`}
          subtitle={`${deviceCount} items`}
        />
        
        {/* Warranty Summary Card */}
        <View style={styles.warrantySummaryCard}>
          <Text style={styles.warrantySummaryTitle}>Warranty Status</Text>
          <View style={styles.warrantySummaryContent}>
            <View style={styles.warrantySummaryItem}>
              <Text style={styles.warrantySummaryNumber}>{activeWarranties}</Text>
              <Text style={styles.warrantySummaryLabel}>Active</Text>
            </View>
            <View style={styles.warrantySummaryItem}>
              <Text style={[styles.warrantySummaryNumber, { color: theme.colors.warning[600] }]}>
                {expiringWarranties}
              </Text>
              <Text style={styles.warrantySummaryLabel}>Expiring Soon</Text>
            </View>
          </View>
        </View>

        {/* Warranty Alert */}
        {expiringWarranties > 0 && (
          <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <AlertTriangle size={20} color={theme.colors.warning[600]} />
              <Text style={styles.alertTitle}>Warranty Expiring Soon</Text>
            </View>
            <Text style={styles.alertMessage}>
              {expiringWarranties === 1 
                ? '1 warranty expires in the next 30 days'
                : `${expiringWarranties} warranties expire in the next 30 days`
              }
            </Text>
            <View style={styles.alertActions}>
              <View style={styles.alertButton}>
                <Eye size={16} color={theme.colors.white} />
                <Text style={styles.alertButtonText}>View Details</Text>
              </View>
              <View style={[styles.alertButton, styles.alertButtonSecondary]}>
                <Clock size={16} color={theme.colors.warning[600]} />
                <Text style={[styles.alertButtonText, styles.alertButtonSecondaryText]}>
                  Remind Later
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* All Items */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Items ({deviceCount})</Text>
          <Pressable onPress={handleRefresh}>
            <Text style={styles.viewAllText}>Refresh</Text>
          </Pressable>
        </View>
        
        {devices.length > 4 && (
          <Text style={styles.scrollHint}>Scroll down to see all items</Text>
        )}

        {devices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items yet</Text>
            <Text style={styles.emptySubtext}>Add your first item to get started</Text>
          </View>
        ) : (
          <View style={styles.deviceGrid}>
            {allDevices.filter(device => device && device.id && device.name).map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onPress={() => handleDevicePress(device.id)}
                compact
              />
            ))}
          </View>
        )}
      </ScrollView>

      <FabButton onPress={() => router.push('/add-device')} />
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
  menuLine: {
    width: 16,
    height: 2,
    backgroundColor: theme.colors.white,
    borderRadius: 1,
    marginVertical: 1,
    opacity: 0.9,
  },
  alertCard: {
    backgroundColor: '#fef3c7',
    borderColor: theme.colors.warning[500],
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
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
    gap: theme.spacing.lg,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 120, // Space for FAB and tab bar
    paddingBottom: theme.spacing.xl, // Extra padding for better scrolling
    minHeight: 300, // Ensure minimum height for proper wrapping
    width: '100%', // Ensure full width
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  loadingText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[500],
    textAlign: 'center',
  },
  scrollHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[500],
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    fontStyle: 'italic',
  },
  lastUpdatedContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  lastUpdatedText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.neutral[500],
    fontStyle: 'italic',
  },
  syncStatusText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.success[600],
    fontWeight: theme.fontWeight.medium,
    marginTop: theme.spacing.xs,
  },
  warrantySummaryCard: {
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  warrantySummaryTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.md,
  },
  warrantySummaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  warrantySummaryItem: {
    alignItems: 'center',
  },
  warrantySummaryNumber: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[900],
  },
  warrantySummaryLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[600],
    marginTop: theme.spacing.xs,
  },

});