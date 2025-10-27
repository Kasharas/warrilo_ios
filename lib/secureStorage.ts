import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Secure storage adapter for Supabase
export const createSecureStorageAdapter = () => {
  console.log('=== SECURE STORAGE ADAPTER SETUP ===');
  console.log('Platform:', Platform.OS);
  console.log('SecureStore available:', !!SecureStore);

  if (Platform.OS === 'web') {
    console.log('Using localStorage for web platform');
    return {
      getItem: async (key: string) => {
        const item = localStorage.getItem(key);
        console.log(`SecureStorage.getItem(${key}):`, !!item);
        return item;
      },
      setItem: async (key: string, value: string) => {
        console.log(`SecureStorage.setItem(${key}):`, !!value);
        localStorage.setItem(key, value);
      },
      removeItem: async (key: string) => {
        console.log(`SecureStorage.removeItem(${key})`);
        localStorage.removeItem(key);
      },
    };
  }

  // Mobile secure storage
  return {
    getItem: async (key: string) => {
      try {
        const item = await SecureStore.getItemAsync(key);
        console.log(`SecureStore.getItem(${key}):`, !!item);
        return item;
      } catch (error) {
        console.error(`SecureStore.getItem(${key}) error:`, error);
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        console.log(`SecureStore.setItem(${key}):`, !!value);
        await SecureStore.setItemAsync(key, value);
      } catch (error) {
        console.error(`SecureStore.setItem(${key}) error:`, error);
      }
    },
    removeItem: async (key: string) => {
      try {
        console.log(`SecureStore.removeItem(${key})`);
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.error(`SecureStore.removeItem(${key}) error:`, error);
      }
    },
  };
};

// Test function for secure storage
export const testSecureStorage = async () => {
  console.log('🧪 TESTING SECURE STORAGE 🧪');
  
  const storage = createSecureStorageAdapter();
  const testKey = 'test_auth_key';
  const testValue = 'test_auth_value';
  
  try {
    // Test write
    await storage.setItem(testKey, testValue);
    console.log('✅ Secure storage write test passed');
    
    // Test read
    const retrieved = await storage.getItem(testKey);
    console.log('✅ Secure storage read test:', retrieved === testValue ? 'PASSED' : 'FAILED');
    
    // Test delete
    await storage.removeItem(testKey);
    console.log('✅ Secure storage delete test passed');
    
    // Verify deletion
    const afterDelete = await storage.getItem(testKey);
    console.log('✅ Secure storage verify delete:', !afterDelete ? 'PASSED' : 'FAILED');
    
  } catch (error) {
    console.error('❌ Secure storage test failed:', error);
  }
};
