# ChefWise — AI Cooking App

ChefWise is a cross-platform AI-driven cooking assistant that generates personalized recipes, meal plans, and nutrition tracking. Built with Next.js, Firebase, and OpenAI API.

[![CI/CD Pipeline](https://github.com/AreteDriver/Chefwise/actions/workflows/ci.yml/badge.svg)](https://github.com/AreteDriver/Chefwise/actions/workflows/ci.yml)

## Overview

ChefWise helps users:
- Generate AI-powered recipes from ingredients or prompts
- Get intelligent recipe suggestions based on pantry contents
- Manage pantry inventory with smart recommendations
- Create personalized meal plans with macro tracking
- Track daily nutrition and macros
- Get ingredient substitutions
- Generate shopping lists

## Enhanced AI Features

ChefWise now includes advanced AI capabilities powered by OpenAI GPT-4:

### Dynamic Recipe Generation
- **Pantry-Based Creation**: Automatically generates recipes using available pantry ingredients
- **Dietary Preferences**: Supports Mediterranean, Vegan, Keto, Low Fat/Sugar, NAFLD, and more
- **Allergy Management**: Strict allergen avoidance in all generated recipes
- **Dietary Restrictions**: Handles multiple dietary restrictions simultaneously
- **Smart Suggestions**: AI analyzes your pantry and suggests optimal recipes

### Intelligent Features
- **Pantry Suggestions**: Get up to 5 recipe ideas based on what you have
- **Match Percentage**: See how well each recipe matches your available ingredients
- **Missing Ingredients**: Clearly shows what additional items you need
- **Enhanced Error Handling**: Robust error management with user-friendly messages
- **Extensible Architecture**: Designed for easy addition of new AI features

## Features

| Feature | Description | Tech Stack |
|---------|-------------|------------|
| **AI Recipe Generator** | Generates recipes from user prompts or pantry inventory with dietary restrictions | OpenAI GPT-4 + Next.js |
| **Pantry-Based Suggestions** | AI suggests recipes based on available pantry contents | OpenAI API + Cloud Functions |
| **Pantry Inventory** | CRUD interface for ingredients with smart recipe suggestions | Firebase Firestore |
| **Meal Planner** | Builds daily/weekly meal schedules with macro targets and pantry integration | React + Chart.js |
| **Macro Tracker** | Calculates protein, carbs, fat, sugar, sodium per meal/day | Chart.js |
| **Substitution Engine** | Suggests ingredient replacements with nutritional comparison | GPT-4 prompt chain |
| **Shopping List** | Auto-generate lists from meal plan | Firebase functions |
| **Diet Filters** | Mediterranean, Vegan, Keto, Low Fat/Sugar, NAFLD, etc. | Enhanced AI prompts |
| **User Profiles** | Store diet prefs, allergies, saved recipes, macro goals | Firebase Auth + Firestore |
| **Freemium Model** | Free (2 recipes/day) → Premium (unlimited) | Stripe + Firebase |

## Architecture

```
[User] → [UI (Next.js + React)] → [Firebase Auth + Firestore]  
→ [OpenAI API via Cloud Functions] → [Recipe Response + Macro Calc]  
→ [Render Meal Plan + Charts + Lists]
```

**Frontend:** Next.js + React + Tailwind CSS  
**Backend:** Firebase Auth | Firestore | Cloud Functions  
**AI Layer:** OpenAI API (GPT-4) + custom prompt templates  
**Integrations:** Stripe Payments | Chart.js  
**Deployment:** Firebase Hosting / Vercel

## Folder Structure

```
chefwise/
 ├─ src/
 │   ├─ components/          # React components
 │   │   ├─ RecipeCard.jsx
 │   │   ├─ MealPlanner.jsx
 │   │   ├─ PantryInventory.jsx
 │   │   ├─ MacroTracker.jsx
 │   │   └─ SubscriptionBanner.jsx
 │   ├─ pages/              # Next.js pages
 │   │   ├─ index.js        # Home page
 │   │   ├─ pantry.js       # Pantry management
 │   │   ├─ planner.js      # Meal planner
 │   │   ├─ tracker.js      # Macro tracker
 │   │   └─ profile.js      # User profile
 │   ├─ hooks/              # Custom React hooks
 │   │   └─ useOpenAI.js    # OpenAI API integration
 │   ├─ utils/              # Utility functions
 │   │   └─ SubscriptionGate.js
 │   ├─ firebase/           # Firebase config
 │   │   └─ firebaseConfig.js
 │   ├─ prompts/            # AI prompt templates
 │   │   └─ recipePrompts.js
 │   └─ styles/             # CSS styles
 │       └─ globals.css
 ├─ functions/              # Cloud Functions
 │   ├─ index.js            # OpenAI calls, billing checks
 │   └─ package.json
 ├─ public/                 # Static assets
 ├─ package.json
 ├─ firebase.json           # Firebase config
 ├─ firestore.rules         # Security rules
 ├─ firestore.indexes.json  # Database indexes
 └─ README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- Firebase account
- OpenAI API key
- Stripe account (for payments)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AreteDriver/Chefwise.git
cd Chefwise
```

2. Install dependencies:
```bash
npm install
cd functions && npm install && cd ..
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Firebase and OpenAI credentials.

4. Initialize Firebase:
```bash
firebase login
firebase init
```

5. Deploy Cloud Functions:
```bash
firebase deploy --only functions
```

6. Run the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

OPENAI_API_KEY=your_openai_api_key

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret
```

## Freemium Logic

- **Free users:** 2 recipe calls/day, 1 diet filter, 3-day meal plans
- **Premium users:** Unlimited recipes, all diet filters, 30-day meal plans, export features
- Gating via `planTier` field in Firestore and `checkPlanTier()` middleware in Cloud Functions

## AI Prompt Examples

### Recipe Generation
```javascript
{
  dietType: 'Mediterranean',
  ingredients: ['chicken', 'tomatoes', 'olive oil', 'garlic'],
  preferences: {
    allergies: ['nuts'],
    restrictions: ['gluten-free'],
    servings: 4,
    cookTime: 45,
    difficulty: 'medium',
    pantryContents: ['rice', 'herbs', 'lemon']
  }
}
```

### Pantry Suggestions
```javascript
{
  pantryItems: ['eggs', 'milk', 'flour', 'butter', 'cheese'],
  preferences: {
    dietType: 'vegetarian',
    allergies: [],
    restrictions: [],
    maxRecipes: 5
  }
}
```

### Substitution
```
Suggest top 3 ingredient substitutions for butter 
that maintain flavor, texture, and diet compatibility.
Diet: vegan, Allergens: dairy
```

### Meal Plan
```javascript
{
  days: 7,
  macroGoals: {
    protein: 150,
    carbs: 200,
    fat: 60,
    calories: 2000
  },
  pantryItems: ['chicken', 'rice', 'vegetables'],
  preferences: {
    dietType: 'balanced',
    allergies: ['shellfish'],
    mealsPerDay: 3
  }
}
```

## Key Components

- **`firebaseConfig.js`** – Firebase initialization
- **`useOpenAI.js`** – Custom hook for AI API calls with enhanced error handling and rate limiting
- **`functions/index.js`** – Cloud Functions with enhanced AI service integration
  - `generateRecipe` – Dynamic recipe generation with pantry integration
  - `getPantrySuggestions` – Intelligent recipe suggestions from available ingredients
  - `getSubstitutions` – Ingredient substitution recommendations
  - `generateMealPlan` – Comprehensive meal planning with macro tracking
- **`MealPlanner.jsx`** – Weekly meal plan UI with charts
- **`SubscriptionGate.js`** – Restricts features by plan tier
- **`RecipeCard.jsx`** – Displays recipe results
- **`PantryInventory.jsx`** – Manage ingredients with AI suggestions
- **`MacroTracker.jsx`** – Daily nutrition tracking

## Deployment

### Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

### Vercel

```bash
vercel deploy
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests (if configured)

## CI/CD Pipeline

ChefWise uses GitHub Actions for continuous integration and deployment:

### Automated Workflows

- **Linting**: Automatically runs ESLint on every pull request
- **Testing**: Executes test suite to ensure code quality
- **Build Verification**: Validates that the application builds successfully
- **Multi-Node Testing**: Tests on Node.js 18.x and 20.x
- **Firebase Functions Check**: Validates Cloud Functions code
- **Preview Deployments**: Automatic preview builds for pull requests
- **Production Deployment**: Automated deployment to production on main branch

### Setting Up CI/CD

1. **Required Secrets**: Configure the following in GitHub repository settings:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `FIREBASE_SERVICE_ACCOUNT` (for Firebase Hosting deployment)
   - `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (for Vercel deployment)

2. **Branch Protection**: Enable branch protection rules on `main`:
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Require pull request reviews

3. **Deployment Options**:
   - **Firebase Hosting**: Uncomment Firebase deployment step in workflow
   - **Vercel**: Uncomment Vercel deployment step in workflow

### Workflow Triggers

- **On Push**: Runs full CI/CD pipeline on `main` and `develop` branches
- **On Pull Request**: Runs linting, testing, and build verification
- **Manual**: Can be triggered manually from GitHub Actions tab

## Future Modules

- Community recipe sharing
- AI voice assistant mode
- Offline mode (local cache)
- Photo recognition for ingredients
- Wearable integration
- Multi-language support

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License - see LICENSE file for details

## Support

For support, email support@chefwise.app or open an issue on GitHub.

---

Built with ❤️ by the ChefWise team
