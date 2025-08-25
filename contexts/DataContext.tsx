import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { deleteDeviceImages, renameTempImages } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface Device {
  id: string;
  user_id: string;
  name: string;
  brand?: string;
  model?: string; // Added model field
  serial_number?: string;
  category?: string;
  purchase_date: string;
  purchase_price: number;
  store_name?: string;
  notes?: string; // Added notes field
  image_url?: string; // Direct URL to device image
  created_at: string;
  updated_at?: string;
}

interface DataContextType {
  devices: Device[];
  loading: boolean;
  totalValue: number;
  deviceCount: number;
  refreshData: () => Promise<void>;
  addDevice: (device: Omit<Device, 'id' | 'created_at'>) => Promise<void>;
  updateDevice: (id: string, updates: Partial<Device>) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
  cleanupStorage: () => Promise<void>;
  clearData: () => Promise<void>;
  lastUpdated: Date | null;
  resetSyncState: () => void; // NEW: Add reset function to interface
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = 'warrilo_devices';
const STORAGE_TIMESTAMP_KEY = 'warrilo_devices_timestamp';

// Pre-load data function - called before DataProvider renders
export const preloadData = async (): Promise<{ devices: Device[], lastUpdated: Date | null }> => {
  try {
    const storedData = await AsyncStorage.getItem(STORAGE_KEY);
    const storedTimestamp = await AsyncStorage.getItem(STORAGE_TIMESTAMP_KEY);
    
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      
      // Clean up data before returning it
      const cleanedData = await cleanupStorageData(parsedData);
      
      const timestamp = storedTimestamp ? new Date(storedTimestamp) : null;
      console.log('DataContext: Pre-loaded', cleanedData.length, 'devices from local storage (after cleanup)');
      return { devices: cleanedData, lastUpdated: timestamp };
    }
    
    return { devices: [], lastUpdated: null };
  } catch (error) {
    console.error('Error pre-loading data:', error);
    return { devices: [], lastUpdated: null };
  }
};

// Storage cleanup function to prevent quota exceeded errors
const cleanupStorageData = async (devices: Device[]): Promise<Device[]> => {
  try {
    console.log('DataContext: Starting storage cleanup...');
    
    // Remove duplicate devices (keep the most recent one)
    const uniqueDevices = removeDuplicates(devices);
    console.log('DataContext: Removed duplicates, devices:', uniqueDevices.length);
    
    // Remove expired warranties (older than 2 years)
    const activeDevices = removeExpiredWarranties(uniqueDevices);
    console.log('DataContext: Removed expired warranties, devices:', activeDevices.length);
    
    // Limit total devices to prevent storage overflow (keep max 50 devices)
    const limitedDevices = limitDeviceCount(activeDevices, 50);
    console.log('DataContext: Limited device count to:', limitedDevices.length);
    
    // Update local storage with cleaned data
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(limitedDevices));
    await AsyncStorage.setItem(STORAGE_TIMESTAMP_KEY, new Date().toISOString());
    
    console.log('DataContext: Storage cleanup completed successfully');
    return limitedDevices;
  } catch (error) {
    console.error('Error during storage cleanup:', error);
    // Return original data if cleanup fails
    return devices;
  }
};

// Remove duplicate devices (keep the most recent one)
const removeDuplicates = (devices: Device[]): Device[] => {
  const deviceMap = new Map<string, Device>();
  
  devices.forEach(device => {
    const existing = deviceMap.get(device.id);
    if (!existing || new Date(device.created_at) > new Date(existing.created_at)) {
      deviceMap.set(device.id, device);
    }
  });
  
  return Array.from(deviceMap.values());
};

// Remove expired warranties (older than 2 years)
const removeExpiredWarranties = (devices: Device[]): Device[] => {
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  
  return devices.filter(device => {
    // For now, keep all devices since warranty info is in separate table
    // TODO: Implement warranty expiry check when warranties table is integrated
    return true;
  });
};

// Limit total number of devices to prevent storage overflow
const limitDeviceCount = (devices: Device[], maxCount: number): Device[] => {
  if (devices.length <= maxCount) return devices;
  
  // Sort by creation date (newest first) and keep the most recent ones
  const sortedDevices = devices.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  return sortedDevices.slice(0, maxCount);
};

