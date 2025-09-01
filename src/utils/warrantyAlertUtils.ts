import { format, subDays, addMonths, isValid, parseISO } from 'date-fns';

export interface CreateAlertParams {
  deviceId: string;
  userId: string;
  purchaseDate: string;
  warrantyMonths: number;
}

export interface WarrantyAlert {
  id: string;
  device_id: string;
  user_id: string;
  reminder_date: string; // ISO date string
  warranty_expire_date: string; // ISO date string
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
  const { deviceId, userId, purchaseDate, warrantyMonths } = params;
  
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
      user_id: userId,
      reminder_date: format(reminderDate, 'yyyy-MM-dd'),
      warranty_expire_date: warrantyExpireDateString
    };
  });
  
  console.log(`Created ${alerts.length} warranty alerts for device ${deviceId} (expires: ${warrantyExpireDateString})`);
  return alerts;
};

// Generate consistent local IDs for alerts
export const generateAlertId = (deviceId: string, alertType: string): string => {
  return `alert_${deviceId}_${alertType}_${Date.now()}`;
};
