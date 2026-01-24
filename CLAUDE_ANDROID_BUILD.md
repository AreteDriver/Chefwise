# Chefwise Android Build Runbook

> **For Claude Code execution.** Run these commands and prompts sequentially to build and prepare the Android app for Google Play Store.

---

## Project Context

- **App**: Chefwise - AI-powered recipe and meal planning app
- **Package**: `com.chefwise.app`
- **Build Path**: Flutter app at `/home/user/Chefwise/mobile`
- **Target**: Google Play Store (.aab bundle)

---

## Phase 1: Environment Verification

### 1.1 Check Flutter Installation

```bash
flutter --version
flutter doctor -v
```

**Expected**: Flutter 3.x installed, Android toolchain ready.

### 1.2 Check Android SDK

```bash
echo $ANDROID_HOME
ls $ANDROID_HOME/build-tools/ | tail -1
```

**Expected**: ANDROID_HOME set, build-tools 34+ present.

### 1.3 Check Java

```bash
java -version
echo $JAVA_HOME
```

**Expected**: Java 17+ installed.

### 1.4 Verify Project Structure

```bash
ls -la /home/user/Chefwise/mobile/android/app/
cat /home/user/Chefwise/mobile/pubspec.yaml | grep -A2 "^version:"
```

---

## Phase 2: Firebase Configuration

### 2.1 Check for google-services.json

```bash
if [ -f /home/user/Chefwise/mobile/android/app/google-services.json ]; then
    echo "✓ google-services.json exists"
    cat /home/user/Chefwise/mobile/android/app/google-services.json | grep -o '"package_name": "[^"]*"'
else
    echo "✗ MISSING: google-services.json"
    echo "ACTION: Download from Firebase Console → Project Settings → Android app"
fi
```

### 2.2 Verify Package Name Match

```bash
# Check AndroidManifest.xml package
grep -o 'package="[^"]*"' /home/user/Chefwise/mobile/android/app/src/main/AndroidManifest.xml

# Should match: com.chefwise.app
```

### 2.3 Verify Firebase Gradle Plugin

```bash
grep -l "google-services" /home/user/Chefwise/mobile/android/build.gradle
grep -l "google-services" /home/user/Chefwise/mobile/android/app/build.gradle
```

---

## Phase 3: App Signing Setup

### 3.1 Generate Release Keystore

```bash
mkdir -p ~/android-keys

# Generate keystore (interactive - requires user input)
keytool -genkey -v \
    -keystore ~/android-keys/chefwise-release.keystore \
    -alias chefwise \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass CHANGE_THIS_PASSWORD \
    -keypass CHANGE_THIS_PASSWORD \
    -dname "CN=Chefwise, OU=Mobile, O=Chefwise, L=City, ST=State, C=US"
```

**User Action Required**: Replace `CHANGE_THIS_PASSWORD` with secure password.

### 3.2 Create key.properties

```bash
cat > /home/user/Chefwise/mobile/android/key.properties << 'EOF'
storePassword=CHANGE_THIS_PASSWORD
keyPassword=CHANGE_THIS_PASSWORD
keyAlias=chefwise
storeFile=/home/user/android-keys/chefwise-release.keystore
EOF
```

**User Action Required**: Update passwords to match keystore.

### 3.3 Update .gitignore

```bash
# Ensure secrets are not committed
grep -q "key.properties" /home/user/Chefwise/.gitignore || echo "android/key.properties" >> /home/user/Chefwise/.gitignore
grep -q "*.keystore" /home/user/Chefwise/.gitignore || echo "*.keystore" >> /home/user/Chefwise/.gitignore
```

### 3.4 Configure build.gradle for Signing

Edit `/home/user/Chefwise/mobile/android/app/build.gradle`:

**Add at top of file (after plugins block):**
```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

**Add inside android {} block:**
```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
        storePassword keystoreProperties['storePassword']
    }
}
```

**Update buildTypes.release:**
```gradle
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

---

## Phase 4: Build Release

### 4.1 Clean and Get Dependencies

```bash
cd /home/user/Chefwise/mobile
flutter clean
flutter pub get
```

### 4.2 Build Release App Bundle

```bash
cd /home/user/Chefwise/mobile
flutter build appbundle --release
```

**Output**: `/home/user/Chefwise/mobile/build/app/outputs/bundle/release/app-release.aab`

### 4.3 Verify Build Output

```bash
ls -lh /home/user/Chefwise/mobile/build/app/outputs/bundle/release/app-release.aab
```

### 4.4 Build Debug APK (for testing)

```bash
cd /home/user/Chefwise/mobile
flutter build apk --debug
```

**Output**: `/home/user/Chefwise/mobile/build/app/outputs/flutter-apk/app-debug.apk`

### 4.5 Install on Device (if connected)

```bash
adb devices
adb install /home/user/Chefwise/mobile/build/app/outputs/flutter-apk/app-debug.apk
```

---

## Phase 5: Store Assets Preparation

### 5.1 App Icon Location

```bash
ls /home/user/Chefwise/mobile/android/app/src/main/res/mipmap-*/ic_launcher.png
```

**Required for Play Store**: 512x512 PNG (upload separately to Play Console)

