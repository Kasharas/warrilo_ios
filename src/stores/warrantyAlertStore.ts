import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';

interface WarrantyAlert {
  id: string;
  device_id: string;
  user_id: string;
  reminder_date: string;
  warranty_expire_date: string;
  alert_type: '30_days' | '7_days' | '1_day';
  created_at: string;
}

interface WarrantyAlertStore {
  alerts: WarrantyAlert[];
  isLoaded: boolean;
  setAlerts: (alerts: WarrantyAlert[]) => void;
  addAlerts: (alerts: WarrantyAlert[]) => void;
  removeAlertsByDeviceId: (deviceId: string) => void;
  getAlertsByDeviceId: (deviceId: string) => WarrantyAlert[];
  getAllAlerts: () => WarrantyAlert[];
  clearAll: () => void;
  setLoaded: (loaded: boolean) => void;
}

// Platform-specific storage setup
const createStorage = () => {
  if (Platform.OS === 'web') {
    // Web: Use localStorage
    return createJSONStorage(() => localStorage);
  } else {
    // Mobile: Use AsyncStorage with conditional require
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      return createJSONStorage(() => AsyncStorage);
    } catch (error) {
      console.warn('AsyncStorage not available');
      // Fallback to memory storage
      return createJSONStorage(() => ({
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      }));
    }
  }
};

export const useWarrantyAlertStore = create<WarrantyAlertStore>()(
  persist(
    (set, get) => ({
      alerts: [],
      isLoaded: false,
      
      setAlerts: (alerts) => {
        console.log(`[${Platform.OS}] Setting ${alerts.length} warranty alerts`);
        set({ alerts, isLoaded: true });
      },
      
      addAlerts: (newAlerts) => {
        console.log(`[${Platform.OS}] Adding ${newAlerts.length} new alerts`);
        set((state) => ({
          alerts: [...state.alerts, ...newAlerts]
        }));
      },
      
      removeAlertsByDeviceId: (deviceId) => {
        console.log(`[${Platform.OS}] Removing alerts for device: ${deviceId}`);
        set((state) => ({
          alerts: state.alerts.filter(alert => alert.device_id !== deviceId)
        }));
      },
      
      getAlertsByDeviceId: (deviceId) => {
        return get().alerts.filter(alert => alert.device_id === deviceId);
      },
      
      getAllAlerts: () => {
        return get().alerts;
      },
      
      clearAll: () => {
        console.log(`[${Platform.OS}] Clearing all alerts`);
        set({ alerts: [], isLoaded: false });
      },
      
      setLoaded: (loaded) => set({ isLoaded: loaded })
    }),
    {
      name: 'warranty-alerts-storage',
      storage: createStorage(),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log(`[${Platform.OS}] Rehydrated ${state.alerts.length} alerts`);
          state.setLoaded(true);
        }
      }
    }
  )
);
