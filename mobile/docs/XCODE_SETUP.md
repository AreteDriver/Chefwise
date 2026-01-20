# Xcode Setup Guide

Complete guide for configuring ChefWise iOS build in Xcode.

---

## Prerequisites

- macOS 13+ (Ventura or later recommended)
- Xcode 15+ (from App Store)
- Apple Developer account (free for simulators, paid for device/App Store)
- Flutter SDK installed

```bash
# Install Xcode command line tools
xcode-select --install

# Install CocoaPods
sudo gem install cocoapods

# Accept Xcode license
sudo xcodebuild -license accept
```

---

## Initial Setup

### 1. Run Setup Script

```bash
cd mobile
chmod +x scripts/setup-ios.sh
./scripts/setup-ios.sh
```

Or manually:

```bash
flutter create . --platforms=ios,android
flutter pub get
cd ios && pod install
```

### 2. Open in Xcode

```bash
open ios/Runner.xcworkspace
```

> **Important:** Always open `.xcworkspace`, not `.xcodeproj`

---

## Signing Configuration

### For Simulator (No Apple Developer Account)

1. Open `ios/Runner.xcworkspace`
2. Select **Runner** in the project navigator
3. Select **Runner** target
4. Go to **Signing & Capabilities** tab
5. Uncheck "Automatically manage signing"
6. For Debug: Select "iOS Simulator" in dropdown (no team needed)

### For Device (Requires Apple Developer Account)

1. Open `ios/Runner.xcworkspace`
2. Select **Runner** target → **Signing & Capabilities**
3. Check ✓ "Automatically manage signing"
4. Select your **Team** from dropdown
5. Xcode will create provisioning profile automatically

### For App Store (Requires Paid Developer Account - $99/year)

1. Same as above, but select your paid team
2. Ensure bundle ID is registered in Apple Developer Portal
3. Create App Store provisioning profile

---

## Bundle Identifier

**Default:** `com.chefwise.app`

To change:

1. In Xcode: Runner target → General → Bundle Identifier
2. Update Firebase: Add new iOS app with new bundle ID in Firebase Console
3. Download new `GoogleService-Info.plist`

---

## Firebase Configuration

### 1. Add GoogleService-Info.plist

1. Download from [Firebase Console](https://console.firebase.google.com)
2. In Xcode: Right-click on `Runner` folder → "Add Files to Runner..."
3. Select `GoogleService-Info.plist`
4. Ensure "Copy items if needed" is checked
5. Ensure "Runner" target is checked

### 2. Configure Google Sign-In URL Scheme

1. Open `ios/Runner/Info.plist` in Xcode
2. Add URL Types:
   - Expand **URL Types** (or add if missing)
   - Click + to add new URL Type
   - **Identifier:** `google-signin`
   - **URL Schemes:** Your `REVERSED_CLIENT_ID` from GoogleService-Info.plist
     (e.g., `com.googleusercontent.apps.123456789-abcdef`)

Or edit `Info.plist` directly:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.googleusercontent.apps.YOUR-CLIENT-ID</string>
        </array>
    </dict>
</array>
```

---

## Capabilities

### Required Capabilities

Add in Xcode under **Signing & Capabilities** → **+ Capability**:

| Capability | Required For |
|------------|--------------|
| Push Notifications | Firebase Cloud Messaging (future) |
| Sign in with Apple | Alternative sign-in (future) |
| Keychain Sharing | Secure credential storage |

### Background Modes (Optional)

If needed for background sync:
- Background fetch
- Remote notifications

---

## Build Settings

### Minimum iOS Version

1. Select Runner target → General
2. Set **Minimum Deployments** → iOS 13.0+

Or in `ios/Podfile`:
```ruby
platform :ios, '13.0'
```

### Build Architectures

For Apple Silicon Macs, ensure these settings:

1. Runner target → Build Settings
2. Search "Excluded Architectures"
3. For Debug → Any iOS Simulator SDK: `arm64` (only if issues)

---

## Common Issues

### "No signing certificate"

**Fix:**
- For simulator: Uncheck "Automatically manage signing"
- For device: Sign in with Apple ID in Xcode → Preferences → Accounts

### "Module 'Firebase' not found"

**Fix:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
```

### "GoogleService-Info.plist not found"

**Fix:** Ensure file is added to Runner target:
1. Select file in Xcode
2. Check File Inspector (right panel)
3. Ensure "Runner" is checked under Target Membership

### Sandbox build error

**Fix:**
```bash
# Clean everything
flutter clean
cd ios && rm -rf Pods Podfile.lock
cd ios && pod install
flutter build ios
```

### CocoaPods version issues

**Fix:**
```bash
sudo gem install cocoapods
pod repo update
```

---

## Build Commands

### Debug Build
```bash
flutter build ios --debug
# or
make build-ios
```

### Release Build
```bash
flutter build ios --release
# or
make release-ios
```

### Run on Simulator
```bash
flutter run -d ios
# or
make run-ios
```

### Run on Device
```bash
flutter run -d <device-id>
# List devices: flutter devices
```

---

## App Store Submission Checklist

- [ ] Bundle ID registered in Apple Developer Portal
- [ ] App icons added (all sizes)
- [ ] Launch screen configured
- [ ] Privacy descriptions in Info.plist:
  - `NSCameraUsageDescription` (if using camera)
  - `NSPhotoLibraryUsageDescription` (if accessing photos)
- [ ] Version and build number set
- [ ] Release build tested on physical device
- [ ] Screenshots captured for all required sizes
- [ ] App Store Connect listing created

---

## Info.plist Privacy Descriptions

Add these to `ios/Runner/Info.plist` if using related features:

```xml
<!-- Camera access -->
<key>NSCameraUsageDescription</key>
<string>ChefWise needs camera access to scan ingredients and recipes</string>

<!-- Photo library -->
<key>NSPhotoLibraryUsageDescription</key>
<string>ChefWise needs photo access to import recipe images</string>

<!-- Face ID -->
<key>NSFaceIDUsageDescription</key>
<string>ChefWise uses Face ID for secure authentication</string>
```

---

## Useful Xcode Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘B | Build |
| ⌘R | Run |
| ⌘⇧K | Clean build folder |
| ⌘. | Stop running app |
| ⌘⇧O | Open quickly (search files) |

---

*Last updated: 2026-01-19*
