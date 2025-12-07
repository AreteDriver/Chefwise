# ChefWise Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (Next.js + React + Tailwind)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐      ┌──────────────┐
│   Home Page  │    │ Pantry Page  │      │ Planner Page │
│              │    │              │      │              │
│ - Recipe Gen │    │ - Inventory  │      │ - Meal Plans │
│ - Auth       │    │ - CRUD Ops   │      │ - Macro Goals│
└──────────────┘    └──────────────┘      └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │         COMPONENT LAYER                 │
        ├─────────────────────────────────────────┤
        │  • RecipeCard                           │
        │  • MealPlanner                          │
        │  • PantryInventory                      │
        │  • MacroTracker                         │
        │  • SubscriptionBanner                   │
        └─────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐      ┌──────────────┐
│ Custom Hooks │    │   Utilities  │      │    Prompts   │
│              │    │              │      │              │
│ - useOpenAI  │    │ - SubsGate   │      │ - Templates  │
│              │    │ - MacroCalc  │      │ - Filters    │
└──────────────┘    └──────────────┘      └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │         FIREBASE SERVICES               │
        ├─────────────────────────────────────────┤
        │  ┌──────────┐  ┌──────────┐  ┌────────┐│
        │  │   Auth   │  │Firestore │  │ Fns    ││
        │  │          │  │          │  │        ││
        │  │ - Google │  │ - Users  │  │ - AI   ││
        │  │ - Email  │  │ - Pantry │  │ - Rate ││
        │  │          │  │ - Recipes│  │  Limit ││
        │  └──────────┘  └──────────┘  └────────┘│
        └─────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐      ┌──────────────┐
│   OpenAI     │    │   Stripe     │      │  Firebase    │
│   GPT-4      │    │   Payments   │      │  Storage     │
│              │    │              │      │              │
│ - Recipes    │    │ - Premium    │      │ - Images     │
│ - Meal Plans │    │ - Billing    │      │ - Documents  │
│ - Subs       │    │              │      │              │
└──────────────┘    └──────────────┘      └──────────────┘
```

## AI Workflows

### AI Recipe Generation Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Recipe Generation Flow                    │
└─────────────────────────────────────────────────────────────────┘

User Input
  │
  ├─ Ingredients: ["chicken", "broccoli", "garlic"]
  ├─ Diet Type: "Mediterranean"
  ├─ Preferences: { allergies: ["nuts"], servings: 4 }
  └─ Macro Goals: { calories: 500, protein: 40g }
  │
  ▼
┌──────────────────────────────────┐
│  useOpenAI Hook (Frontend)       │
│  - Validates input               │
│  - Adds user context             │
│  - Handles loading state         │
└──────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────┐
│  Firebase Cloud Function         │
│  - Authentication check          │
│  - Rate limit validation         │
│  - Plan tier verification        │
└──────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────┐
│  Prompt Engineering              │
│  - Build GPT-4 prompt            │
│  - Include context & constraints │
│  - Request JSON structure        │
└──────────────────────────────────┘
  │
  │  Prompt Example:
  │  "Generate a Mediterranean recipe using chicken, broccoli, and garlic.
  │   Servings: 4. Target: 500 calories, 40g protein per serving.
  │   Avoid nuts. Return JSON with: title, ingredients (with amounts),
  │   steps, prep_time, cook_time, macros (protein, carbs, fat, calories)."
  │
  ▼
┌──────────────────────────────────┐
│  OpenAI API (GPT-4)              │
│  - Process natural language      │
│  - Generate structured recipe    │
│  - Calculate nutrition           │
└──────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────┐
│  Response Processing             │
│  - Parse JSON response           │
│  - Validate structure            │
│  - Error handling                │
└──────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────┐
│  Save to Firestore               │
│  - Store in recipes collection   │
│  - Link to user ID               │
│  - Add timestamp & metadata      │
└──────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────┐
│  Return to Frontend              │
│  - Update UI state               │
│  - Render RecipeCard             │
│  - Enable save/share options     │
└──────────────────────────────────┘
```

### AI Meal Planning Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Meal Planning Flow                        │
└─────────────────────────────────────────────────────────────────┘

User Configuration
  │
  ├─ Days: 7
  ├─ Macro Goals: { protein: 150g, carbs: 200g, fat: 60g }
  ├─ Pantry Items: ["chicken", "rice", "vegetables"]
  └─ Preferences: { diet: "balanced", allergies: [] }
  │
  ▼
