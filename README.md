# Warrilo Mobile App

A comprehensive warranty management mobile application built with Expo and React Native.

## Features

- **Warranty Tracking**: Keep track of all your device warranties in one place
- **Receipt Management**: Store and organize receipts with OCR scanning (PRO)
- **Smart Alerts**: Get notified before warranties expire
- **Family Sharing**: Share warranties with family members (PRO)
- **Cross-Platform**: Works on both iOS and Android

## Getting Started

### Prerequisites

- Node.js 18+ 
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your actual API keys and configuration.

4. Start the development server:
   ```bash
   npm run dev
   ```

### Running on Devices

#### iOS Simulator
```bash
npm run dev
# Press 'i' to open iOS simulator
```

#### Android Emulator
```bash
npm run dev
# Press 'a' to open Android emulator
```

#### Physical Device
1. Install Expo Go app on your device
2. Scan the QR code from the development server

## Building for Production

### Using EAS Build

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Configure EAS:
   ```bash
   eas login
   eas build:configure
   ```

3. Build for iOS:
   ```bash
   npm run build:ios
   ```

4. Build for Android:
   ```bash
   npm run build:android
   ```

## Environment Variables

The following environment variables need to be configured for production:

```env
# Authentication
AUTH_SECRET=your_auth_secret_here
AUTH_ISSUER=your_auth_issuer_here

# Database
DATABASE_URL=your_database_url_here
DATABASE_SECRET=your_database_secret_here

# Storage
STORAGE_ACCESS_KEY=your_storage_access_key_here
STORAGE_SECRET_KEY=your_storage_secret_key_here
STORAGE_BUCKET=your_storage_bucket_here

# Payments
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here

# OCR Service
OCR_API_KEY=your_ocr_api_key_here
OCR_API_URL=your_ocr_api_url_here

# Push Notifications
PUSH_NOTIFICATION_KEY=your_push_notification_key_here
```

## Integration Stubs

This demo includes stub implementations for:

- **Authentication**: Mock login/signup flow
- **Database**: Local storage simulation
- **File Storage**: Mock image upload
- **Payments**: Stripe integration stub
- **OCR**: Receipt scanning simulation
- **Push Notifications**: Notification scheduling stub

## PRO Features

PRO features are visually implemented but disabled in this demo. Interacting with PRO-only elements will show an upgrade modal. PRO features include:

- Unlimited devices
- OCR receipt extraction
- Family sharing
- Email integration
- Advanced alerts
- Priority support

## Project Structure

```
src/
├── components/          # Reusable UI components
├── data/               # Mock data and types
├── lib/                # Services and utilities
├── screens/            # Screen components (if using screen-based routing)
└── styles/             # Theme and styling

app/                    # Expo Router pages
├── (tabs)/            # Tab-based navigation
├── welcome.tsx        # Welcome screen
├── login.tsx          # Login screen
├── add-device.tsx     # Add device screen
├── device-details.tsx # Device details screen
├── settings.tsx       # Settings screen
└── plan-selection.tsx # Plan selection screen
```

## Testing

The app includes comprehensive mock data for testing all flows:

- Device management with various warranty statuses
- Alert notifications
- User profile with family sharing
- Settings with PRO feature toggles
- Plan comparison and upgrade flow

## Deployment

1. Configure app signing and provisioning profiles
2. Update app.json with production configuration
3. Build production versions using EAS Build
4. Submit to app stores using EAS Submit

## Support

For support and questions, please refer to the in-app Help & Support section or contact the development team.