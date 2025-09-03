// Material Design 3 System for Android
// Save as: styles/materialDesignSystem.js

export const materialColors = {
  // Primary Colors
  primary: '#6750A4',
  onPrimary: '#FFFFFF',
  primaryContainer: '#EADDFF',
  onPrimaryContainer: '#21005D',
  
  // Secondary Colors
  secondary: '#625B71',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E8DEF8',
  onSecondaryContainer: '#1D192B',
  
  // Tertiary Colors
  tertiary: '#7D5260',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFD8E4',
  onTertiaryContainer: '#31111D',
  
  // Error Colors
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',
  
  // Success Colors
  success: '#4CAF50',
  onSuccess: '#FFFFFF',
  successContainer: '#C8E6C9',
  onSuccessContainer: '#1B5E20',
  
  // Warning Colors
  warning: '#FF9800',
  onWarning: '#FFFFFF',
  warningContainer: '#FFE0B2',
  onWarningContainer: '#E65100',
  
  // Neutral Colors
  surface: '#FFFBFE',
  onSurface: '#1C1B1F',
  surfaceVariant: '#E7E0EC',
  onSurfaceVariant: '#49454F',
  
  // Background Colors
  background: '#FFFBFE',
  onBackground: '#1C1B1F',
  
  // Outline Colors
  outline: '#79747E',
  outlineVariant: '#CAC4D0',
  
  // Shadow Colors
  shadow: '#000000',
  scrim: '#000000',
  
  // Legacy Colors (for compatibility)
  systemBlue: '#6750A4',
  systemGreen: '#4CAF50',
  systemRed: '#BA1A1A',
  systemOrange: '#FF9800',
  systemYellow: '#FFC107',
  systemPink: '#E91E63',
  systemPurple: '#9C27B0',
  systemGray: '#9E9E9E',
  systemGray2: '#BDBDBD',
  systemGray3: '#E0E0E0',
  systemGray4: '#EEEEEE',
  systemGray5: '#F5F5F5',
  systemGray6: '#FAFAFA',
  systemBackground: '#FFFBFE',
  secondarySystemBackground: '#F5F5F5',
  groupedBackground: '#F5F5F5',
  label: '#1C1B1F',
  secondaryLabel: '#49454F',
  placeholderText: '#9E9E9E',
  separator: '#E0E0E0',
  opaqueSeparator: '#C7C7CC',

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

export const materialFonts = {
  // Font Sizes (Material Design 3)
  displayLarge: 57,
  displayMedium: 45,
  displaySmall: 36,
  headlineLarge: 32,
  headlineMedium: 28,
  headlineSmall: 24,
  titleLarge: 22,
  titleMedium: 16,
  titleSmall: 14,
  bodyLarge: 16,
  bodyMedium: 14,
  bodySmall: 12,
  labelLarge: 14,
  labelMedium: 12,
  labelSmall: 11,
  
  // Font Weights
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  
  // Font Family (Roboto for Android)
  system: 'Roboto, "Helvetica Neue", Arial, sans-serif',
  
  // Legacy Font Sizes (for compatibility)
  largeTitle: 32,
  title1: 28,
  title2: 24,
  title3: 22,
  headline: 18,
  body: 16,
  callout: 16,
  subhead: 15,
  footnote: 13,
  caption: 12,
  caption2: 11,
};

export const materialSpacing = {
  // Material Design spacing system
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
  
  // Touch targets (Material Design minimum: 48dp)
  minTouch: 48,
  
  // Safe areas (Android specific)
  safeTop: 24,
  safeBottom: 24,
};

export const materialRadius = {
  // Material Design corner radius
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const materialElevation = {
  // Material Design elevation system
  level0: 0,
  level1: 1,
  level2: 3,
  level3: 6,
  level4: 8,
  level5: 12,
};

export const materialComponents = {
  // Button
  button: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  
  // Input
  input: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
  },
  
  // Card
  card: {
    borderRadius: 12,
    elevation: 2,
  },
};
