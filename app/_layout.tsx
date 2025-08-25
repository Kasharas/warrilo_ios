import React, { useState, useEffect } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider, preloadData } from '@/contexts/DataContext';
import { View, Text, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [isDataPreloaded, setIsDataPreloaded] = useState(false);
  const [preloadedDevices, setPreloadedDevices] = useState([]);
  const [preloadedTimestamp, setPreloadedTimestamp] = useState(null);

  // Pre-load data from local storage in background
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const { devices, lastUpdated } = await preloadData();
        setPreloadedDevices(devices);
        setPreloadedTimestamp(lastUpdated);
        setIsDataPreloaded(true);
      } catch (error) {
        console.error('Error preloading data:', error);
        setIsDataPreloaded(true); // Continue anyway
      }
    };

    loadInitialData();
  }, []);

  if (!isDataPreloaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <DataProvider 
        preloadedDevices={preloadedDevices}
        preloadedTimestamp={preloadedTimestamp}
      >
        <StatusBar style="auto" />
        <Slot />
      </DataProvider>
    </AuthProvider>
  );
}
