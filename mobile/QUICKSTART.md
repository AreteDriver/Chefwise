# ChefWise Mobile App - Quick Start Guide

## Overview
ChefWise Mobile is a Flutter app implementing a comprehensive cooking assistant with Material 3 design.

## Prerequisites
- Flutter SDK 3.0.0 or higher
- Dart SDK 3.0.0 or higher
- Android Studio / Xcode (for mobile deployment)
- VS Code or Android Studio with Flutter plugin

## Installation

### 1. Install Flutter
```bash
# macOS/Linux
git clone https://github.com/flutter/flutter.git -b stable
export PATH="$PATH:`pwd`/flutter/bin"

# Verify installation
flutter doctor
```

### 2. Setup Project
```bash
cd mobile
flutter pub get
```

### 3. Run the App
```bash
# Run on connected device/emulator
flutter run

# Run on specific device
flutter devices
flutter run -d <device-id>

# Run on Chrome (web)
flutter run -d chrome
```

## Project Features

### ✅ Onboarding (4 Screens)
1. **Welcome** - App introduction and Get Started button
2. **Goals** - Multi-select chips for cooking goals
3. **Dietary Needs** - Multi-select dietary restrictions
4. **Cooking Profile** - Confidence slider and time selection

### ✅ Main Tabs (Bottom Navigation)
1. **Home** - Greeting, CTA, Quick Picks, Categories
2. **Pantry** - Search, Category groups, Add/Edit items
3. **Plan** - Weekly meal plan with macro targets
4. **Me** - Profile, Preferences, Subscription

### ✅ Recipe Flow
1. **Filters Sheet** - Customize recipe generation
2. **Results** - List of generated recipes
3. **Detail** - Full recipe with ingredients and steps
4. **Cook Mode** - Step-by-step carousel navigation

## File Structure
```
mobile/
├── lib/
│   ├── main.dart              # App entry point
│   ├── models/                # Data models
│   ├── screens/               # UI screens
│   ├── services/              # State management
│   └── theme/                 # Design system
├── assets/                    # Images and icons
├── pubspec.yaml               # Dependencies
└── README.md                  # Full documentation
```

## Key Dependencies
- `provider` - State management
- `google_fonts` - Typography (Poppins, Inter)
- `shared_preferences` - Local data storage

## Development Workflow

### Run in Debug Mode
```bash
flutter run
```

### Hot Reload
Press `r` in the terminal to hot reload changes

### Build for Production
```bash
# Android APK
flutter build apk --release

# iOS IPA
flutter build ios --release

# Web
flutter build web
```

## Testing
```bash
# Run all tests
flutter test

# Run with coverage
flutter test --coverage
```

## Common Issues

### Issue: "Waiting for another flutter command to release the startup lock"
**Solution:**
```bash
rm -rf /tmp/flutter_tools_lock_*
```

### Issue: "No connected devices"
**Solution:**
- For Android: Enable USB debugging and connect device
- For iOS: Use Xcode to setup provisioning
- For Web: Use `flutter run -d chrome`

### Issue: "Build failed"
**Solution:**
```bash
flutter clean
flutter pub get
flutter run
```

## Next Steps

1. **Run the app** - `flutter run`
2. **Complete onboarding** - Test the 4-screen flow
3. **Explore tabs** - Navigate through Home, Pantry, Plan, Me
4. **Generate recipe** - Use "Cook with What I Have" button
5. **Try cook mode** - Open a recipe and start cooking

## Resources
- [Flutter Documentation](https://docs.flutter.dev)
- [Material 3 Design](https://m3.material.io)
- [Provider Package](https://pub.dev/packages/provider)

## Support
For issues or questions, check the main repository README or open an issue on GitHub.
