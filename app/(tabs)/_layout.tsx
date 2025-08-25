import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { ChartBar as BarChart3, Shield, Bell, User } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopWidth: 0,
          borderRadius: theme.borderRadius.lg,
          margin: theme.spacing.lg,
          marginBottom: theme.spacing.xl,
          height: 80,
          paddingBottom: theme.spacing.sm, // Reduced from md to sm (16px to 8px) to move icons down
          paddingTop: theme.spacing.xl, // Increased from md to xl (12px to 20px) to move icons down
          ...theme.shadows.md,
        },
        tabBarActiveTintColor: theme.colors.white,
        tabBarInactiveTintColor: theme.colors.neutral[500],
        tabBarShowLabel: false, // Remove text labels
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              backgroundColor: focused ? theme.colors.primary[600] : theme.colors.neutral[100],
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.sm,
              ...focused ? theme.shadows.sm : {},
            }}>
              <BarChart3 
                size={34} 
                color={focused ? theme.colors.white : theme.colors.neutral[500]} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="devices"
        options={{
          title: 'Devices',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              backgroundColor: focused ? theme.colors.primary[600] : theme.colors.neutral[100],
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.sm,
              ...focused ? theme.shadows.sm : {},
            }}>
              <Shield 
                size={34} 
                color={focused ? theme.colors.white : theme.colors.neutral[500]} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              backgroundColor: focused ? theme.colors.primary[600] : theme.colors.neutral[100],
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.sm,
              ...focused ? theme.shadows.sm : {},
            }}>
              <Bell 
                size={34} 
                color={focused ? theme.colors.white : theme.colors.neutral[500]} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              backgroundColor: focused ? theme.colors.primary[600] : theme.colors.neutral[100],
              borderRadius: theme.borderRadius.md, // Changed from 50 to match other tabs
              padding: theme.spacing.sm,
              ...focused ? theme.shadows.sm : {},
            }}>
              <User 
                size={34} 
                color={focused ? theme.colors.white : theme.colors.neutral[500]} 
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}