# Platform-Adaptive Styling Migration Guide

## Overview
This guide helps you migrate from the old iOS-only styling system to the new platform-adaptive system.

## What Changed

### Before (iOS-only)
```typescript
import { iosColors, iosFonts, iosSpacing, iosRadius } from '@/src/styles/iosDesignSystem';

const styles = StyleSheet.create({
  button: {
    backgroundColor: iosColors.systemBlue,
    padding: iosSpacing.md,
    borderRadius: iosRadius.md,
  }
});
```

### After (Platform-adaptive)
```typescript
import { theme } from '@/src/styles/theme';

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.systemBlue, // Automatically adapts to platform
    padding: theme.spacing.md,               // Automatically adapts to platform
    borderRadius: theme.borderRadius.md,     // Automatically adapts to platform
  }
});
```

## Migration Steps

### 1. Replace Direct Imports
**Remove:**
```typescript
import { iosColors, iosFonts, iosSpacing, iosRadius } from '@/src/styles/iosDesignSystem';
```

**Add:**
```typescript
import { theme } from '@/src/styles/theme';
```

### 2. Update Style References
**Old:**
```typescript
iosColors.systemBlue → theme.colors.systemBlue
iosFonts.title1 → theme.fontSize.title1
iosSpacing.lg → theme.spacing.lg
iosRadius.md → theme.borderRadius.md
```

**New:**
```typescript
theme.colors.systemBlue
theme.fontSize.title1
theme.spacing.lg
theme.borderRadius.md
```

### 3. Update Shadow References
**Old:**
```typescript
...theme.shadows.sm
```

**New:**
```typescript
...theme.shadows.sm  // Still works, now platform-adaptive
```

## Platform Behavior

### iOS
- Uses iOS Human Interface Guidelines
- SF Pro Display fonts
- iOS-specific colors and spacing
- iOS-style shadows and elevation

### Android
- Uses Material Design 3
- Roboto fonts
- Material Design colors and spacing
- Material Design elevation system

### Web
- Defaults to iOS styling (as requested)
- Consistent with iOS experience

## Benefits

1. **Automatic Platform Adaptation**: No more manual platform checks
2. **Consistent API**: Same theme object works everywhere
3. **Better UX**: Native look and feel on each platform
4. **Easier Maintenance**: Single source of truth for styles
5. **Future-Proof**: Easy to add new platforms

## Examples

### Button Component
```typescript
const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.systemBlue,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  }
});
```

### Card Component
```typescript
const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.systemBackground,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  }
});
```

### Text Component
```typescript
const styles = StyleSheet.create({
  title: {
    fontSize: theme.fontSize.title1,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.label,
    marginBottom: theme.spacing.md,
  }
});
```

## Testing

### iOS Simulator
- Should look like native iOS app
- iOS colors, fonts, and spacing

### Android Emulator
- Should look like native Android app
- Material Design colors, fonts, and spacing

### Web Browser
- Should look like iOS app
- iOS styling and behavior

## Troubleshooting

### Styles Not Updating
1. Clear Metro cache: `npx expo start --clear`
2. Restart development server
3. Check import paths

### Platform Detection Issues
1. Verify Platform import: `import { Platform } from 'react-native'`
2. Check platform detection logic in `platformStyles.js`

### TypeScript Errors
1. Update type definitions if needed
2. Check for missing imports
3. Verify theme object structure
