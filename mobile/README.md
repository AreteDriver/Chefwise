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
│   │   ├── onboarding/
│   │   ├── home/
│   │   ├── pantry/
│   │   ├── plan/
│   │   └── me/
│   ├── services/            # Business logic
│   │   ├── user_preferences_service.dart
│   │   ├── pantry_service.dart
│   │   └── meal_plan_service.dart
│   ├── theme/               # Design system
│   │   ├── app_colors.dart
│   │   ├── app_text_styles.dart
│   │   └── app_theme.dart
│   └── main.dart            # App entry point
├── assets/
│   ├── images/
│   └── icons/
├── pubspec.yaml
└── README.md
```

## State Management

The app uses Provider for state management:
- `UserPreferencesService`: Manages user preferences and onboarding state
- `PantryService`: Manages pantry inventory
- `MealPlanService`: Manages weekly meal plans

## Navigation

- Uses `IndexedStack` for efficient tab switching
- Custom onboarding flow with step-by-step navigation
- Bottom navigation bar with 4 tabs

## Dependencies

- `provider`: State management
- `google_fonts`: Typography (Poppins, Inter)
- `shared_preferences`: Local storage
- `flutter_svg`: SVG support
- `go_router`: Advanced routing (optional)

## License

MIT License - see LICENSE file for details
