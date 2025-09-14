import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export const requestImagePermissions = async (): Promise<boolean> => {
  try {
    // Request media library permissions
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (mediaStatus !== 'granted') {
      Alert.alert(
        'Permission Required', 
        'Please grant camera roll permissions to select photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    // Request camera permissions
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus !== 'granted') {
      Alert.alert(
        'Permission Required', 
        'Please grant camera permissions to take photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error requesting image permissions:', error);
    return false;
  }
};

export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      console.log('Notification permissions not supported on web');
      return false;
    }

    // For development builds, we'll skip notification permissions for now
    // as they require a proper native build with expo-notifications
    console.log('⚠️ Notification permissions skipped in development build');
    console.log('ℹ️ To enable notifications, build the app with: npx expo run:android');
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

export const requestAllPermissions = async (): Promise<{
  imagePermissions: boolean;
  notificationPermissions: boolean;
}> => {
  console.log('🔐 Requesting all permissions...');
  
  const [imagePermissions, notificationPermissions] = await Promise.all([
    requestImagePermissions(),
    requestNotificationPermissions()
  ]);
  
  console.log('🔐 Permission results:', {
    imagePermissions,
    notificationPermissions
  });
  
  return {
    imagePermissions,
    notificationPermissions
  };
};
