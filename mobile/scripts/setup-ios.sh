#!/bin/bash
# ChefWise iOS Setup Script
# Run this on a Mac with Flutter SDK installed

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BUNDLE_ID="${BUNDLE_ID:-com.chefwise.app}"

cd "$PROJECT_DIR"

echo "=========================================="
echo "  ChefWise iOS Setup"
echo "=========================================="
echo ""

# Check prerequisites
check_prereqs() {
    echo "Checking prerequisites..."

    if ! command -v flutter &> /dev/null; then
        echo "ERROR: Flutter SDK not found"
        echo "Install from: https://docs.flutter.dev/get-started/install/macos"
        exit 1
    fi

    if ! command -v xcodebuild &> /dev/null; then
        echo "ERROR: Xcode not found"
        echo "Install from App Store or: xcode-select --install"
        exit 1
    fi

    if ! command -v pod &> /dev/null; then
        echo "WARNING: CocoaPods not found, installing..."
        sudo gem install cocoapods
    fi

    echo "✓ All prerequisites met"
    echo ""
}

# Generate platform files
generate_platforms() {
    echo "Generating platform files..."

    if [ ! -d "ios" ]; then
        flutter create . --platforms=ios,android
        echo "✓ Platform files generated"
    else
        echo "✓ Platform files already exist"
    fi
    echo ""
}

# Configure iOS project
configure_ios() {
    echo "Configuring iOS project..."

    # Update bundle identifier
    if [ -f "ios/Runner.xcodeproj/project.pbxproj" ]; then
        sed -i '' "s/PRODUCT_BUNDLE_IDENTIFIER = .*;/PRODUCT_BUNDLE_IDENTIFIER = $BUNDLE_ID;/g" \
            ios/Runner.xcodeproj/project.pbxproj
        echo "✓ Bundle ID set to: $BUNDLE_ID"
    fi

    # Update minimum iOS version for Firebase (iOS 13+)
    if [ -f "ios/Podfile" ]; then
        sed -i '' "s/platform :ios, '.*'/platform :ios, '13.0'/g" ios/Podfile
        echo "✓ Minimum iOS version set to 13.0"
    fi

    echo ""
}

# Check for Firebase config
check_firebase_config() {
    echo "Checking Firebase configuration..."

    PLIST_PATH="ios/Runner/GoogleService-Info.plist"

    if [ -f "$PLIST_PATH" ]; then
        echo "✓ GoogleService-Info.plist found"
    else
        echo ""
        echo "⚠️  GoogleService-Info.plist NOT FOUND"
        echo ""
        echo "To add Firebase config:"
        echo "1. Go to Firebase Console: https://console.firebase.google.com"
        echo "2. Select your project → Project Settings → Your apps"
        echo "3. Add iOS app with bundle ID: $BUNDLE_ID"
        echo "4. Download GoogleService-Info.plist"
        echo "5. Place it at: $PROJECT_DIR/ios/Runner/GoogleService-Info.plist"
        echo ""
        read -p "Press Enter after adding the file (or Ctrl+C to exit)..."

        if [ ! -f "$PLIST_PATH" ]; then
            echo "ERROR: GoogleService-Info.plist still not found"
            exit 1
        fi
    fi
    echo ""
}

# Configure Google Sign-In URL scheme
configure_google_signin() {
    echo "Configuring Google Sign-In..."

    PLIST_PATH="ios/Runner/GoogleService-Info.plist"
    INFO_PLIST="ios/Runner/Info.plist"

    if [ -f "$PLIST_PATH" ]; then
        # Extract REVERSED_CLIENT_ID from GoogleService-Info.plist
        REVERSED_CLIENT_ID=$(/usr/libexec/PlistBuddy -c "Print :REVERSED_CLIENT_ID" "$PLIST_PATH" 2>/dev/null || echo "")

        if [ -n "$REVERSED_CLIENT_ID" ]; then
            # Check if URL scheme already exists
            if ! grep -q "$REVERSED_CLIENT_ID" "$INFO_PLIST"; then
                # Add URL scheme for Google Sign-In
                /usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes array" "$INFO_PLIST" 2>/dev/null || true
                /usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0 dict" "$INFO_PLIST" 2>/dev/null || true
                /usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleTypeRole string Editor" "$INFO_PLIST"
                /usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes array" "$INFO_PLIST"
                /usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes:0 string $REVERSED_CLIENT_ID" "$INFO_PLIST"
                echo "✓ Google Sign-In URL scheme added: $REVERSED_CLIENT_ID"
            else
                echo "✓ Google Sign-In URL scheme already configured"
            fi
        else
            echo "⚠️  Could not extract REVERSED_CLIENT_ID from GoogleService-Info.plist"
        fi
    fi
    echo ""
}

# Install dependencies
install_deps() {
    echo "Installing dependencies..."

    flutter pub get
    echo "✓ Flutter dependencies installed"

    cd ios
    pod install
    cd ..
    echo "✓ CocoaPods dependencies installed"
    echo ""
}

# Build
build_ios() {
    echo "Building iOS app..."

    flutter build ios --debug
    echo ""
    echo "✓ Debug build complete"
    echo ""
}

# Summary
print_summary() {
    echo "=========================================="
    echo "  Setup Complete!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Open in Xcode:"
    echo "   open ios/Runner.xcworkspace"
    echo ""
    echo "2. Configure signing:"
    echo "   - Select Runner target"
    echo "   - Go to Signing & Capabilities"
    echo "   - Select your Team"
    echo "   - Enable 'Automatically manage signing'"
    echo ""
    echo "3. Run on device/simulator:"
    echo "   flutter run"
    echo ""
    echo "4. Build release:"
    echo "   flutter build ios --release"
    echo ""
}

# Main
main() {
    check_prereqs
    generate_platforms
    configure_ios
    check_firebase_config
    configure_google_signin
    install_deps

    read -p "Build debug version now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        build_ios
    fi

    print_summary
}

main "$@"
