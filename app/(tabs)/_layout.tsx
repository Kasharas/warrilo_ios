import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/src/styles/theme';

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.white }}>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopWidth: 0,
          borderRadius: 16,
          margin: 20,
          marginBottom: 20,
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
          shadowColor: theme.colors.neutral[900],
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 5,
        },
        tabBarActiveTintColor: theme.colors.systemBlue,
        tabBarInactiveTintColor: theme.colors.neutral[500],
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
                  tabBarIcon: ({ color, focused }) => (
          <View style={{
            width: 56,
            height: 56,
            backgroundColor: focused ? theme.colors.systemBlue : theme.colors.white,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 17,
            shadowColor: focused ? theme.colors.systemBlue : theme.colors.neutral[900],
            shadowOffset: { width: 0, height: focused ? 4 : 2 },
            shadowOpacity: focused ? 0.4 : 0.15,
            shadowRadius: focused ? 12 : 8,
            elevation: focused ? 8 : 4,
            borderWidth: 1,
            borderColor: focused ? theme.colors.systemBlue : theme.colors.neutral[200],
          }}>
            <Ionicons name="bar-chart" size={40} color={focused ? theme.colors.white : theme.colors.neutral[500]} />
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
              width: 56,
              height: 56,
              backgroundColor: focused ? theme.colors.systemBlue : theme.colors.white,
              borderRadius: 14,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 17,
              shadowColor: focused ? theme.colors.systemBlue : theme.colors.neutral[900],
              shadowOffset: { width: 0, height: focused ? 4 : 2 },
              shadowOpacity: focused ? 0.4 : 0.15,
              shadowRadius: focused ? 12 : 8,
              elevation: focused ? 8 : 4,
              borderWidth: 1,
              borderColor: focused ? theme.colors.systemBlue : theme.colors.neutral[200],
            }}>
              <Ionicons name="shield" size={40} color={focused ? theme.colors.white : theme.colors.neutral[500]} />
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
              width: 56,
              height: 56,
              backgroundColor: focused ? theme.colors.systemBlue : theme.colors.white,
              borderRadius: 14,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 17,
              shadowColor: focused ? theme.colors.systemBlue : theme.colors.neutral[900],
              shadowOffset: { width: 0, height: focused ? 4 : 2 },
              shadowOpacity: focused ? 0.4 : 0.15,
              shadowRadius: focused ? 12 : 8,
              elevation: focused ? 8 : 4,
              borderWidth: 1,
              borderColor: focused ? theme.colors.systemBlue : theme.colors.neutral[200],
            }}>
              <Ionicons name="notifications" size={40} color={focused ? theme.colors.white : theme.colors.neutral[500]} />
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
              width: 56,
              height: 56,
              backgroundColor: focused ? theme.colors.systemBlue : theme.colors.white,
              borderRadius: 14,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 17,
              shadowColor: focused ? theme.colors.systemBlue : theme.colors.neutral[900],
              shadowOffset: { width: 0, height: focused ? 4 : 2 },
              shadowOpacity: focused ? 0.4 : 0.15,
              shadowRadius: focused ? 12 : 8,
              elevation: focused ? 8 : 4,
              borderWidth: 1,
              borderColor: focused ? theme.colors.systemBlue : theme.colors.neutral[200],
            }}>
              <Ionicons name="person" size={40} color={focused ? theme.colors.white : theme.colors.neutral[500]} />
            </View>
          ),
        }}
      />
    </Tabs>
    </View>
  );
}