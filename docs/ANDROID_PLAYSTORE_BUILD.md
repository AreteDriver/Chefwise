# Android Play Store Build Guide for Chefwise

A comprehensive guide with Claude Code prompts and commands to build, sign, and deploy Chefwise to the Google Play Store.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Path Selection: Capacitor vs Flutter](#path-selection)
3. [Environment Setup](#environment-setup)
4. [Firebase Configuration](#firebase-configuration)
5. [App Signing Setup](#app-signing-setup)
6. [Building Release APK/AAB](#building-release)
7. [Play Store Account Setup](#play-store-account)
8. [Store Listing Preparation](#store-listing)
9. [Upload & Review](#upload-and-review)
10. [Post-Launch](#post-launch)
11. [Claude Code Prompts Reference](#claude-prompts)

---

## Prerequisites

### Required Software

```bash
# Check if Java is installed (needed for Android builds)
java -version

# Check Android SDK (should show build-tools, platforms)
sdkmanager --list

# For Flutter path
flutter doctor

# For Capacitor path
node --version
npm --version
```

### Install Android Studio (if not installed)

```bash
# Ubuntu/Debian
sudo snap install android-studio --classic

# Or download from: https://developer.android.com/studio
```

### Claude Code Prompt: Verify Environment

```
Check my Android development environment. Verify I have:
1. Java JDK 17+ installed
2. Android SDK with build-tools 34+
3. ANDROID_HOME environment variable set
4. Flutter installed (if using Flutter path)

List any missing dependencies and how to install them.
```

---

## Path Selection

### Option A: Capacitor (Web Wrapper)

**Best for:** Fastest time to market, single codebase with web

| Pros | Cons |
|------|------|
| Uses existing Next.js code | Slightly slower performance |
| Single codebase | Web-based UI limitations |
| Faster iterations | Larger app size |

### Option B: Flutter (Native)

**Best for:** Best user experience, already built

| Pros | Cons |
|------|------|
| Native performance | Separate codebase to maintain |
| Already production-ready | Requires Dart knowledge |
| Smaller app size | Two codebases |

**Recommendation:** Use **Flutter** - it's already complete and provides better UX.

---

## Environment Setup

### For Flutter Path

```bash
# Navigate to Flutter app
cd /home/user/Chefwise/mobile

# Get dependencies
flutter pub get

# Verify setup
flutter doctor -v

# Check connected devices
flutter devices
```

### For Capacitor Path

```bash
# From project root
cd /home/user/Chefwise

# Install dependencies
npm install

# Build web app and sync to Android
npm run android:build

# Open in Android Studio
npm run android:open
```

### Claude Code Prompt: Setup Verification

```
I'm in the Chefwise project. Run the necessary commands to:
1. Verify my Flutter/Capacitor setup is correct
2. Check for any dependency issues
3. Ensure Android SDK is properly configured
4. List any errors that need fixing

Use the Flutter path in /mobile directory.
```

---

## Firebase Configuration

### Step 1: Get google-services.json

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (chefwise-app)
3. Click gear icon → Project Settings
4. Scroll to "Your apps" → Android app
5. Download `google-services.json`

### Step 2: Place Configuration File

**Flutter path:**
```bash
# Place file at:
/home/user/Chefwise/mobile/android/app/google-services.json
```

**Capacitor path:**
```bash
# Place file at:
/home/user/Chefwise/android/app/google-services.json
```

### Step 3: Verify Firebase Package Name

Ensure your Firebase Android app uses package name: `com.chefwise.app`

### Claude Code Prompt: Firebase Setup

```
Help me configure Firebase for Android:
1. Check if google-services.json exists in the correct location
2. Verify the package name matches com.chefwise.app
3. Ensure build.gradle files have the Google Services plugin configured
4. Test that Firebase initializes correctly

I'm using the Flutter path.
```

### Claude Code Prompt: Create Firebase App (if needed)

```
I need to register an Android app in Firebase. Generate the commands or
steps to:
1. Use Firebase CLI to add an Android app to my project
2. Download the google-services.json
3. Place it in the correct location for Flutter

My package name is com.chefwise.app
```

---

## App Signing Setup

### Step 1: Generate Release Keystore

```bash
# Create a directory for keys (keep this secure!)
mkdir -p ~/android-keys

# Generate keystore
keytool -genkey -v \
  -keystore ~/android-keys/chefwise-release.keystore \
  -alias chefwise \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

You'll be prompted for:
- Keystore password (remember this!)
- Key password (can be same as keystore)
- Your name, organization, location

### Step 2: Create key.properties (Flutter)

Create file at `/home/user/Chefwise/mobile/android/key.properties`:

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=chefwise
storeFile=/home/YOUR_USERNAME/android-keys/chefwise-release.keystore
```

**IMPORTANT:** Add to `.gitignore`:
```
# Signing keys
android/key.properties
*.keystore
*.jks
```

### Step 3: Configure build.gradle for Signing (Flutter)

Edit `/home/user/Chefwise/mobile/android/app/build.gradle`:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config ...

    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Claude Code Prompt: Setup App Signing

```
Help me set up Android app signing for Play Store release:
1. Generate a release keystore at ~/android-keys/chefwise-release.keystore
2. Create key.properties file for Flutter (don't commit passwords - use placeholders)
3. Update android/app/build.gradle to use the signing config
4. Add the sensitive files to .gitignore
5. Verify the signing configuration is correct

Walk me through each step and explain what I need to fill in manually.
```

---

## Building Release

### Flutter Release Build

```bash
cd /home/user/Chefwise/mobile

# Clean previous builds
flutter clean

# Get dependencies
flutter pub get

# Build Android App Bundle (recommended for Play Store)
flutter build appbundle --release

# Output location:
# build/app/outputs/bundle/release/app-release.aab

# OR build APK (for direct installation/testing)
flutter build apk --release

# Output location:
# build/app/outputs/flutter-apk/app-release.apk
```

### Capacitor Release Build

```bash
cd /home/user/Chefwise

# Build web app
npm run build

# Sync with Android
npx cap sync android

# Open Android Studio
npx cap open android

# In Android Studio:
# Build → Generate Signed Bundle / APK
# Select Android App Bundle
# Choose your keystore
# Select release build variant
```

### Claude Code Prompt: Build Release

```
Build a release version of the Chefwise Android app:
1. Clean any previous builds
2. Ensure all dependencies are up to date
3. Build the release App Bundle (.aab) for Play Store
4. Tell me the exact file path of the generated .aab file
5. Show me the file size

Use the Flutter path in /mobile directory.
```

### Claude Code Prompt: Build Debug for Testing

```
Build a debug APK of Chefwise that I can install directly on my phone for testing:
1. Build a debug APK
2. Tell me how to install it via ADB
3. Provide the ADB install command

Use Flutter in /mobile directory.
```

---

## Play Store Account Setup

### Step 1: Create Developer Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Sign in with Google account
3. Pay one-time $25 registration fee
4. Complete identity verification (can take 1-2 days)

### Step 2: Create App Listing

1. Click "Create app"
2. Enter app details:
   - App name: **Chefwise**
   - Default language: English (US)
   - App or game: **App**
   - Free or paid: **Free**
3. Accept declarations

### Required Information Checklist

| Item | Status | Notes |
|------|--------|-------|
| App name | ✅ | Chefwise |
| Package name | ✅ | com.chefwise.app |
| Privacy policy | ✅ | /privacy page exists |
| Terms of service | ✅ | /terms page exists |
| App icon | ✅ | Already configured |
| Feature graphic | ❌ | Need 1024x500 px |
| Screenshots | ❌ | Need phone + tablet |
| Short description | ❌ | 80 chars max |
| Full description | ❌ | 4000 chars max |

---

## Store Listing Preparation

### App Icon Requirements

- Size: 512x512 px
- Format: PNG (32-bit with alpha)
- Already exists at: `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`

### Feature Graphic

Create a 1024x500 px promotional image.

### Screenshots Required

| Device Type | Minimum | Recommended Size |
|-------------|---------|------------------|
| Phone | 2 | 1080x1920 px |
| 7" Tablet | 2 | 1200x1920 px |
| 10" Tablet | 2 | 1600x2560 px |

### Claude Code Prompt: Generate Store Description

```
Write Google Play Store listing content for Chefwise:

1. Short description (max 80 characters):
   - Catchy, includes key benefit

2. Full description (max 4000 characters):
   - Key features with bullet points
   - How AI recipe generation works
   - Pantry tracking benefits
   - Meal planning features
   - Include relevant keywords for ASO

3. Keywords/tags to target

Base this on the actual features in the app. Read the Flutter app code
to understand all features.
```

### Claude Code Prompt: Screenshot Automation

```
Help me capture screenshots for the Play Store:
1. List all the key screens I should screenshot
2. Provide ADB commands to capture screenshots from a connected device
3. Suggest the best flow/order to showcase the app
4. Tell me how to capture both phone and tablet sizes

Based on the Chefwise Flutter app screens.
```

### Sample Store Description

**Short Description (80 chars):**
```
AI-powered recipes from your pantry. Smart meal planning made easy.
```

**Full Description:**
```
🍳 CHEFWISE - Your AI Kitchen Assistant

Transform the ingredients you already have into delicious meals with Chefwise,
your intelligent cooking companion.

✨ KEY FEATURES

🥘 AI Recipe Generation
• Get personalized recipes based on what's in your pantry
• Specify dietary preferences and restrictions
• Discover new dishes you never knew you could make

📦 Smart Pantry Tracking
• Easily add ingredients by scanning or typing
• Track expiration dates to reduce food waste
• Get notified when items are running low

📅 Intelligent Meal Planning
• Plan your week with AI-suggested meals
• Automatic shopping list generation
• Balance nutrition across your meal plan

👨‍🍳 Step-by-Step Cooking
• Clear, easy-to-follow instructions
• Built-in timers for perfect results
• Scale recipes for any serving size

🔐 SYNC ACROSS DEVICES
Your pantry, recipes, and meal plans sync seamlessly across all your devices
with secure cloud backup.

🌱 DIETARY PREFERENCES
Supports vegetarian, vegan, gluten-free, dairy-free, keto, and many more
dietary requirements.

Download Chefwise today and never wonder "what's for dinner?" again!
```

---

## Upload and Review

### Step 1: Upload App Bundle

1. In Play Console, go to: Release → Production
2. Click "Create new release"
3. Upload your `.aab` file
4. Add release notes

### Step 2: Complete Store Listing

Navigate through all sections in Play Console:

- **Main store listing**: Description, screenshots, icon
- **Categorization**: Food & Drink → Recipes
- **Contact details**: Support email
- **Privacy policy**: `https://your-domain.com/privacy`

### Step 3: Content Rating

1. Go to: Policy → App content → Content rating
2. Complete the questionnaire (~10 minutes)
3. Questions cover: violence, sexuality, language, etc.
4. Chefwise should receive: **Everyone** rating

### Step 4: Target Audience

1. Go to: Policy → App content → Target audience
2. Select: **18 and over** (simplest, avoids COPPA requirements)

### Step 5: Data Safety

1. Go to: Policy → App content → Data safety
2. Declare what data you collect:

| Data Type | Collected | Shared | Required |
|-----------|-----------|--------|----------|
| Email | Yes | No | Yes (auth) |
| Name | Yes | No | No |
| Food preferences | Yes | No | No |
| Pantry items | Yes | No | No |

### Step 6: Submit for Review

1. Review all sections show ✅
2. Click "Send for review"
3. Initial review: 1-7 days (usually 2-3)

### Claude Code Prompt: Pre-submission Checklist

```
Create a pre-submission checklist for the Chefwise Play Store release:
1. Verify the app builds without errors
2. Check all required permissions are declared in AndroidManifest.xml
3. Verify privacy policy and terms URLs are accessible
4. List all data the app collects (for Data Safety section)
5. Confirm the app meets Google Play policies
6. Check for any obvious issues that might cause rejection

Review the actual code and configuration files.
```

---

## Post-Launch

### Monitor Crash Reports

```bash
# View crashes in Play Console:
# Quality → Android Vitals → Crashes & ANRs
```

### Respond to Reviews

- Aim to respond within 24-48 hours
- Be professional and helpful
- Offer support email for complex issues

### Release Updates

```bash
cd /home/user/Chefwise/mobile

# Increment version in pubspec.yaml
# version: 1.0.1+2  (version name + build number)

# Build new release
flutter build appbundle --release

# Upload to Play Console → Create new release
```

### Claude Code Prompt: Version Bump

```
Prepare a new version release for Chefwise:
1. Read current version from pubspec.yaml
2. Increment the version (patch bump: 1.0.0 → 1.0.1)
3. Increment the build number
4. Update any changelog
5. Build the new release bundle

Show me what changed and the new version number.
```

---

## Claude Prompts Reference

### Quick Reference Card

| Task | Prompt |
|------|--------|
| **Setup** | `Verify my Android build environment for Chefwise` |
| **Firebase** | `Configure Firebase for Android with google-services.json` |
| **Signing** | `Set up release signing with keystore for Play Store` |
| **Debug Build** | `Build debug APK for testing on my device` |
| **Release Build** | `Build release AAB for Play Store submission` |
| **Store Listing** | `Write Play Store description for Chefwise` |
| **Screenshots** | `Help capture Play Store screenshots with ADB` |
| **Version Bump** | `Increment version and build new release` |
| **Troubleshoot** | `Debug Android build error: [paste error]` |

### Full Prompt Templates

#### Initial Project Setup
```
I want to build the Chefwise Android app for the Google Play Store.

Please:
1. Verify my development environment is ready
2. Check that all dependencies are installed
3. Identify any configuration issues
4. Create a step-by-step plan to get to a signed release build

I'll be using the Flutter app in the /mobile directory.
```

#### Troubleshooting Build Errors
```
I'm getting this error when building the Chefwise Android app:

[PASTE ERROR HERE]

Please:
1. Explain what's causing this error
2. Show me exactly how to fix it
3. Verify the fix worked by rebuilding
```

#### Complete Release Workflow
```
Walk me through the complete Android release process for Chefwise:

1. Ensure environment is set up correctly
2. Configure Firebase (check google-services.json)
3. Set up app signing with keystore
4. Build a release App Bundle
5. List what I need to do manually in Play Console

Stop and ask me for any information you need (like keystore passwords).
```

#### Pre-Release Testing
```
Before I submit Chefwise to the Play Store, help me test it:

1. Build a release APK
2. Show me how to install it on my physical device
3. List the key flows I should manually test
4. Check for any obvious issues in the build output
```

#### Update Existing App
```
I need to release an update for Chefwise on the Play Store:

1. What version is currently in pubspec.yaml?
2. Bump the version appropriately
3. Build a new release bundle
4. Show me the release notes format for Play Console
```

---

## Troubleshooting

### Common Issues

#### "JAVA_HOME not set"
```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
```

#### "SDK location not found"
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

#### "Keystore was tampered with"
- Verify keystore password is correct
- Ensure keystore file isn't corrupted
- Regenerate if necessary (but loses ability to update existing app!)

#### Gradle build fails
```bash
cd mobile/android
./gradlew clean
./gradlew build --stacktrace
```

#### Flutter build cache issues
```bash
flutter clean
flutter pub cache repair
flutter pub get
```

### Claude Code Prompt: Debug Any Issue
```
I'm having this issue with my Chefwise Android build:

[DESCRIBE ISSUE OR PASTE ERROR]

Please:
1. Diagnose the root cause
2. Provide the fix
3. Verify it's resolved
4. Explain how to prevent this in the future
```

---

## File Locations Reference

| File | Path |
|------|------|
| Flutter app | `/home/user/Chefwise/mobile/` |
| Capacitor app | `/home/user/Chefwise/android/` |
| Flutter pubspec | `/home/user/Chefwise/mobile/pubspec.yaml` |
| Android Manifest (Flutter) | `/home/user/Chefwise/mobile/android/app/src/main/AndroidManifest.xml` |
| build.gradle (Flutter) | `/home/user/Chefwise/mobile/android/app/build.gradle` |
| Firebase config | `[app]/android/app/google-services.json` |
| Key properties | `/home/user/Chefwise/mobile/android/key.properties` |
| Release AAB | `/home/user/Chefwise/mobile/build/app/outputs/bundle/release/app-release.aab` |
| Release APK | `/home/user/Chefwise/mobile/build/app/outputs/flutter-apk/app-release.apk` |

---

## Next Steps After This Guide

1. ⬜ Create Google Play Developer account ($25)
2. ⬜ Download `google-services.json` from Firebase
3. ⬜ Generate release keystore
4. ⬜ Build release AAB
5. ⬜ Create feature graphic (1024x500)
6. ⬜ Capture screenshots (phone + tablet)
7. ⬜ Write store description
8. ⬜ Complete Play Console setup
9. ⬜ Submit for review
10. ⬜ 🎉 Launch!

---

*Generated for Chefwise Android Play Store deployment*
*Last updated: January 2026*
