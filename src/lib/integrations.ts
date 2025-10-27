/**
 * STUB INTEGRATIONS - UI ONLY
 * 
 * These are placeholder implementations for demonstration purposes.
 * In a production app, these would connect to real services.
 */

// Authentication Service (STUB)
export class AuthService {
  static async signIn(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    // STUB: Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email && password) {
      return {
        success: true,
        user: {
          id: '1',
          email,
          name: 'John Doe',
          plan: 'pro',
        }
      };
    }
    
    return {
      success: false,
      error: 'Invalid credentials'
    };
  }

  static async signUp(email: string, password: string, name: string): Promise<{ success: boolean; user?: any; error?: string }> {
    // STUB: Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      user: {
        id: '2',
        email,
        name,
        plan: 'free',
      }
    };
  }

  static async signOut(): Promise<void> {
    // STUB: Clear local storage/state
    console.log('User signed out');
  }

  static async getCurrentUser(): Promise<any> {
    // STUB: Return mock user
    return {
      id: '1',
      email: 'john.doe@email.com',
      name: 'John Doe',
      plan: 'pro',
    };
  }
}

// Database Service (STUB)
export class DatabaseService {
  static async saveDevice(device: any): Promise<{ success: boolean; id?: string; error?: string }> {
    // STUB: Simulate database save
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      id: Math.random().toString(36),
    };
  }

  static async getDevices(userId: string): Promise<any[]> {
    // STUB: Return mock devices
    await new Promise(resolve => setTimeout(resolve, 300));
    return [];
  }

  static async updateDevice(deviceId: string, updates: any): Promise<{ success: boolean; error?: string }> {
    // STUB: Simulate database update
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true };
  }

  static async deleteDevice(deviceId: string): Promise<{ success: boolean; error?: string }> {
    // STUB: Simulate database delete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true };
  }
}

// Storage Service (STUB)
export class StorageService {
  static async uploadImage(imageUri: string, path: string): Promise<{ success: boolean; url?: string; error?: string }> {
    // STUB: Simulate image upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      url: `https://example.com/uploads/${Math.random().toString(36)}.jpg`,
    };
  }

  static async deleteImage(url: string): Promise<{ success: boolean; error?: string }> {
    // STUB: Simulate image deletion
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true };
  }
}

// Payment Service (STUB)
export class PaymentService {
  static async createSubscription(planId: string): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    // STUB: Simulate subscription creation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      subscriptionId: Math.random().toString(36),
    };
  }

  static async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    // STUB: Simulate subscription cancellation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true };
  }

  static async getSubscriptionStatus(userId: string): Promise<{ plan: string; status: string; expiryDate?: string }> {
    // STUB: Return mock subscription status
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      plan: 'pro',
      status: 'active',
      expiryDate: '2025-12-31',
    };
  }
}

// OCR Service (STUB)
export class OCRService {
  static async extractReceiptData(imageUri: string): Promise<{ 
    success: boolean; 
    data?: {
      storeName?: string;
      amount?: number;
      date?: string;
      items?: string[];
    }; 
    error?: string 
  }> {
    // STUB: Simulate OCR processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      success: true,
      data: {
        storeName: 'Apple Store',
        amount: 1199.00,
        date: '2025-08-20',
        items: ['iPhone 15 Pro', 'AppleCare+'],
      },
    };
  }
}

// Push Notification Service (STUB)
export class PushNotificationService {
  static async requestPermissions(): Promise<{ granted: boolean; token?: string }> {
    // STUB: Simulate permission request
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      granted: true,
      token: 'expo_push_token_' + Math.random().toString(36),
    };
  }

  static async scheduleWarrantyReminder(deviceId: string, expiryDate: Date): Promise<{ success: boolean; notificationId?: string }> {
    // STUB: Simulate notification scheduling
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      notificationId: Math.random().toString(36),
    };
  }

  static async cancelNotification(notificationId: string): Promise<{ success: boolean }> {
    // STUB: Simulate notification cancellation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true };
  }
}