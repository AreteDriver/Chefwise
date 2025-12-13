# ChefWise — AI Cooking App

ChefWise is a cross-platform AI-driven cooking assistant that generates personalized recipes, meal plans, and nutrition tracking. Built with Next.js, Firebase, and OpenAI API.

[![CI/CD Pipeline](https://github.com/AreteDriver/Chefwise/actions/workflows/ci.yml/badge.svg)](https://github.com/AreteDriver/Chefwise/actions/workflows/ci.yml)

## Overview

ChefWise is your intelligent kitchen companion that leverages advanced AI to transform how you cook, plan meals, and manage nutrition. Whether you're a beginner learning to cook or an experienced chef seeking inspiration, ChefWise provides:

- **AI-Powered Recipe Creation**: Generate personalized recipes from simple prompts or available ingredients using GPT-4
- **Intelligent Meal Planning**: Create optimized weekly meal plans that match your dietary goals and nutritional targets
- **Smart Pantry Management**: Get recipe suggestions based on what you already have, minimizing waste
- **Dietary Coaching**: Personalized guidance for various dietary preferences (Mediterranean, Vegan, Keto, NAFLD, etc.)
- **Nutrition Tracking**: Real-time macro and nutrient analysis to help you meet your health goals
- **Cooking Education**: Learn new techniques and get ingredient substitutions with detailed explanations

**Why ChefWise?** Traditional recipe apps show you static recipes. ChefWise uses AI to understand your unique needs, available ingredients, dietary restrictions, and cooking skills to create truly personalized cooking experiences.

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

### 🤖 Interactive AI Modules

| Feature | Description | Tech Stack |
|---------|-------------|------------|
| **AI Recipe Generator** | Interactive recipe creation from natural language prompts or pantry inventory. Supports all dietary restrictions and allergies. | OpenAI GPT-4 + Next.js |
| **Pantry-Based Suggestions** | AI analyzes your pantry and suggests up to 5 recipes with match percentages and missing ingredients | OpenAI API + Cloud Functions |
| **Pantry Inventory** | Smart ingredient management with CRUD interface and AI-powered recipe suggestions | Firebase Firestore |
| **Interactive Meal Planner** | Build daily/weekly meal schedules (1-30 days) with real-time macro targeting and pantry integration | React + Chart.js |
| **Macro Tracker** | Visual nutrition tracking with daily/weekly charts showing protein, carbs, fat, sugar, sodium | Chart.js + React |
| **Substitution Engine** | Get AI-recommended ingredient replacements with nutritional comparison and diet compatibility | GPT-4 prompt chain |
| **Shopping List Generator** | Auto-generate shopping lists from meal plans, considering pantry inventory | Firebase functions |
| **Dietary Coaching** | Personalized dietary guidance for Mediterranean, Vegan, Keto, Low Fat/Sugar, NAFLD, and more | Enhanced AI prompts |
| **User Profiles** | Store dietary preferences, allergies, saved recipes, macro goals, and cooking preferences | Firebase Auth + Firestore |
| **Freemium Model** | Free tier (2 recipes/day) with Premium upgrade (unlimited access) | Stripe + Firebase |

### 💡 Key Capabilities

- **Natural Language Processing**: Describe what you want in plain English ("quick dinner for two, low carb")
- **Allergy-Safe Cooking**: Strict allergen avoidance with "MUST avoid" enforcement
- **Multi-Dietary Support**: Handle multiple dietary restrictions simultaneously
- **Real-Time Collaboration**: Changes sync instantly across devices
- **Offline-First Design**: Core features work without internet (planned)
- **Educational Content**: Learn cooking techniques and nutritional information as you cook

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

## Usage

### 🎯 User Scenarios

ChefWise adapts to various cooking scenarios. Here are common use cases:

#### Scenario 1: Creating a Recipe from Scratch

**Goal**: Generate a healthy dinner recipe for tonight

1. **Navigate to Home Page** (Recipe Generator)
2. **Describe Your Needs**:
   ```
   "I want a healthy Mediterranean dinner for 2 people, 
    about 30 minutes cooking time, using chicken"
   ```
3. **Set Preferences**:
   - Select dietary type: Mediterranean
   - Add allergies: None
   - Set servings: 2
   - Cooking time: 30 minutes
4. **Click "Generate Recipe"**
5. **Review Results**:
   - Full recipe with ingredients and instructions
   - Nutritional breakdown (calories, protein, carbs, fat)
   - Cooking time and difficulty level
   - Option to save to your profile

**AI Response Example**:
```
Mediterranean Lemon Herb Chicken
Servings: 2 | Time: 30 min | Difficulty: Easy

Ingredients:
- 2 chicken breasts (6 oz each)
- 2 tbsp olive oil
- 1 lemon (juiced and zested)
- 3 cloves garlic, minced
- 1 tsp dried oregano
- Fresh parsley, chopped
- Salt and pepper to taste
- 1 cup cherry tomatoes
- 1/2 cup kalamata olives

Instructions:
1. Season chicken with salt, pepper, and oregano...
[Full detailed instructions]

Nutrition per serving:
Calories: 385 | Protein: 42g | Carbs: 12g | Fat: 18g
```

#### Scenario 2: Generating a Weekly Meal Plan

**Goal**: Plan a week of meals aligned with fitness goals

1. **Navigate to Meal Planner** (`/planner`)
2. **Set Your Goals**:
   - Duration: 7 days
   - Macro targets:
     - Calories: 2000/day
     - Protein: 150g
     - Carbs: 200g
     - Fat: 65g
   - Meals per day: 3
3. **Configure Preferences**:
   - Dietary type: Balanced/High Protein
   - Allergies: Shellfish
   - Available pantry items: chicken, rice, eggs, vegetables
4. **Click "Generate Meal Plan"**
5. **Review Your Plan**:
   - Day-by-day breakdown with all meals
   - Visual charts showing daily macro distribution
   - Total nutritional summary
   - Automated shopping list for missing ingredients
6. **Save and Track**:
   - Save meal plan to your profile
   - Track daily progress in Macro Tracker

**AI Meal Plan Output**:
```
Day 1:
  Breakfast: Greek Yogurt Bowl with Berries (350 cal, 25g protein)
  Lunch: Grilled Chicken Salad (450 cal, 40g protein)
  Dinner: Salmon with Roasted Vegetables (600 cal, 45g protein)
  Daily Total: 1,950 cal | 150g protein | 195g carbs | 63g fat ✓

Day 2:
  Breakfast: Protein Pancakes with Banana (380 cal, 28g protein)
  ...
[Complete 7-day plan]

Shopping List:
✓ Already have: chicken, rice, eggs
Need to buy: salmon (2 fillets), Greek yogurt (1 lb), berries (2 cups)...
```

#### Scenario 3: Using AI Pantry Suggestions

**Goal**: Use up ingredients before they expire

1. **Navigate to Pantry** (`/pantry`)
2. **Add Your Ingredients**:
   - Eggs (12 remaining)
   - Spinach (1 bunch)
   - Mushrooms (8 oz)
   - Cheese (cheddar, 4 oz)
   - Milk (2 cups)
3. **Click "Get Recipe Suggestions"**
4. **Review AI Suggestions**:
   ```
   Based on your pantry, here are 5 recipe ideas:
   
   1. Spinach and Mushroom Frittata (95% match)
      Missing: onion, herbs
      Time: 25 min | Servings: 4
   
   2. Cheesy Scrambled Eggs with Vegetables (100% match)
      Missing: none!
      Time: 10 min | Servings: 2
   
   3. Vegetarian Breakfast Burrito (85% match)
      Missing: tortillas, bell peppers
      Time: 20 min | Servings: 4
   ...
   ```
5. **Select a Recipe**: Click to generate full details
6. **Cook and Update**: Mark used ingredients to keep pantry current

#### Scenario 4: Dietary Coaching for Special Needs

**Goal**: Manage NAFLD (Non-Alcoholic Fatty Liver Disease) diet

1. **Navigate to Profile** (`/profile`)
2. **Set Up Dietary Profile**:
   - Primary diet type: NAFLD-friendly
   - Restrictions: Low fat, low sugar, no alcohol
   - Allergies: None
   - Health goals: Liver health, weight management
3. **Generate Recipes** with automatic NAFLD filtering:
   - All recipes avoid high-fat, high-sugar ingredients
   - Focus on lean proteins, whole grains, vegetables
   - Portion control and balanced macros
4. **Track Progress**:
   - Monitor daily fat and sugar intake in Macro Tracker
   - Get weekly nutrition reports
   - Receive AI coaching tips specific to NAFLD

**AI Coaching Tips**:
```
💡 NAFLD Tip: Your meals this week averaged 45g fat/day (within target)
   Great choices: Grilled fish, steamed vegetables, quinoa
   Consider adding: More leafy greens for liver health
   
📊 Progress: Sugar intake down 20% from last week! Keep it up!
```

### 🔧 Advanced Features

#### Ingredient Substitutions
Ask AI for alternatives:
```
"What can I use instead of butter in this recipe? I'm vegan."

AI Response:
1. Coconut Oil (1:1 ratio) - Best for baking, adds subtle flavor
2. Vegan Butter (1:1 ratio) - Neutral flavor, similar texture
3. Avocado (3/4 cup per 1 cup butter) - Healthier, denser texture

Recommendation: For cookies, use vegan butter for best results.
Nutrition comparison: [detailed breakdown]
```

#### Macro Tracking
Monitor your nutrition daily:
- Log meals manually or select from meal plan
- View daily charts (pie charts for macro distribution)
- Compare actual vs. target macros
- Track weekly trends

### 📱 Mobile & Cross-Platform

ChefWise is fully responsive and works on:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Android)
- Tablet devices
- Progressive Web App (PWA) support (planned)

---

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

Contributions are welcome! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) guide for detailed information on:

- Setting up your development environment
- Code style and best practices
- Working with AI features
- Testing and validation
- Pull request process

See the [CONTRIBUTING.md](CONTRIBUTING.md) file for comprehensive guidelines.

## Repository Topics

This repository is tagged with the following topics for discoverability:

- **ai** - Artificial Intelligence powered features
- **cooking-assistant** - Smart cooking guidance and recipe generation
- **meal-planning** - Intelligent meal planning capabilities
- **dietary-coaching** - Personalized dietary guidance and support
- **nutrient-analysis** - Comprehensive nutrition tracking and analysis
- **recipe-generator** - AI-powered recipe creation
- **nextjs** - Built with Next.js framework
- **firebase** - Backend powered by Firebase
- **openai** - Integration with OpenAI GPT-4

To add or update topics on GitHub, repository administrators can:
1. Go to the repository homepage
2. Click the ⚙️ settings icon next to "About"
3. Add topics in the "Topics" field
4. Save changes

## License

MIT License - see LICENSE file for details

## Support

For support, email support@chefwise.app or open an issue on GitHub.

---

Built with ❤️ by the ChefWise team
