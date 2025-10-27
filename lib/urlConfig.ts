import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const getOAuthRedirectUrl = (): string => {
  if (Platform.OS === 'web') {
    // Web environment
    if (__DEV__) {
      // Development
      const anyConstants = Constants as any;
      const hostUri: string | undefined = anyConstants?.expoConfig?.hostUri || anyConstants?.manifest?.hostUri;
      const [host, portFromHost] = (hostUri ?? '').split(':');
      const localhost = host || 'localhost';
      const port = portFromHost ? parseInt(portFromHost, 10) : 8081;
      return `http://${localhost}:${port}/auth-callback`;
    } else {
      // Production web
      return `${window.location.origin}/auth-callback`;
    }
  } else {
    // Mobile environment - use deep link
    return 'warrilo://auth-callback';
  }
};

export const getBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    if (__DEV__) {
      const anyConstants = Constants as any;
      const hostUri: string | undefined = anyConstants?.expoConfig?.hostUri || anyConstants?.manifest?.hostUri;
      const [host, portFromHost] = (hostUri ?? '').split(':');
      const localhost = host || 'localhost';
      const port = portFromHost ? parseInt(portFromHost, 10) : 8081;
      return `http://${localhost}:${port}`;
    } else {
      return window.location.origin;
    }
  } else {
    return 'warrilo://';
  }
};



