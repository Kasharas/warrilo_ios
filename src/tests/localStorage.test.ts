import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceLocalStorage, LocalDevice } from '../lib/localStorage';

// Mock Platform.OS for testing
const mockPlatform = Platform.OS;

// Mock AsyncStorage for testing
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock localStorage for web testing
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock global localStorage for web platform
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('DeviceLocalStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mocks
    (AsyncStorage.getItem as jest.Mock).mockClear();
    (AsyncStorage.setItem as jest.Mock).mockClear();
    (AsyncStorage.removeItem as jest.Mock).mockClear();
    (AsyncStorage.multiRemove as jest.Mock).mockClear();
    
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockLocalStorage.clear.mockClear();
  });

  describe('AsyncStorage Import and Availability', () => {
    it('should have AsyncStorage properly imported', () => {
      expect(AsyncStorage).toBeDefined();
      expect(typeof AsyncStorage.getItem).toBe('function');
      expect(typeof AsyncStorage.setItem).toBe('function');
      expect(typeof AsyncStorage.removeItem).toBe('function');
      expect(typeof AsyncStorage.multiRemove).toBe('function');
    });

    it('should detect AsyncStorage availability correctly', async () => {
      const initResult = await DeviceLocalStorage.initializeStorage();
      expect(initResult.isAvailable).toBe(true);
      expect(initResult.platform).toBe(mockPlatform);
      expect(initResult.storageType).toBe(mockPlatform === 'web' ? 'localStorage' : 'AsyncStorage');
    });
  });

  describe('Platform Detection', () => {
    it('should detect platform correctly', async () => {
      const initResult = await DeviceLocalStorage.initializeStorage();
      expect(initResult.platform).toBe(mockPlatform);
    });

    it('should use correct storage type for platform', async () => {
      const initResult = await DeviceLocalStorage.initializeStorage();
      if (mockPlatform === 'web') {
        expect(initResult.storageType).toBe('localStorage');
      } else {
        expect(initResult.storageType).toBe('AsyncStorage');
      }
    });
  });

  describe('Data Validation', () => {
    const validDevice: LocalDevice = {
      id: 'test-device-1',
      user_id: 'user-123',
      name: 'Test Device',
      supplier: 'Test Supplier',
      category: 'Electronics',
      purchase_date: '2023-01-01',
      warranty_months: 12,
      warranty_end_date: '2024-01-01',
      price: 100.00,
      currency: 'USD',
      receipt_photo_url: null,
      device_photo_url: null,
      additional_photos: [],
      notes: 'Test notes',
      sync_status: 'pending',
      local_id: 'local-123',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    const invalidDevice = {
      id: 'test-device-2',
      // Missing required fields: user_id, name
      supplier: 'Test Supplier',
    };

    it('should validate device objects correctly', async () => {
      // Mock successful storage operations
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([validDevice]));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const devices = await DeviceLocalStorage.getDevices();
      expect(devices).toEqual([validDevice]);
    });

    it('should handle invalid device objects gracefully', async () => {
      // Mock storage with invalid data
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([invalidDevice]));
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

      const devices = await DeviceLocalStorage.getDevices();
      expect(devices).toEqual([]);
      expect(AsyncStorage.multiRemove).toHaveBeenCalled();
    });

    it('should handle corrupted JSON data', async () => {
      // Mock corrupted JSON
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid-json{');
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

      const devices = await DeviceLocalStorage.getDevices();
      expect(devices).toEqual([]);
      expect(AsyncStorage.multiRemove).toHaveBeenCalled();
    });

    it('should handle non-array data structure', async () => {
      // Mock non-array data
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ not: 'an array' }));
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

      const devices = await DeviceLocalStorage.getDevices();
      expect(devices).toEqual([]);
      expect(AsyncStorage.multiRemove).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle AsyncStorage getItem errors', async () => {
      const error = new Error('AsyncStorage getItem failed');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(error);

      const devices = await DeviceLocalStorage.getDevices();
      expect(devices).toEqual([]);
    });

    it('should handle AsyncStorage setItem errors', async () => {
      const error = new Error('AsyncStorage setItem failed');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(error);

      const device: LocalDevice = {
        id: 'test-device',
        user_id: 'user-123',
        name: 'Test Device',
        supplier: null,
        category: null,
        purchase_date: '2023-01-01',
        warranty_months: 12,
        warranty_end_date: '2024-01-01',
        price: 100.00,
        currency: 'USD',
        receipt_photo_url: null,
        device_photo_url: null,
        additional_photos: [],
        notes: null,
        sync_status: 'pending',
        local_id: 'local-123',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      await expect(DeviceLocalStorage.storeDevice(device)).rejects.toThrow();
    });

    it('should handle Android-specific storage permission errors', async () => {
      const permissionError = new Error('Storage permission denied');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(permissionError);

      const devices = await DeviceLocalStorage.getDevices();
      expect(devices).toEqual([]);
    });

    it('should handle Android-specific quota errors', async () => {
      const quotaError = new Error('Storage quota exceeded');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(quotaError);
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

      const device: LocalDevice = {
        id: 'test-device',
        user_id: 'user-123',
        name: 'Test Device',
        supplier: null,
        category: null,
        purchase_date: '2023-01-01',
        warranty_months: 12,
        warranty_end_date: '2024-01-01',
        price: 100.00,
        currency: 'USD',
        receipt_photo_url: null,
        device_photo_url: null,
        additional_photos: [],
        notes: null,
        sync_status: 'pending',
        local_id: 'local-123',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      await expect(DeviceLocalStorage.storeDevice(device)).rejects.toThrow('Storage quota exceeded and retry failed');
    });

    it('should handle iOS-specific background refresh errors', async () => {
      const backgroundError = new Error('Background app refresh limitation');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(backgroundError);

      const devices = await DeviceLocalStorage.getDevices();
      expect(devices).toEqual([]);
    });

    it('should handle iOS-specific sandbox errors', async () => {
      const sandboxError = new Error('App sandbox storage issue');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(sandboxError);

      const device: LocalDevice = {
        id: 'test-device',
        user_id: 'user-123',
        name: 'Test Device',
        supplier: null,
        category: null,
        purchase_date: '2023-01-01',
        warranty_months: 12,
        warranty_end_date: '2024-01-01',
        price: 100.00,
        currency: 'USD',
        receipt_photo_url: null,
        device_photo_url: null,
        additional_photos: [],
        notes: null,
        sync_status: 'pending',
        local_id: 'local-123',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      await expect(DeviceLocalStorage.storeDevice(device)).rejects.toThrow();
    });
  });

  describe('Health Check', () => {
    it('should pass health check when AsyncStorage is working', async () => {
      // Mock successful health check operations
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ test: 'health_check' }));
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const healthCheckResult = await DeviceLocalStorage.healthCheck();
      expect(healthCheckResult).toBe(true);
    });

    it('should fail health check when AsyncStorage setItem fails', async () => {
      const error = new Error('AsyncStorage setItem failed');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(error);

      const healthCheckResult = await DeviceLocalStorage.healthCheck();
      expect(healthCheckResult).toBe(false);
    });

    it('should fail health check when AsyncStorage getItem fails', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      const error = new Error('AsyncStorage getItem failed');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(error);

      const healthCheckResult = await DeviceLocalStorage.healthCheck();
      expect(healthCheckResult).toBe(false);
    });

    it('should fail health check when data integrity check fails', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ test: 'wrong_value' }));
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const healthCheckResult = await DeviceLocalStorage.healthCheck();
      expect(healthCheckResult).toBe(false);
    });

    it('should fail health check when AsyncStorage removeItem fails', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ test: 'health_check' }));
      const error = new Error('AsyncStorage removeItem failed');
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(error);

      const healthCheckResult = await DeviceLocalStorage.healthCheck();
      expect(healthCheckResult).toBe(false);
    });
  });

  describe('Memory Fallback Storage', () => {
    it('should provide memory storage debug info', () => {
      const debugInfo = DeviceLocalStorage.getMemoryStorageDebugInfo();
      expect(debugInfo).toHaveProperty('size');
      expect(debugInfo).toHaveProperty('keys');
      expect(debugInfo).toHaveProperty('memoryUsage');
      expect(typeof debugInfo.size).toBe('number');
      expect(Array.isArray(debugInfo.keys)).toBe(true);
      expect(typeof debugInfo.memoryUsage).toBe('string');
    });

    it('should detect if using memory storage', () => {
      const isUsingMemory = DeviceLocalStorage.isUsingMemoryStorage();
      expect(typeof isUsingMemory).toBe('boolean');
    });

    it('should provide memory storage instance for testing', () => {
      const memoryStorage = DeviceLocalStorage.getMemoryStorage();
      expect(memoryStorage).toBeDefined();
      expect(typeof memoryStorage.getItem).toBe('function');
      expect(typeof memoryStorage.setItem).toBe('function');
      expect(typeof memoryStorage.removeItem).toBe('function');
    });
  });

  describe('Storage Migration', () => {
    it('should handle initial storage setup', async () => {
      // Mock no existing version
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const migrationResult = await DeviceLocalStorage.checkAndMigrateStorage();
      expect(migrationResult.migrated).toBe(true);
      expect(migrationResult.fromVersion).toBe(null);
      expect(migrationResult.toVersion).toBe('1.0.0');
      expect(migrationResult.success).toBe(true);
    });

    it('should handle version upgrade migration', async () => {
      // Mock existing version 0.9.0
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce('0.9.0') // Version check
        .mockResolvedValueOnce(JSON.stringify([])) // Devices data
        .mockResolvedValueOnce(undefined); // Version set
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const migrationResult = await DeviceLocalStorage.checkAndMigrateStorage();
      expect(migrationResult.migrated).toBe(true);
      expect(migrationResult.fromVersion).toBe('0.9.0');
      expect(migrationResult.toVersion).toBe('1.0.0');
      expect(migrationResult.success).toBe(true);
    });

    it('should handle unknown migration gracefully', async () => {
      // Mock unknown version
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce('0.8.0') // Unknown version
        .mockResolvedValueOnce(undefined); // Version set after clear
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const migrationResult = await DeviceLocalStorage.checkAndMigrateStorage();
      expect(migrationResult.migrated).toBe(true);
      expect(migrationResult.fromVersion).toBe('0.8.0');
      expect(migrationResult.toVersion).toBe('1.0.0');
      expect(migrationResult.success).toBe(true);
    });

    it('should get current storage version', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('1.0.0');

      const version = await DeviceLocalStorage.getStorageVersion();
      expect(version).toBe('1.0.0');
    });

    it('should handle version check errors', async () => {
      const error = new Error('Version check failed');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(error);

      const version = await DeviceLocalStorage.getStorageVersion();
      expect(version).toBe(null);
    });
  });

  describe('Storage Operations', () => {
    const testDevice: LocalDevice = {
      id: 'test-device',
      user_id: 'user-123',
      name: 'Test Device',
      supplier: null,
      category: null,
      purchase_date: '2023-01-01',
      warranty_months: 12,
      warranty_end_date: '2024-01-01',
      price: 100.00,
      currency: 'USD',
      receipt_photo_url: null,
      device_photo_url: null,
      additional_photos: [],
      notes: null,
      sync_status: 'pending',
      local_id: 'local-123',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    it('should store device successfully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const localId = await DeviceLocalStorage.storeDevice(testDevice);
      expect(localId).toBeDefined();
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should update device successfully', async () => {
      const existingDevice = { ...testDevice, local_id: 'local-123' };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([existingDevice]));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await DeviceLocalStorage.updateDevice('local-123', { name: 'Updated Device' });
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should remove device successfully', async () => {
      const existingDevice = { ...testDevice, local_id: 'local-123' };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([existingDevice]));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await DeviceLocalStorage.removeDevice('local-123');
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should update device sync status', async () => {
      const existingDevice = { ...testDevice, local_id: 'local-123' };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([existingDevice]));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await DeviceLocalStorage.updateDeviceSyncStatus('local-123', 'synced');
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should get sync status', async () => {
      const syncStatus = {
        last_sync: '2023-01-01T00:00:00Z',
        pending_count: 1,
        failed_count: 0,
        is_syncing: false,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(syncStatus));

      const status = await DeviceLocalStorage.getSyncStatus();
      expect(status).toEqual(syncStatus);
    });

    it('should clear all data', async () => {
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

      await DeviceLocalStorage.clearAll();
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'warrilo_devices',
        'warrilo_pending_sync',
        'warrilo_sync_status',
        'warrilo_storage_version',
      ]);
    });
  });

  describe('Android-Specific Scenarios', () => {
    beforeEach(() => {
      // Mock Android platform
      Object.defineProperty(Platform, 'OS', {
        value: 'android',
        writable: true,
      });
    });

    it('should handle Android storage permission errors', async () => {
      const permissionError = new Error('Storage permission denied');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(permissionError);

      const devices = await DeviceLocalStorage.getDevices();
      expect(devices).toEqual([]);
    });

    it('should handle Android database corruption errors', async () => {
      const dbError = new Error('SQLite database corruption');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(dbError);

      const device: LocalDevice = {
        id: 'test-device',
        user_id: 'user-123',
        name: 'Test Device',
        supplier: null,
        category: null,
        purchase_date: '2023-01-01',
        warranty_months: 12,
        warranty_end_date: '2024-01-01',
        price: 100.00,
        currency: 'USD',
        receipt_photo_url: null,
        device_photo_url: null,
        additional_photos: [],
        notes: null,
        sync_status: 'pending',
        local_id: 'local-123',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      await expect(DeviceLocalStorage.storeDevice(device)).rejects.toThrow();
    });

    it('should handle Android storage quota errors', async () => {
      const quotaError = new Error('Storage quota exceeded');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(quotaError);
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

      const device: LocalDevice = {
        id: 'test-device',
        user_id: 'user-123',
        name: 'Test Device',
        supplier: null,
        category: null,
        purchase_date: '2023-01-01',
        warranty_months: 12,
        warranty_end_date: '2024-01-01',
        price: 100.00,
        currency: 'USD',
        receipt_photo_url: null,
        device_photo_url: null,
        additional_photos: [],
        notes: null,
        sync_status: 'pending',
        local_id: 'local-123',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      await expect(DeviceLocalStorage.storeDevice(device)).rejects.toThrow('Storage quota exceeded and retry failed');
    });
  });

  describe('iOS-Specific Scenarios', () => {
    beforeEach(() => {
      // Mock iOS platform
      Object.defineProperty(Platform, 'OS', {
        value: 'ios',
        writable: true,
      });
    });

    it('should handle iOS background refresh errors', async () => {
      const backgroundError = new Error('Background app refresh limitation');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(backgroundError);

      const devices = await DeviceLocalStorage.getDevices();
      expect(devices).toEqual([]);
    });

    it('should handle iOS sandbox errors', async () => {
      const sandboxError = new Error('App sandbox storage issue');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(sandboxError);

      const device: LocalDevice = {
        id: 'test-device',
        user_id: 'user-123',
        name: 'Test Device',
        supplier: null,
        category: null,
        purchase_date: '2023-01-01',
        warranty_months: 12,
        warranty_end_date: '2024-01-01',
        price: 100.00,
        currency: 'USD',
        receipt_photo_url: null,
        device_photo_url: null,
        additional_photos: [],
        notes: null,
        sync_status: 'pending',
        local_id: 'local-123',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      await expect(DeviceLocalStorage.storeDevice(device)).rejects.toThrow();
    });
  });

  describe('Web Platform Scenarios', () => {
    beforeEach(() => {
      // Mock web platform
      Object.defineProperty(Platform, 'OS', {
        value: 'web',
        writable: true,
      });
    });

    it('should use localStorage on web platform', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      mockLocalStorage.setItem.mockReturnValue(undefined);

      const devices = await DeviceLocalStorage.getDevices();
      expect(devices).toEqual([]);
      expect(mockLocalStorage.getItem).toHaveBeenCalled();
    });

    it('should handle web storage quota errors', async () => {
      const quotaError = new Error('localStorage quota exceeded');
      mockLocalStorage.setItem.mockImplementation(() => {
        throw quotaError;
      });

      const device: LocalDevice = {
        id: 'test-device',
        user_id: 'user-123',
        name: 'Test Device',
        supplier: null,
        category: null,
        purchase_date: '2023-01-01',
        warranty_months: 12,
        warranty_end_date: '2024-01-01',
        price: 100.00,
        currency: 'USD',
        receipt_photo_url: null,
        device_photo_url: null,
        additional_photos: [],
        notes: null,
        sync_status: 'pending',
        local_id: 'local-123',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      await expect(DeviceLocalStorage.storeDevice(device)).rejects.toThrow();
    });
  });

  describe('Storage Failure Scenarios', () => {
    it('should handle complete AsyncStorage failure', async () => {
      // Mock AsyncStorage completely unavailable
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('AsyncStorage not available'));
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('AsyncStorage not available'));

      const devices = await DeviceLocalStorage.getDevices();
      expect(devices).toEqual([]);
    });

    it('should handle partial AsyncStorage failure', async () => {
      // Mock getItem working but setItem failing
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('AsyncStorage setItem failed'));

      const device: LocalDevice = {
        id: 'test-device',
        user_id: 'user-123',
        name: 'Test Device',
        supplier: null,
        category: null,
        purchase_date: '2023-01-01',
        warranty_months: 12,
        warranty_end_date: '2024-01-01',
        price: 100.00,
        currency: 'USD',
        receipt_photo_url: null,
        device_photo_url: null,
        additional_photos: [],
        notes: null,
        sync_status: 'pending',
        local_id: 'local-123',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      await expect(DeviceLocalStorage.storeDevice(device)).rejects.toThrow();
    });

    it('should handle network-related storage errors', async () => {
      const networkError = new Error('Network request failed');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(networkError);

      const devices = await DeviceLocalStorage.getDevices();
      expect(devices).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty device list', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));

      const devices = await DeviceLocalStorage.getDevices();
      expect(devices).toEqual([]);
    });

    it('should handle null storage response', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const devices = await DeviceLocalStorage.getDevices();
      expect(devices).toEqual([]);
    });

    it('should handle undefined storage response', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(undefined);

      const devices = await DeviceLocalStorage.getDevices();
      expect(devices).toEqual([]);
    });

    it('should handle very large device data', async () => {
      const largeDevice = {
        id: 'large-device',
        user_id: 'user-123',
        name: 'Large Device',
        supplier: null,
        category: null,
        purchase_date: '2023-01-01',
        warranty_months: 12,
        warranty_end_date: '2024-01-01',
        price: 100.00,
        currency: 'USD',
        receipt_photo_url: null,
        device_photo_url: null,
        additional_photos: [],
        notes: 'x'.repeat(1000000), // Very large notes field
        sync_status: 'pending',
        local_id: 'local-123',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([largeDevice]));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const devices = await DeviceLocalStorage.getDevices();
      expect(devices).toEqual([largeDevice]);
    });
  });
});
