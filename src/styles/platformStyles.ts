// Platform-Adaptive Styling System
// Automatically selects iOS or Material Design based on platform
// Web defaults to iOS styling as requested

import { Platform } from 'react-native';
import { iosColors, iosFonts, iosSpacing, iosRadius } from './iosDesignSystem';
import { materialColors, materialFonts, materialSpacing, materialRadius } from './materialDesignSystem';

// Platform detection with web fallback to iOS
const getPlatform = () => {
  if (Platform.OS === 'web') return 'ios'; // Web uses iOS styling as requested
  return Platform.OS;
};

// Platform-adaptive color system
export const platformColors = Platform.select({
  ios: iosColors,
  android: materialColors,
  default: iosColors, // Web and other platforms default to iOS
});

// Platform-adaptive font system
export const platformFonts = Platform.select({
  ios: iosFonts,
  android: materialFonts,
  default: iosFonts, // Web and other platforms default to iOS
});

// Platform-adaptive spacing system
export const platformSpacing = Platform.select({
  ios: iosSpacing,
  android: materialSpacing,
  default: iosSpacing, // Web and other platforms default to iOS
});

// Platform-adaptive radius system
export const platformRadius = Platform.select({
  ios: iosRadius,
  android: materialRadius,
  default: iosRadius, // Web and other platforms default to iOS
});

// Platform-adaptive component styles
export const platformComponents = Platform.select({
  ios: {
    button: {
      height: 44,
      paddingHorizontal: 16,
      borderRadius: 10,
    },
    input: {
      height: 44,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: '#F2F2F7',
    },
    card: {
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
  },
  android: {
    button: {
      height: 48,
      paddingHorizontal: 24,
      borderRadius: 24,
    },
    input: {
      height: 48,
      paddingHorizontal: 16,
      borderRadius: 4,
      backgroundColor: '#F5F5F5',
    },
    card: {
      borderRadius: 12,
      elevation: 2,
    },
  },
  default: {
    // Web and other platforms use iOS styling
    button: {
      height: 44,
      paddingHorizontal: 16,
      borderRadius: 10,
    },
    input: {
      height: 44,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: '#F2F2F7',
    },
    card: {
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
  },
});

// Platform-adaptive shadow system
export const platformShadows = Platform.select({
  ios: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 8,
    },
  },
  android: {
    sm: {
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
    },
    md: {
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    lg: {
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
    },
  },
  default: {
    // Web and other platforms use iOS shadows
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 8,
    },
  },
});

// Utility function to get current platform
export const getCurrentPlatform = () => getPlatform();

// Utility function to check if current platform is iOS (including web)
export const isIOSStyle = () => getPlatform() === 'ios';

// Utility function to check if current platform is Android
export const isAndroidStyle = () => getPlatform() === 'android';

// Export individual design systems for direct access if needed
export { iosColors, iosFonts, iosSpacing, iosRadius } from './iosDesignSystem';
export { materialColors, materialFonts, materialSpacing, materialRadius } from './materialDesignSystem';
