# Xcode 15.4 Download Guide for macOS 14.8.1

## Recommended Version: Xcode 15.4

**Compatibility:**
- Your macOS: 14.8.1 (Sonoma) ✅
- Xcode 15.4: Supports macOS 13.4+ and 14.x ✅
- Download size: ~11-12 GB
- Installation time: ~30-60 minutes

## How to Download:

### Step 1: Go to Apple Developer Downloads
https://developer.apple.com/download/all/

### Step 2: Sign In
- Click "Sign In" at the top right
- Use your Apple ID (the same account you use for App Store)

### Step 3: Find and Download Xcode 15.4
- Search for "Xcode 15.4" or "Xcode 15.3"
- Click the download button
- File will be named: `Xcode_15.4.xip` (or similar)
- Size: ~11-12 GB

### Step 4: Install Xcode
1. Wait for download to complete (can take 1-2 hours depending on internet)
2. Double-click the `.xip` file to extract it
3. Extraction can take 10-15 minutes
4. When complete, you'll see Xcode.app
5. Drag it to Applications folder
6. Open Xcode once to accept license agreement

### Step 5: Install Additional Tools
Open Terminal and run:
```bash
sudo gem install cocoapods
```

### Step 6: Verify Installation
```bash
xcodebuild -version
# Should show: Xcode 15.4
```

### Step 7: Run Your iOS App
```bash
cd /Users/laikinas/Desktop/warrilo-mobile
npm install  # Install dependencies if not done
npm run ios  # Build and run iOS app
```

## Alternative Versions:
If 15.4 is not available:
- Xcode 15.3 - Also compatible
- Xcode 15.2 - Also compatible
- Xcode 15.1 - Also compatible

**Do NOT download:**
- Xcode 16.0 or 16.1 (requires macOS 15.1+)






