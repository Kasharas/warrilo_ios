import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Platform } from 'react-native';
import { getOAuthRedirectUrl, getBaseUrl } from '@/lib/urlConfig';
import * as Linking from 'expo-linking';

export const AuthTest = () => {
  const [info, setInfo] = React.useState<any>({});

  React.useEffect(() => {
    const gatherInfo = async () => {
      const redirectUrl = getOAuthRedirectUrl();
      const baseUrl = getBaseUrl();
      const canOpenUrl = await Linking.canOpenURL('warrilo://');
      
      setInfo({
        platform: Platform.OS,
        isDev: __DEV__,
        redirectUrl,
        baseUrl,
        canOpenDeepLink: canOpenUrl,
      });
    };
    
    gatherInfo();
  }, []);

  const testDeepLink = async () => {
    try {
      const url = 'warrilo://auth-callback';
      const canOpen = await Linking.canOpenURL(url);
      console.log('Can open deep link:', canOpen);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Deep link test error:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Auth Configuration Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>Platform:</Text>
        <Text style={styles.value}>{info.platform}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>Development Mode:</Text>
        <Text style={styles.value}>{info.isDev ? 'Yes' : 'No'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>OAuth Redirect URL:</Text>
        <Text style={styles.value}>{info.redirectUrl}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>Base URL:</Text>
        <Text style={styles.value}>{info.baseUrl}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>Deep Link Support:</Text>
        <Text style={styles.value}>{info.canOpenDeepLink ? 'Yes' : 'No'}</Text>
      </View>
      
      {Platform.OS !== 'web' && (
        <TouchableOpacity style={styles.button} onPress={testDeepLink}>
          <Text style={styles.buttonText}>Test Deep Link</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});



