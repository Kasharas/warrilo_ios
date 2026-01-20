import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WarrantyAlert {
    id?: string;
    device_id: string;
    local_device_id?: string;
    user_id: string;
    reminder_date: string;
    warranty_expire_date: string;
    device_name?: string;
    created_at?: string;
}

const STORAGE_KEY = 'warranty_alerts';

/**
 * Read all warranty alerts from local storage
 */
export const readWarrantyAlerts = async (): Promise<WarrantyAlert[]> => {
    try {
        console.log('📖 Reading warranty alerts from local storage...');
        const alertsData = await AsyncStorage.getItem(STORAGE_KEY);

        if (alertsData) {
            const alerts = JSON.parse(alertsData);
            console.log(`✅ Found ${alerts.length} warranty alerts in local storage`);
            return alerts;
        }

        console.log('ℹ️ No warranty alerts found in local storage');
        return [];
    } catch (error) {
        console.error('❌ Error reading warranty alerts:', error);
        return [];
    }
};

/**
 * Write warranty alerts to local storage (overwrites existing)
 */
export const writeWarrantyAlerts = async (alerts: WarrantyAlert[]): Promise<void> => {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
        console.log(`✅ Saved ${alerts.length} warranty alerts to local storage`);
    } catch (error) {
        console.error('❌ Error writing warranty alerts:', error);
        throw error;
    }
};

/**
 * Add new warranty alerts to existing ones in local storage
 */
export const addWarrantyAlerts = async (newAlerts: WarrantyAlert[]): Promise<void> => {
    try {
        if (newAlerts.length === 0) {
            console.log('ℹ️ No new alerts to add');
            return;
        }

        const existing = await readWarrantyAlerts();
        const combined = [...existing, ...newAlerts];
        await writeWarrantyAlerts(combined);
        console.log(`✅ Added ${newAlerts.length} new alerts (total: ${combined.length})`);
    } catch (error) {
        console.error('❌ Error adding warranty alerts:', error);
        throw error;
    }
};

/**
 * Clear all warranty alerts from local storage
 */
export const clearWarrantyAlerts = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEY);
        console.log('✅ Cleared warranty alerts from local storage');
    } catch (error) {
        console.error('❌ Error clearing warranty alerts:', error);
        throw error;
    }
};

/**
 * Delete warranty alerts for a specific device
 */
export const deleteWarrantyAlertsByDeviceId = async (deviceId: string): Promise<void> => {
    try {
        const alerts = await readWarrantyAlerts();
        const filteredAlerts = alerts.filter(a => a.device_id !== deviceId);
        await writeWarrantyAlerts(filteredAlerts);
        console.log(`✅ Deleted warranty alerts for device: ${deviceId}`);
    } catch (error) {
        console.error('❌ Error deleting warranty alerts for device:', error);
        throw error;
    }
};