export function DataProvider({ 
  children, 
  preloadedDevices = [], 
  preloadedTimestamp = null
}: { 
  children: React.ReactNode;
  preloadedDevices?: Device[];
  preloadedTimestamp?: Date | null;
}) {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>(preloadedDevices);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(preloadedTimestamp);
  
  // NEW: Sync state control to prevent multiple syncs
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // NEW: Reset sync state for user logout/login scenarios
  const resetSyncState = useCallback(() => {
    console.log('DataContext: Resetting sync state for new user session...');
    setHasInitialized(false);
    setIsSyncing(false);
  }, []);

  // FIXED: Single controlled initialization that only runs once
  useEffect(() => {
    if (user && !hasInitialized && !isSyncing) {
      initializeDataOnce();
    }
  }, [user, hasInitialized, isSyncing]);

  // NEW: Reset sync state when user changes (logout/login)
  useEffect(() => {
    if (!user) {
      // User logged out, reset sync state
      resetSyncState();
    }
  }, [user, resetSyncState]);

  // NEW: Single controlled initialization function
  const initializeDataOnce = async () => {
    if (hasInitialized || isSyncing) {
      console.log('DataContext: Sync already in progress or completed, skipping...');
      return;
    }
    
    try {
      console.log('DataContext: Starting single controlled initialization...');
      setIsSyncing(true);
      
      // If we already have preloaded data, use it immediately
      if (preloadedDevices.length > 0) {
        console.log('DataContext: Using pre-loaded data:', preloadedDevices.length, 'devices');
        setDevices(preloadedDevices);
        if (preloadedTimestamp) {
          setLastUpdated(preloadedTimestamp);
        }
      } else {
        // Fallback: load from local storage if no preloaded data
        const preloadedData = await preloadData();
        setDevices(preloadedData.devices);
        if (preloadedData.lastUpdated) {
          setLastUpdated(preloadedData.lastUpdated);
        }
      }
      
      // Start single background sync with Supabase
      await startSingleBackgroundSync();
      
      // Mark as initialized to prevent future syncs
      setHasInitialized(true);
      console.log('DataContext: Initialization completed successfully');
      
    } catch (error) {
      console.error('Error during controlled initialization:', error);
      // If initialization fails, try Supabase as fallback
      await fetchFromSupabase();
      setHasInitialized(true); // Mark as initialized even if failed
    } finally {
      setIsSyncing(false);
    }
  };

  // NEW: Single background sync function (no setTimeout, no multiple calls)
  const startSingleBackgroundSync = async () => {
    try {
      console.log('DataContext: Starting single background sync with Supabase...');
      await fetchFromSupabase();
      console.log('DataContext: Single background sync completed successfully');
    } catch (error) {
      console.error('DataContext: Single background sync failed:', error);
    }
  };

  // Fetch data from Supabase
  const fetchFromSupabase = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching devices:', error);
        return;
      }

      if (data) {
        console.log('DataContext: Fetched', data.length, 'devices from Supabase');
        console.log('DataContext: Sample device data:', data[0]);
        console.log('DataContext: Checking image_url fields...');
        data.forEach((device, index) => {
          console.log(`Device ${index}: ${device.name} - image_url: ${device.image_url ? 'EXISTS' : 'MISSING'}`);
        });
        
        // Clean up data before storing to prevent quota issues
        const cleanedData = await cleanupStorageData(data);
        
        setDevices(cleanedData);
        setLastUpdated(new Date());
        
        // Save cleaned data to local storage for future fast loading
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedData));
        await AsyncStorage.setItem(STORAGE_TIMESTAMP_KEY, new Date().toISOString());
      }
    } catch (error) {
      console.error('Error fetching from Supabase:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data (manual refresh)
  const refreshData = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('Refreshing data from Supabase...');
      
      // Fetch fresh data from Supabase without clearing current state
      const { data: freshDevices, error } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching fresh data:', error);
        return; // Keep existing data if fetch fails
      }

      if (freshDevices) {
        console.log(`Fetched ${freshDevices.length} fresh devices from Supabase`);
        
        // Only update state if the data actually changed
        const currentDeviceIds = new Set(devices.map(d => d.id));
        const freshDeviceIds = new Set(freshDevices.map(d => d.id));
        
        const hasChanges = devices.length !== freshDevices.length || 
                          !devices.every(device => freshDeviceIds.has(device.id)) ||
                          !freshDevices.every(device => currentDeviceIds.has(device.id));
        
        if (hasChanges) {
          console.log('Data has changed, updating state...');
          setDevices(freshDevices);
          setLastUpdated(new Date());
          
          // Save fresh data to local storage
          try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(freshDevices));
            await AsyncStorage.setItem(STORAGE_TIMESTAMP_KEY, new Date().toISOString());
            console.log('Fresh data saved to local storage');
          } catch (storageError) {
            console.error('Error saving fresh data to local storage:', storageError);
            // Don't fail the refresh if local storage fails
          }
        } else {
          console.log('No data changes detected, keeping current state');
          setLastUpdated(new Date()); // Update timestamp even if no changes
        }
      }
    } catch (error) {
      console.error('Error during refresh:', error);
      // Keep existing data if refresh fails
    }
  }, [user, devices]);

  // Add new device
  const addDevice = async (deviceData: Omit<Device, 'id' | 'created_at'>) => {
    if (!user) return;
    
    try {
      // First, add to local storage immediately for instant feedback
      const tempDevice: Device = {
        id: `temp_${Date.now()}`, // Temporary ID
        ...deviceData,
        created_at: new Date().toISOString(),
      };
      
      console.log('DataContext: Adding temp device:', tempDevice.id, tempDevice.name);
      const newDevices = [...devices, tempDevice];
      setDevices(newDevices);
      setLastUpdated(new Date());
      
      // Try to update local storage, but don't fail if quota is exceeded
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newDevices));
        await AsyncStorage.setItem(STORAGE_TIMESTAMP_KEY, new Date().toISOString());
        console.log('DataContext: Local storage updated successfully');
      } catch (storageError) {
        console.warn('DataContext: Local storage update failed (quota exceeded):', storageError);
        // Try to clear local storage and retry once
        try {
          await clearLocalStorage();
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newDevices));
          await AsyncStorage.setItem(STORAGE_TIMESTAMP_KEY, new Date().toISOString());
          console.log('DataContext: Local storage cleared and updated successfully');
        } catch (retryError) {
          console.warn('DataContext: Local storage retry also failed:', retryError);
          // Continue with Supabase sync even if local storage fails
        }
      }

      // FIXED: Single background Supabase sync (no setTimeout, no multiple calls)
      try {
        console.log('DataContext: Starting single background Supabase sync...');
        
        const { data, error } = await supabase
          .from('devices')
          .insert([{ ...deviceData, user_id: user.id }])
          .select()
          .single();

        if (error) {
          console.error('DataContext: Background Supabase sync failed:', error);
          // Keep the device locally even if Supabase fails
          return;
        }

        if (data) {
          // Rename temporary images to permanent ones
          try {
            console.log('DataContext: Renaming temporary images for device:', data.id);
            await renameTempImages(tempDevice.id, data.id, user.id);
            console.log('DataContext: Images renamed successfully');
          } catch (renameError) {
            console.warn('DataContext: Failed to rename images:', renameError);
            // Continue even if image renaming fails
          }
          
          // Replace temporary device with real one from Supabase (silently)
          const finalDevice = {
            ...data,
            // PRIORITY: Local URIs for immediate display in device cards
            image_url: tempDevice.image_url || data.image_url || null,
            // Note: receipt_image_url removed - receipts are now in separate receipts table
          };
          
          const finalDevices = newDevices.map(d => 
            d.id === tempDevice.id ? finalDevice : d
          );
          setDevices(finalDevices);
          setLastUpdated(new Date());
          
          // Try to update local storage with final data
          try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(finalDevices));
            await AsyncStorage.setItem(STORAGE_TIMESTAMP_KEY, new Date().toISOString());
            console.log('DataContext: Single background sync completed successfully');
          } catch (storageError) {
            console.warn('DataContext: Failed to save final data to local storage:', storageError);
          }
        }
      } catch (error) {
        console.error('DataContext: Single background Supabase sync error:', error);
        // Continue silently even if background sync fails
      }
    } catch (error) {
      console.error('Error adding device:', error);
      throw error;
    }
  };

  // Update device
  const updateDevice = async (id: string, updates: Partial<Device>) => {
    try {
      const { error } = await supabase
        .from('devices')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating device:', error);
        throw error;
      }

      const updatedDevices = devices.map(device => 
        device.id === id ? { ...device, ...updates } : device
      );
      setDevices(updatedDevices);
      setLastUpdated(new Date());
      
      // Update local storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDevices));
      await AsyncStorage.setItem(STORAGE_TIMESTAMP_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Error updating device:', error);
      throw error;
    }
  };

  // Delete device
  const deleteDevice = async (id: string) => {
    try {
      // First, delete the associated images from Supabase Storage
      if (user) {
        try {
          console.log('DataContext: Deleting images for device:', id);
          await deleteDeviceImages(id, user.id);
          console.log('DataContext: Images deleted successfully');
        } catch (storageError) {
          console.warn('DataContext: Failed to delete images from storage:', storageError);
          // Continue with device deletion even if image deletion fails
        }
      }

      // Then delete the device from the database
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting device:', error);
        throw error;
      }

      const updatedDevices = devices.filter(device => device.id !== id);
      setDevices(updatedDevices);
      setLastUpdated(new Date());
      
      // Update local storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDevices));
      await AsyncStorage.setItem(STORAGE_TIMESTAMP_KEY, new Date().toISOString());
      
      console.log('DataContext: Device and images deleted successfully');
    } catch (error) {
      console.error('Error deleting device:', error);
      throw error;
    }
  };

  // Manual storage cleanup
  const cleanupStorage = async () => {
    try {
      console.log('DataContext: Starting manual storage cleanup...');
      const preloadedData = await preloadData();
      const cleanedData = await cleanupStorageData(preloadedData.devices);
      setDevices(cleanedData);
      setLastUpdated(new Date());
      console.log('DataContext: Manual storage cleanup completed.');
    } catch (error) {
      console.error('Error during manual storage cleanup:', error);
    }
  };

  // Clear all data (local storage and state)
  const clearData = async () => {
    try {
      console.log('DataContext: Clearing all data...');
      setDevices([]);
      setLastUpdated(null);
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(STORAGE_TIMESTAMP_KEY);
      console.log('DataContext: All data cleared.');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  // Clear local storage when quota is exceeded
  const clearLocalStorage = async () => {
    try {
      console.log('DataContext: Clearing local storage due to quota exceeded...');
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(STORAGE_TIMESTAMP_KEY);
      console.log('DataContext: Local storage cleared successfully.');
      return true;
    } catch (error) {
      console.error('Error clearing local storage:', error);
      return false;
    }
  };

  // Calculate derived values
  const totalValue = devices.reduce((sum, device) => sum + (device.purchase_price || 0), 0);
  const deviceCount = devices.length;

  const value: DataContextType = {
    devices,
    loading,
    totalValue,
    deviceCount,
    refreshData,
    addDevice,
    updateDevice,
    deleteDevice,
    cleanupStorage,
    clearData,
    lastUpdated,
    resetSyncState, // NEW: Add resetSyncState to context value
  };

  // Component lifecycle logging
  useEffect(() => {
    console.log('🏗️ DataProvider mounting with:', {
      preloadedDevicesCount: preloadedDevices.length,
      preloadedTimestamp: preloadedTimestamp,
      user: user?.id || 'null'
    });
    
    return () => {
      console.log('🧹 DataProvider unmounting');
    };
  }, []);

  // Log state changes
  useEffect(() => {
    console.log('📊 DataProvider state update:', {
      devicesCount: devices.length,
      hasInitialized,
      isSyncing,
      user: user?.id || 'null'
    });
  }, [devices.length, hasInitialized, isSyncing, user]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
