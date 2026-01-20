# ChefWise Mobile App

A Flutter mobile application for ChefWise - an AI-powered cooking assistant.

## Features

### Onboarding Flow
- Welcome screen with app introduction
- Goal selection (High protein, Low fat, Quick meals, etc.)
- Dietary needs selection (Vegetarian, Vegan, Gluten-free, etc.)
- Cooking confidence and time preferences

### Main Tabs

#### Home Tab
- Personalized greeting with user's name
- "Cook with What I Have" call-to-action button
- Quick Picks carousel with recipe suggestions
- Popular categories (Breakfast, Lunch, Dinner, etc.)

#### Pantry Tab
- Search functionality for pantry items
- Items organized by categories (Proteins, Veggies, Grains, etc.)
- Add new items via bottom sheet
- Edit and delete existing items

#### Plan Tab
- Weekly meal plan with daily meal cards
- Macro targets summary (Calories, Protein, Carbs, Fat)
- Breakfast, lunch, dinner, and snack suggestions
- Regenerate and adjust goals functionality

#### Me Tab
- User profile with avatar
- Preferences management (Dietary needs, Cuisines, Time & Skill)
- Subscription upgrade option (Pro version)
- Settings and support options

## Design System

### Colors
- **Primary**: Warm orange/coral (#FF6B35)
- **Background**: Light grey/off-white (#F5F5F5)
- **Surface**: White (#FFFFFF)

### Typography
- **Titles**: 20-22pt, bold (Poppins)
- **Body**: 14-16pt, high contrast (Inter)

### Components
- Material 3 design
- Custom theme with consistent spacing
- Rounded corners (12px border radius)
- Elevated buttons with shadows
- FilterChips and ChoiceChips for selections

## Getting Started

### Prerequisites
- Flutter SDK 3.0.0 or higher
- Dart SDK
- Firebase project (shared with web app)

### Firebase Setup

The app uses Firebase for authentication, data sync, and AI features. Follow these steps to configure Firebase:

#### 1. Generate Native Platform Files

If `android/` and `ios/` folders don't exist, generate them:

```bash
cd mobile
flutter create .
```

#### 2. Android Configuration

1. **Download `google-services.json`**:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project → Project Settings → Your apps → Android
   - Download `google-services.json`
   - Place it in `android/app/`

2. **Update `android/build.gradle`**:
   ```gradle
   buildscript {
       dependencies {
           // Add this line
           classpath 'com.google.gms:google-services:4.4.0'
       }
   }
   ```

3. **Update `android/app/build.gradle`**:
   ```gradle
   plugins {
       id 'com.android.application'
       id 'kotlin-android'
       id 'dev.flutter.flutter-gradle-plugin'
       id 'com.google.gms.google-services'  // Add this line
   }

   android {
       defaultConfig {
           minSdk = 23  // Required for Firebase Auth
       }
   }
   ```

#### 3. iOS Configuration

1. **Download `GoogleService-Info.plist`**:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project → Project Settings → Your apps → iOS
   - Download `GoogleService-Info.plist`
   - Place it in `ios/Runner/`
   - Add to Xcode: Open `ios/Runner.xcworkspace`, drag file into Runner folder

2. **Update `ios/Runner/Info.plist`** for Google Sign-In:
   ```xml
   <key>CFBundleURLTypes</key>
   <array>
       <dict>
           <key>CFBundleTypeRole</key>
           <string>Editor</string>
           <key>CFBundleURLSchemes</key>
           <array>
               <!-- Replace with your REVERSED_CLIENT_ID from GoogleService-Info.plist -->
               <string>com.googleusercontent.apps.YOUR-CLIENT-ID</string>
           </array>
       </dict>
   </array>
   ```

#### 4. Enable Firebase Services

In Firebase Console, enable:
- **Authentication** → Sign-in method → Google
- **Cloud Firestore** → Create database (start in test mode for development)
- **Cloud Functions** (requires Blaze plan for calling functions)

### Installation

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
flutter pub get
```

3. Run the app:
```bash
flutter run
```

### Build for Production

#### Android
```bash
flutter build apk --release
```

#### iOS
```bash
flutter build ios --release
```

## Project Structure

```
mobile/
├── lib/
│   ├── models/              # Data models
│   │   ├── user_preferences.dart
│   │   ├── pantry_item.dart
│   │   ├── recipe.dart
│   │   └── meal_plan.dart
│   ├── screens/             # UI screens
│   │   ├── auth/
│   │   │   └── sign_in_screen.dart
│   │   ├── onboarding/
│   │   ├── home/
│   │   ├── pantry/
│   │   ├── plan/
│   │   ├── recipe/
│   │   └── me/
│   ├── services/            # Business logic + Firebase
│   │   ├── auth_service.dart           # Google Sign-In
│   │   ├── user_preferences_service.dart
│   │   ├── pantry_service.dart
│   │   ├── recipe_service.dart
│   │   ├── meal_plan_service.dart
│   │   └── cloud_functions_service.dart  # AI generation
│   ├── theme/               # Design system
│   │   ├── app_colors.dart
│   │   ├── app_text_styles.dart
│   │   └── app_theme.dart
│   └── main.dart            # App entry point
├── assets/
│   ├── images/
│   └── icons/
├── android/                 # Generated with `flutter create .`
│   └── app/
│       └── google-services.json  # Firebase config (from console)
├── ios/                     # Generated with `flutter create .`
│   └── Runner/
│       └── GoogleService-Info.plist  # Firebase config (from console)
├── pubspec.yaml
└── README.md
```

## State Management

The app uses Provider for state management with Firebase integration:
- `AuthService`: Firebase Auth + Google Sign-In
- `UserPreferencesService`: User preferences synced to Firestore (`users` collection)
- `PantryService`: Pantry inventory synced to Firestore (`pantryItems` collection)
- `RecipeService`: Saved recipes + Cloud Functions for AI generation
- `MealPlanService`: Meal plans synced to Firestore (`mealPlans` collection)

## Navigation

- Uses `IndexedStack` for efficient tab switching
- Custom onboarding flow with step-by-step navigation
- Bottom navigation bar with 4 tabs

## Dependencies

### Core
- `provider`: State management
- `google_fonts`: Typography (Poppins, Inter)
- `shared_preferences`: Local storage (offline cache)
- `flutter_svg`: SVG support

### Firebase
- `firebase_core`: Firebase initialization
- `firebase_auth`: Authentication
- `cloud_firestore`: Real-time database
- `cloud_functions`: AI recipe/meal plan generation
- `google_sign_in`: Google OAuth

## License

MIT License - see LICENSE file for details
