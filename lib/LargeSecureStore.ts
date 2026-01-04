import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Custom storage adapter that uses SecureStore on mobile and AsyncStorage on web
// It also logs operations for debugging
export const LargeSecureStore = {
    getItem: async (key: string) => {
        try {
            console.log(`[LargeSecureStore] GET ${key}`);
            if (Platform.OS === 'web') {
                return await AsyncStorage.getItem(key);
            }
            return await SecureStore.getItemAsync(key);
        } catch (e) {
            console.error(`[LargeSecureStore] GET ERROR ${key}:`, e);
            return null;
        }
    },
    setItem: async (key: string, value: string) => {
        try {
            console.log(`[LargeSecureStore] SET ${key} (len=${value.length})`);
            if (key.includes('code-verifier')) {
                console.log(`[LargeSecureStore] 🚨 WRITING VERIFIER: ${value}`);
            }
            if (Platform.OS === 'web') {
                await AsyncStorage.setItem(key, value);
            } else {
                await SecureStore.setItemAsync(key, value);
            }
        } catch (e) {
            console.error(`[LargeSecureStore] SET ERROR ${key}:`, e);
        }
    },
    removeItem: async (key: string) => {
        try {
            console.log(`[LargeSecureStore] REMOVE ${key}`);
            if (Platform.OS === 'web') {
                await AsyncStorage.removeItem(key);
            } else {
                await SecureStore.deleteItemAsync(key);
            }
        } catch (e) {
            console.error(`[LargeSecureStore] REMOVE ERROR ${key}:`, e);
        }
    },
    getAllKeys: async () => {
        try {
            if (Platform.OS === 'web') {
                return await AsyncStorage.getAllKeys();
            }
            // SecureStore doesn't strictly have getAllKeys easily without options, but we can try just AsyncStorage fallback if we can't?
            // Actually SecureStore DOES NOT have a simple getAllKeys. This is a problem.
            // But we can assume the key pattern.
            // Wait, SecureStore DOES have deleteItemAsync but no getAllKeysAsync universally on all versions easily?
            // Update: Expo SecureStore doesn't provide iteration easily.

            // FALLBACK: Return empty list or try to guess?
            // Since we can't easily list keys in SecureStore without native iteration support or external tracking:
            // We will rely on debugging:
            console.log('[LargeSecureStore] WARNING: getAllKeys not fully supported on SecureStore');
            return [];
        } catch (e) {
            return [];
        }
    }
};
