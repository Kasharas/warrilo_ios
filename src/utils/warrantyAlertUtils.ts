import { format, subDays, addMonths, isValid, parseISO } from 'date-fns';

export interface CreateAlertParams {
  deviceId: string;
  localDeviceId?: string; // Local device ID for local storage
  userId: string;
  purchaseDate: string;
  warrantyMonths: number;
  deviceName?: string; // Optional device name for local storage
}

export interface WarrantyAlert {
  id: string;
  device_id: string;
  local_device_id?: string; // Local device ID for local storage
  user_id: string;
  reminder_date: string; // ISO date string
  warranty_expire_date: string; // ISO date string
  device_name?: string; // Optional device name for local storage
}

// Safe date parsing for mobile platforms
export const parseDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  
  const isoDate = parseISO(dateString);
  if (isValid(isoDate)) return isoDate;
  
  const fallbackDate = new Date(dateString);
  return isValid(fallbackDate) ? fallbackDate : new Date();
};

// Calculate warranty expiry date
export const calculateWarrantyExpiryDate = (
  purchaseDate: string, 
  warrantyMonths: number
): Date => {
  const purchase = parseDate(purchaseDate);
  return addMonths(purchase, warrantyMonths);
};

// Create warranty alerts for a device (30, 7, 1 day before expiry)
export const createWarrantyAlerts = (params: CreateAlertParams): Omit<WarrantyAlert, 'id'>[] => {
  const { deviceId, localDeviceId, userId, purchaseDate, warrantyMonths, deviceName } = params;
  
  if (!purchaseDate || !warrantyMonths || warrantyMonths <= 0) {
    console.log(`Skipping alert creation - invalid warranty info: purchaseDate=${purchaseDate}, warrantyMonths=${warrantyMonths}`);
    return [];
  }
  
  const warrantyExpiryDate = calculateWarrantyExpiryDate(purchaseDate, warrantyMonths);
  const warrantyExpireDateString = format(warrantyExpiryDate, 'yyyy-MM-dd');
  const now = new Date().toISOString();
  
  const alertTypes = [
    { type: '30_days' as const, days: 30 },
    { type: '7_days' as const, days: 7 },
    { type: '1_day' as const, days: 1 }
  ];
  
  const alerts = alertTypes.map(({ type, days }) => {
    const reminderDate = subDays(warrantyExpiryDate, days);
    
    return {
      device_id: deviceId,
      local_device_id: localDeviceId, // Include local device ID for local storage
      user_id: userId,
      reminder_date: format(reminderDate, 'yyyy-MM-dd'),
      warranty_expire_date: warrantyExpireDateString,
      device_name: deviceName // Include device name for local storage
    };
  });
  
  console.log(`Created ${alerts.length} warranty alerts for device ${deviceId} (${deviceName || 'Unknown'}) (expires: ${warrantyExpireDateString})`);
  return alerts;
};

// Generate consistent local IDs for alerts
export const generateAlertId = (deviceId: string, alertType: string): string => {
  return `alert_${deviceId}_${alertType}_${Date.now()}`;
};