┌──────────────────────────────────┐
│  MealPlanner Component           │
│  - Collect user inputs           │
│  - Display calendar UI           │
└──────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────┐
│  generateMealPlan Function       │
│  - Aggregate requirements        │
│  - Calculate daily targets       │
│  - Include variety constraints   │
└──────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────┐
│  Firebase Cloud Function         │
│  - Check plan tier limits        │
│  - Validate day count (free:3)   │
└──────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────┐
│  AI Prompt Construction          │
│  - Build weekly plan prompt      │
│  - Include macro distribution    │
│  - Request structured output     │
└──────────────────────────────────┘
  │
  │  Prompt Example:
  │  "Create a 7-day meal plan with breakfast, lunch, dinner, snacks.
  │   Daily targets: 150g protein, 200g carbs, 60g fat.
  │   Prioritize: chicken, rice, vegetables.
  │   Ensure variety and balanced nutrition.
  │   Return JSON: { days: [{ date, meals: [...], totals: {...} }],
  │   shoppingList: [...] }"
  │
  ▼
┌──────────────────────────────────┐
│  OpenAI API (GPT-4)              │
│  - Generate full week plan       │
│  - Balance macros across days    │
│  - Create shopping list          │
└──────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────┐
│  Post-Processing                 │
│  - Parse meal plan JSON          │
│  - Validate macro totals         │
│  - Generate shopping list        │
│  - Calculate missing ingredients │
└──────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────┐
│  Save & Display                  │
│  - Save plan to Firestore        │
│  - Render calendar view          │
│  - Display Chart.js graphs       │
│  - Show shopping list            │
└──────────────────────────────────┘
```

### Caching Strategy for AI Responses

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Response Caching                          │
└─────────────────────────────────────────────────────────────────┘

Request
  │
  ▼
┌──────────────────────────────────┐
│  Generate Cache Key              │
│  hash(ingredients + diet +       │
│       preferences + constraints) │
└──────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────┐
│  Check Cache                     │
│  1. IndexedDB (local)            │
│  2. Firestore (user cache)       │
│  3. Redis (server cache)         │
└──────────────────────────────────┘
  │
  ├─ Cache Hit ──────────────┐
  │                          │
  │                          ▼
  │                  ┌────────────────┐
  │                  │ Return Cached  │
  │                  │ Response       │
  │                  └────────────────┘
  │
  └─ Cache Miss
     │
     ▼
┌──────────────────────────────────┐
│  Call OpenAI API                 │
│  - Generate fresh response       │
└──────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│  Store in Cache                  │
│  - TTL: 24 hours                 │
│  - Indexed by cache key          │
└──────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│  Return Response                 │
└──────────────────────────────────┘
```

## Data Flow

### Recipe Generation Flow
```
User Input (Ingredients/Diet)
    ↓
useOpenAI Hook
    ↓
Firebase Cloud Function
    ↓
Check Plan Tier & Usage
    ↓
OpenAI API Call
    ↓
Parse JSON Response
    ↓
Save to Firestore
    ↓
Return Recipe to UI
    ↓
Display in RecipeCard
```

### Meal Planning Flow
```
User Sets Macro Goals
    ↓
Configure Days (1-30)
    ↓
Firebase Cloud Function
    ↓
OpenAI Generates Plan
    ↓
Parse Meal Plan JSON
    ↓
Calculate Daily Totals
    ↓
Generate Shopping List
    ↓
Display in MealPlanner
    ↓
Render Charts (Chart.js)
```

### Pantry Management Flow
```
User Adds Item
    ↓
Firestore Write
    ↓
Real-time Listener
    ↓
Update UI Instantly
    ↓
User Clicks "Suggest Recipes"
    ↓
Pass Items to Recipe Generator
    ↓
Generate Recipe
```

## Security Architecture

```
┌─────────────────────────────────────────┐
│         SECURITY LAYERS                 │
├─────────────────────────────────────────┤
│ 1. Firebase Authentication              │
│    - Google OAuth                       │
│    - JWT Tokens                         │
│                                         │
│ 2. Firestore Security Rules             │
│    - User-scoped data                   │
│    - Owner validation                   │
│                                         │
│ 3. Cloud Functions Auth                 │
│    - context.auth checks                │
│    - Plan tier validation               │
│                                         │
│ 4. Rate Limiting                        │
│    - Daily usage tracking               │
│    - Freemium enforcement               │
│                                         │
│ 5. Environment Variables                │
│    - API keys secured                   │
│    - No secrets in code                 │
└─────────────────────────────────────────┘
```

## Component Hierarchy