### 5.2 Screenshot Capture Commands

```bash
# Capture screenshot from connected device
adb exec-out screencap -p > ~/chefwise-screenshot-$(date +%s).png

# List recent screenshots
ls -la ~/chefwise-screenshot-*.png
```

### 5.3 Generate Store Description

**Short Description (80 chars max):**
```
AI-powered recipes from your pantry. Smart meal planning made easy.
```

**Full Description:**
```
CHEFWISE - Your AI Kitchen Assistant

Transform the ingredients you already have into delicious meals with Chefwise, your intelligent cooking companion.

KEY FEATURES

• AI Recipe Generation - Get personalized recipes based on what's in your pantry
• Smart Pantry Tracking - Easily add ingredients, track expiration dates
• Intelligent Meal Planning - Plan your week with AI-suggested meals
• Step-by-Step Cooking - Clear instructions with built-in timers
• Cloud Sync - Your data syncs across all devices
• Dietary Support - Vegetarian, vegan, gluten-free, keto, and more

Never wonder "what's for dinner?" again. Download Chefwise today!
```

---

## Phase 6: Version Management

### 6.1 Check Current Version

```bash
grep "^version:" /home/user/Chefwise/mobile/pubspec.yaml
```

### 6.2 Bump Version

Edit `/home/user/Chefwise/mobile/pubspec.yaml`:

```yaml
# Format: version: MAJOR.MINOR.PATCH+BUILD
# Example: version: 1.0.0+1 → version: 1.0.1+2
version: 1.0.1+2
```

### 6.3 Rebuild After Version Bump

```bash
cd /home/user/Chefwise/mobile
flutter clean && flutter pub get && flutter build appbundle --release
```

---

## Phase 7: Pre-Submission Checklist

### 7.1 Verify Permissions

```bash
grep "<uses-permission" /home/user/Chefwise/mobile/android/app/src/main/AndroidManifest.xml
```

### 7.2 Check MinSdk

```bash
grep "minSdk" /home/user/Chefwise/mobile/android/app/build.gradle
```

**Expected**: minSdk 23 or higher

### 7.3 Verify Internet Permission

```bash
grep "INTERNET" /home/user/Chefwise/mobile/android/app/src/main/AndroidManifest.xml
```

### 7.4 Test Release Build Runs

```bash
cd /home/user/Chefwise/mobile
flutter build apk --release
adb install build/app/outputs/flutter-apk/app-release.apk
```

---

## Quick Commands Reference

| Task | Command |
|------|---------|
| Clean build | `cd /home/user/Chefwise/mobile && flutter clean` |
| Get deps | `cd /home/user/Chefwise/mobile && flutter pub get` |
| Debug APK | `cd /home/user/Chefwise/mobile && flutter build apk --debug` |
| Release APK | `cd /home/user/Chefwise/mobile && flutter build apk --release` |
| Release AAB | `cd /home/user/Chefwise/mobile && flutter build appbundle --release` |
| Install APK | `adb install [path-to-apk]` |
| Screenshot | `adb exec-out screencap -p > screenshot.png` |
| Check version | `grep "^version:" /home/user/Chefwise/mobile/pubspec.yaml` |

---

## File Paths Reference

| File | Path |
|------|------|
| Flutter app root | `/home/user/Chefwise/mobile` |
| pubspec.yaml | `/home/user/Chefwise/mobile/pubspec.yaml` |
| Android manifest | `/home/user/Chefwise/mobile/android/app/src/main/AndroidManifest.xml` |
| App build.gradle | `/home/user/Chefwise/mobile/android/app/build.gradle` |
| Project build.gradle | `/home/user/Chefwise/mobile/android/build.gradle` |
| key.properties | `/home/user/Chefwise/mobile/android/key.properties` |
| google-services.json | `/home/user/Chefwise/mobile/android/app/google-services.json` |
| Release AAB output | `/home/user/Chefwise/mobile/build/app/outputs/bundle/release/app-release.aab` |
| Release APK output | `/home/user/Chefwise/mobile/build/app/outputs/flutter-apk/app-release.apk` |
| Debug APK output | `/home/user/Chefwise/mobile/build/app/outputs/flutter-apk/app-debug.apk` |

---

## Play Store Manual Steps

These require browser/Play Console access:

1. **Create Developer Account**: https://play.google.com/console ($25 one-time)
2. **Create App**: Play Console → Create app → "Chefwise"
3. **Upload AAB**: Release → Production → Create release → Upload
4. **Store Listing**: Fill description, upload screenshots, feature graphic
5. **Content Rating**: Complete questionnaire
6. **Data Safety**: Declare: email (required), food preferences (optional)
7. **Submit**: Send for review (1-7 days)

---

## Troubleshooting Commands

### Gradle Issues
```bash
cd /home/user/Chefwise/mobile/android
./gradlew clean
./gradlew build --stacktrace
```

### Flutter Cache Issues
```bash
flutter clean
flutter pub cache repair
flutter pub get
```

### Check Build Errors
```bash
cd /home/user/Chefwise/mobile
flutter build appbundle --release -v
```

### Verify Keystore
```bash
keytool -list -v -keystore ~/android-keys/chefwise-release.keystore
```
