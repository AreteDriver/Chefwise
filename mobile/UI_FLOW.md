# ChefWise Mobile App - UI Flow Documentation

## Application Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     APP LAUNCH                               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Check Onboarding?     │
              └────────────────────────┘
                     │         │
        Not Complete │         │ Complete
                     │         │
                     ▼         ▼
          ┌──────────────┐  ┌────────────────┐
          │  ONBOARDING  │  │   MAIN APP     │
          └──────────────┘  └────────────────┘
```

## Onboarding Flow (4 Screens)

```
┌────────────────┐      ┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│  1. Welcome    │ ───▶ │  2. Goals      │ ───▶ │ 3. Dietary     │ ───▶ │ 4. Confidence  │
│                │      │                │      │    Needs       │      │    & Time      │
│  • Logo        │      │  • Multi-      │      │  • Multi-      │      │  • Slider      │
│  • Title       │      │    select      │      │    select      │      │  • Time chips  │
│  • Subtitle    │      │    chips       │      │    chips       │      │  • Complete    │
│  • Get Started │      │  • Continue    │      │  • Continue    │      │                │
└────────────────┘      └────────────────┘      └────────────────┘      └────────────────┘
```

## Main App Navigation

```
┌─────────────────────────────────────────────────────────────┐
│                  BOTTOM NAVIGATION BAR                       │
├─────────────┬─────────────┬─────────────┬──────────────────┤
│    Home     │   Pantry    │    Plan     │       Me         │
│   (Active)  │             │             │                  │
└─────────────┴─────────────┴─────────────┴──────────────────┘
```

## Home Tab Flow

```
Home Tab
├── Greeting Section
│   ├── "Hey [User], what's for dinner tonight?"
│   └── Subtitle
│
├── Cook with What I Have (CTA Button)
│   │
│   ├──▶ Recipe Filters Sheet
│   │    ├── Meal Type (Chips)
│   │    ├── Difficulty (Chips)
│   │    ├── Max Time (Slider)
│   │    ├── Tags (Multi-select)
│   │    └── Generate Button
│   │
│   └──▶ Recipe Results Screen
│        ├── Recipe Cards
│        │   ├── Image
│        │   ├── Title
│        │   ├── Quick Info (Time, Calories, Servings)
│        │   ├── Macros (P, C, F)
│        │   └── Tags
│        │
│        └──▶ Recipe Detail Screen
│             ├── Header Image
│             ├── Quick Info Row
│             ├── Macros Section
│             ├── Tabs (Ingredients | Steps)
│             │   ├── Ingredients (with checkboxes)
│             │   └── Steps (numbered)
│             │
│             └──▶ Cook Mode Screen
│                  ├── Progress Bar
│                  ├── Step Carousel
│                  │   ├── Step Number Badge
│                  │   ├── Step Text
│                  │   └── Tips (first/last step)
│                  └── Navigation (Previous | Next/Finish)
│
├── Quick Picks (Horizontal Scroll)
│   └── Recipe Cards (5 items)
│
└── Popular Categories (Chips)
    └── 6 Category Chips
```

## Pantry Tab Flow

```
Pantry Tab
├── Header
│   ├── "My Pantry"
│   └── Subtitle
│
├── Search Bar
│
├── Items by Category
│   ├── Proteins
│   ├── Veggies
│   ├── Grains
│   ├── Dairy
│   ├── Spices
│   ├── Canned Goods
│   ├── Frozen
│   └── Other
│
└── Floating Action Button
    │
    └──▶ Add Item Sheet
         ├── Item Name
         ├── Category (Dropdown)
         ├── Quantity & Unit
         └── Add Button
```

## Plan Tab Flow

```
Plan Tab
├── Header
│   ├── "This Week's Plan"
│   └── Macro Targets (Cal, P, C, F)
│
├── Daily Meal Cards (7 days)
│   ├── Day Name & Date
│   ├── Total Calories
│   ├── Breakfast
│   ├── Lunch
│   ├── Dinner
│   └── Snack (optional)
│
└── Action Buttons
    ├── Regenerate Week
    └── Adjust Goals
```

## Me Tab Flow

```
Me Tab
├── Profile Section
│   ├── Avatar
│   ├── Name
│   └── Plan Type (Free/Pro)
│
├── Preferences
│   ├── Dietary Needs
│   ├── Cuisine Preferences
│   └── Time & Skill
│
├── Subscription
│   └── Pro Upgrade Card
│       ├── Benefits
│       └── Upgrade Button
│
└── Settings
    ├── Notifications
    ├── Help & Support
    ├── About
    └── Sign Out
```

## Screen Transitions

### Navigation Type
- **Bottom Navigation**: IndexedStack (preserves state)
- **Modal Bottom Sheet**: Filters, Add Item
- **Push Navigation**: Recipe flow, Settings screens
- **Full Screen**: Cook Mode

### Animations
- **Slide**: Recipe Detail, Results
- **Fade**: Tab switching
- **Scale**: Modal sheets
- **Page View**: Cook Mode carousel

## UI Components Hierarchy

```
MaterialApp
└── MultiProvider (4 services)
    ├── UserPreferencesService
    ├── PantryService
    ├── MealPlanService
    └── RecipeService
    
    └── AppNavigator
        ├── OnboardingFlow (if not complete)
        │   ├── WelcomeScreen
        │   ├── SelectGoalsScreen
        │   ├── DietaryNeedsScreen
        │   └── CookingConfidenceScreen
        │
        └── MainScreen (if complete)
            └── Scaffold
                ├── IndexedStack (4 tabs)
                │   ├── HomeTab
                │   ├── PantryTab
                │   ├── PlanTab
                │   └── MeTab
                │
                └── BottomNavigationBar
```

## Data Flow

```
User Action
    ↓
Service Method (e.g., addItem(), generateRecipes())
    ↓
notifyListeners()
    ↓
Consumer Widget Rebuilds
    ↓
UI Updates
```

## Key Design Patterns

1. **State Management**: Provider pattern
2. **Navigation**: Named routes + bottom navigation
3. **Forms**: Form validation with GlobalKey
4. **Lists**: ListView.builder for performance
5. **Modals**: showModalBottomSheet for filters/forms
6. **Dialogs**: showDialog for confirmations
7. **Tabs**: TabController for content switching
8. **Carousel**: PageController for step navigation

## Material 3 Components Used

- ✅ ElevatedButton
- ✅ OutlinedButton
- ✅ TextButton
- ✅ Card
- ✅ TextField with InputDecoration
- ✅ Chip (FilterChip, ChoiceChip, ActionChip)
- ✅ BottomNavigationBar
- ✅ FloatingActionButton
- ✅ AppBar with FlexibleSpaceBar
- ✅ Slider
- ✅ CheckboxListTile
- ✅ ListTile
- ✅ LinearProgressIndicator
- ✅ CircularProgressIndicator
- ✅ Divider

## Color Coding

- **Primary (Orange)**: #FF6B35
  - Buttons, active states, highlights
  
- **Success (Green)**: #4CAF50
  - Protein macro, completion states
  
- **Info (Blue)**: #2196F3
  - Carbs macro, informational elements
  
- **Warning (Amber)**: #FFC107
  - Fat macro, alerts
  
- **Error (Red)**: #F44336
  - Validation errors, destructive actions

## Accessibility Features

- ✅ High contrast text colors
- ✅ Touch targets >= 48x48 dp
- ✅ Semantic labels on icons
- ✅ Clear visual hierarchy
- ✅ Readable font sizes (14-22pt)
- ✅ Icon + text labels in navigation