```
App (_app.js)
│
├── Home (index.js)
│   ├── SubscriptionBanner
│   ├── RecipeCard
│   └── Navigation
│
├── Pantry (pantry.js)
│   └── PantryInventory
│       ├── Item List
│       └── Add Item Form
│
├── Planner (planner.js)
│   └── MealPlanner
│       ├── Day Selector
│       ├── Meal Cards
│       ├── Charts (Doughnut, Bar)
│       └── Shopping List
│
├── Tracker (tracker.js)
│   └── MacroTracker
│       ├── Progress Bars
│       ├── Bar Chart
│       └── Nutrient Summary
│
├── Profile (profile.js)
│   ├── User Settings
│   ├── Diet Preferences
│   ├── Macro Goals
│   └── Subscription Info
│
└── Upgrade (upgrade.js)
    ├── Plan Comparison
    └── Payment (Stripe)
```

## Database Schema

### Firestore Collections

```
users/
  {userId}/
    - email: string
    - displayName: string
    - planTier: "free" | "premium"
    - createdAt: timestamp
    - dailyUsage: { [date]: count }
    - preferences: {
        dietType: string
        allergies: string[]
      }
    - macroGoals: {
        calories: number
        protein: number
        carbs: number
        fat: number
      }

pantryItems/
  {itemId}/
    - userId: string
    - name: string
    - quantity: string
    - unit: string
    - category: string
    - addedAt: timestamp

recipes/
  {recipeId}/
    - userId: string
    - title: string
    - description: string
    - ingredients: array
    - steps: array
    - prepTime: number
    - cookTime: number
    - servings: number
    - macros: object
    - tags: array
    - createdAt: timestamp

mealPlans/
  {planId}/
    - userId: string
    - days: array
    - shoppingList: array
    - createdAt: timestamp
```

## API Endpoints (Cloud Functions)

```
generateRecipe
  Input: { dietType, ingredients, preferences }
  Output: { title, ingredients, steps, macros, ... }
  
getSubstitutions
  Input: { ingredient, dietType, allergies }
  Output: [{ substitute, ratio, notes, ... }]
  
generateMealPlan
  Input: { days, macroGoals, pantryItems, preferences }
  Output: { days, shoppingList }
```

## Technology Stack Layers

```
┌─────────────────────────────────────────┐
│  PRESENTATION LAYER                     │
│  - Next.js 14                           │
│  - React 18                             │
│  - Tailwind CSS                         │
│  - Chart.js                             │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  APPLICATION LAYER                      │
│  - React Hooks                          │
│  - State Management                     │
│  - Form Handling                        │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  BUSINESS LOGIC LAYER                   │
│  - Subscription Logic                   │
│  - Macro Calculations                   │
│  - AI Prompts                           │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  SERVICE LAYER                          │
│  - Firebase Functions                   │
│  - API Integrations                     │
│  - Rate Limiting                        │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  DATA LAYER                             │
│  - Firestore Database                   │
│  - Firebase Storage                     │
│  - Firebase Auth                        │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  EXTERNAL SERVICES                      │
│  - OpenAI API                           │
│  - Stripe API                           │
└─────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│         PRODUCTION                      │
├─────────────────────────────────────────┤
│                                         │
│  Firebase Hosting / Vercel              │
│  ├── Static Assets (HTML, CSS, JS)     │
│  ├── Next.js Server                     │
│  └── CDN Distribution                   │
│                                         │
│  Firebase Cloud Functions               │
│  ├── generateRecipe                     │
│  ├── getSubstitutions                   │
│  └── generateMealPlan                   │
│                                         │
│  Firebase Firestore                     │
│  ├── Production Database                │
│  ├── Security Rules                     │
│  └── Indexes                            │
│                                         │
│  Firebase Authentication                │
│  └── Google OAuth Provider              │
│                                         │
└─────────────────────────────────────────┘
```

## Monitoring & Analytics

```
┌─────────────────────────────────────────┐
│  Firebase Analytics                     │
│  - User engagement                      │
│  - Feature usage                        │
│  - Conversion tracking                  │
│                                         │
│  Firebase Performance                   │
│  - Page load times                      │
│  - API response times                   │
│  - Resource usage                       │
│                                         │
│  Firebase Crashlytics                   │
│  - Error tracking                       │
│  - Stack traces                         │
│  - User reports                         │
└─────────────────────────────────────────┘
```

## Scalability Considerations

1. **Horizontal Scaling**: Firebase auto-scales Functions and Firestore
2. **Caching**: Static assets cached via CDN
3. **Rate Limiting**: Prevents abuse and controls costs
4. **Lazy Loading**: Components loaded on-demand
5. **Optimistic Updates**: UI updates before server confirms
6. **Real-time Sync**: Only active data synced
7. **Image Optimization**: Next.js Image component

---

This architecture supports:
- ✅ Thousands of concurrent users
- ✅ Real-time updates
- ✅ Global distribution
- ✅ Cost-effective scaling
- ✅ High availability
- ✅ Security by default
