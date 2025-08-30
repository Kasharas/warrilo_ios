import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { Search, Bell, Filter, AlertTriangle, CheckCircle, Clock } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { iosColors, iosFonts, iosSpacing, iosRadius } from '@/src/styles/iosDesignSystem';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function AlertsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Mock data - no alerts yet
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate refresh delay
    setTimeout(() => setLoading(false), 1000);
  };

  const filters = [
    { label: 'All', count: alerts.length },
    { label: 'Expired warranty', count: alerts.filter(a => a.type === 'expired_warranty').length },
    { label: 'Expire soon', count: alerts.filter(a => a.type === 'expire_soon').length },
  ];

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    if (selectedFilter === 'Expired warranty') {
      matchesFilter = alert.type === 'expired_warranty';
    } else if (selectedFilter === 'Expire soon') {
      matchesFilter = alert.type === 'expire_soon';
    }
    // 'All' filter matches everything
    
    return matchesSearch && matchesFilter;
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'expired_warranty':
        return <AlertTriangle size={20} color={theme.colors.error[500]} />;
      case 'expire_soon':
        return <Clock size={20} color={theme.colors.warning[500]} />;
      default:
        return <Bell size={20} color={theme.colors.neutral[500]} />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'expired_warranty':
        return theme.colors.error[100];
      case 'expire_soon':
        return theme.colors.warning[100];
      default:
        return theme.colors.neutral[100];
    }
  };

  // Show loading only when initially loading and no alerts
  if (loading && alerts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading alerts...</Text>
      </View>
    );
  }

  // Show error only when there's an error and no alerts
  if (error && alerts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{error}</Text>
        <Text style={styles.emptySubtext}>Please try again later.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts & Notifications</Text>
        <View style={styles.headerRight}>
          <Pressable style={styles.menuButton} onPress={() => router.push({
            pathname: '/settings',
            params: { fromScreen: 'alerts' }
          })}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </Pressable>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[
        styles.searchContainer,
        isSearchFocused && styles.searchContainerFocused
      ]}>
        <Search size={20} color={theme.colors.neutral[400]} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search alerts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.neutral[400]}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          renderItem={({ item }) => (
            <Pressable
              key={item.label}
              style={[
                styles.filterChip,
                selectedFilter === item.label && styles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(item.label)}
            >
              <Text style={[
                styles.filterChipText,
                selectedFilter === item.label && styles.filterChipTextActive
              ]}>
                {item.label} ({item.count})
              </Text>
            </Pressable>
          )}
          keyExtractor={(item) => item.label}
          contentContainerStyle={styles.filtersContent}
          snapToAlignment="start"
          decelerationRate="fast"
          bounces={false}
        />
      </View>

      {/* Content Area - Show alerts list or empty state */}
      {filteredAlerts.length === 0 ? (
        // Empty state within the main layout
        <View style={styles.emptyContainer}>
          <Bell size={64} color={theme.colors.neutral[300]} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No alerts found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery || selectedFilter !== 'All' 
              ? 'Try adjusting your search or filters' 
              : 'You\'re all caught up! No alerts at the moment.'}
          </Text>
        </View>
      ) : (
        // Alerts List
        <FlatList 
          data={filteredAlerts}
          renderItem={({ item }) => (
            <View key={item.id} style={[styles.alertCard, { backgroundColor: getAlertColor(item.type) }]}>
              <View style={styles.alertHeader}>
                {getAlertIcon(item.type)}
                <Text style={styles.alertType}>{item.type.replace('_', ' ').toUpperCase()}</Text>
                <Text style={styles.alertDate}>{item.date}</Text>
              </View>
              <Text style={styles.alertTitle}>{item.title}</Text>
              <Text style={styles.alertMessage}>{item.message}</Text>
              {item.action && (
                <Pressable style={styles.alertAction}>
                  <Text style={styles.alertActionText}>{item.action}</Text>
                </Pressable>
              )}
            </View>
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.alertsListContent}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
              tintColor={'#007AFF'}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    height: '100%',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    marginHorizontal: 0,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    ...theme.shadows.sm,
  },
  searchContainerFocused: {
    borderWidth: 2,
    borderColor: '#000000',
  },
  searchIcon: {
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[900],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 0,
    borderColor: 'transparent',
    outlineStyle: 'none',
  },
  filtersContainer: {
    marginBottom: theme.spacing.lg,
    marginTop: -4,
    height: 40, // Fixed height for consistent layout
    justifyContent: 'center', // Center filters vertically
    // No padding or margins - let it fill the full container width
  },
  filtersContent: {
    gap: theme.spacing.sm,
    paddingHorizontal: 0,
  },
  filterChip: {
    backgroundColor: 'white',
    borderRadius: 18,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    height: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  filterChipText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  alertsListContent: {
    paddingBottom: 100,
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
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
    flex: 1,
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: theme.spacing.md,
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
  alertCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  alertType: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[700],
    flex: 1,
  },
  alertDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.neutral[500],
  },
  alertTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.sm,
  },
  alertMessage: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  alertAction: {
            backgroundColor: '#007AFF',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
  },
  alertActionText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
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
});