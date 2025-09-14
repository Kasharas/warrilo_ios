// iOS 2025 Design System
// Save as: styles/iosDesignSystem.js

export const iosColors = {
  // Primary System Colors
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemRed: '#FF3B30',
  systemOrange: '#FF9500',
  systemYellow: '#FFCC00',
  systemPink: '#FF2D92',
  systemPurple: '#007AFF',

  // Grays
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',

  // Backgrounds
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  groupedBackground: '#F2F2F7',

  // Text
  label: '#000000',
  secondaryLabel: '#3C3C434D',
  placeholderText: '#8E8E93',

  // Borders
  separator: '#3C3C434F',
  opaqueSeparator: '#C6C6C8',

  // Alert Colors
  alertBackground: '#FFF9E6',
  alertBorder: '#FFE5B3',
  alertText: '#8B4513',

  // Status Colors
  statusSuccess: '#10b981',
  statusWarning: '#f59e0b',
  statusError: '#ef4444',

  // Background Variants
  backgroundLight: '#f9fafb',
  backgroundBlue: '#f0f9ff',
  backgroundRed: '#fef2f2',

  // Text Variants
  textMediumGray: '#6b7280',
  textErrorRed: '#dc2626',
  textDarkBlue: '#0369a1',
};

export const iosFonts = {
  // Font Sizes
  largeTitle: 34,
  title1: 28,
  title2: 22,
  title3: 20,
  headline: 17,
  body: 17,
  callout: 16,
  subhead: 15,
  footnote: 13,
  caption: 12,

  // Font Weights
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',

  // Font Family
  system: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
};

export const iosSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  
  // Touch targets
  minTouch: 44,
  
  // Safe areas
  safeTop: 44,
  safeBottom: 34,
};

export const iosRadius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  pill: 999,
};

export const iosComponents = {
  // Button
  button: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
  },

  // Input
  input: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
  },

  // Modal
  modal: {
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
  },

  // Picker
  picker: {
    itemHeight: 44,
    backgroundColor: '#F2F2F7',
  },
};
