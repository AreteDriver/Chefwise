# ChefWise — AI Cooking App

ChefWise is a cross-platform AI-driven cooking assistant that generates personalized recipes, meal plans, and nutrition tracking. Built with Next.js, Firebase, and OpenAI API.

## Overview

ChefWise helps users:
- Generate AI-powered recipes from ingredients or prompts
- Manage pantry inventory
- Create personalized meal plans with macro tracking
- Track daily nutrition and macros
- Get ingredient substitutions
- Generate shopping lists

## Features

### AI-Powered Features

#### 🤖 **AI Recipe Generator**
The heart of ChefWise - our intelligent recipe generation system powered by GPT-4:
- **Input Methods**: Generate recipes from:
  - Natural language prompts ("healthy dinner for two")
  - Your pantry ingredients (automatic recipe suggestions)
  - Dietary restrictions and preferences
  - Macro/calorie targets
- **Smart Context**: Remembers your dietary preferences, allergies, and cooking skill level
- **Nutritional Analysis**: Automatic macro calculation (protein, carbs, fats) for every recipe
- **Recipe Quality**: Detailed ingredients, step-by-step instructions, prep/cook times, and servings
- **Tech Stack**: OpenAI API (GPT-4) + Next.js + Firebase Cloud Functions

#### 🔄 **Substitution Engine**
AI-powered ingredient replacement suggestions:
- Maintains flavor profiles and cooking characteristics
- Considers dietary restrictions (vegan, gluten-free, etc.)
- Provides ratio conversions and cooking notes
- Suggests multiple alternatives ranked by similarity
- **Tech Stack**: GPT prompt chains + custom algorithms

#### 📅 **AI Meal Planner**
Intelligent weekly meal planning with nutritional optimization:
- **Customizable Plans**: 1-30 day meal schedules
- **Macro Targeting**: Automatically balances protein, carbs, and fats
- **Pantry Integration**: Prioritizes ingredients you already have
- **Shopping List Generation**: Auto-creates shopping lists for missing ingredients
- **Variety Optimization**: Ensures diverse meals across the week
- **Tech Stack**: React + Chart.js + OpenAI API

### Core Features

| Feature | Description | Tech Stack |
|---------|-------------|------------|
| **Pantry Inventory** | CRUD interface for ingredients with recipe suggestions | Firebase Firestore |
| **Macro Tracker** | Real-time nutrition tracking with visual charts | Chart.js |
| **Diet Filters** | Mediterranean, Vegan, Keto, Low Fat/Sugar, NAFLD, etc. | Filtered AI prompts |
| **User Profiles** | Store diet prefs, allergies, saved recipes, macro goals | Firebase Auth + Firestore |
| **Freemium Model** | Free (2 recipes/day) → Premium (unlimited) | Stripe + Firebase |
| **Offline Mode** | Local storage for pantry and cached recipes | Service Workers + IndexedDB |
| **Analytics** | Track usage patterns and feature engagement | Firebase Analytics |

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

#### For Developers:
- **Node.js 18+** (LTS recommended) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** for version control
- **Firebase account** - [Sign up](https://firebase.google.com/)
- **OpenAI API key** - [Get API key](https://platform.openai.com/)
- **Stripe account** (for payment integration) - [Sign up](https://stripe.com/)
- Code editor (VS Code recommended)

#### For Users:
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for AI features
- (Optional) Firebase account for data sync across devices

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
```
Generate a healthy [diet_type] recipe using: [ingredient_list].
Return JSON with title, ingredients, steps, prep_time, macros.
```

### Substitution
```
Suggest top 3 ingredient substitutions for [ingredient] 
that maintain flavor, texture, and diet compatibility.
```

### Meal Plan
```
Create a 7-day meal plan hitting [protein, fat, carbs] goals 
based on the user's saved preferences and pantry items.
```

## Key Components

- **`firebaseConfig.js`** – Firebase initialization
- **`useOpenAI.js`** – Custom hook for AI API calls with rate limiting
- **`MealPlanner.jsx`** – Weekly meal plan UI with charts
- **`SubscriptionGate.js`** – Restricts features by plan tier
- **`RecipeCard.jsx`** – Displays recipe results
- **`PantryInventory.jsx`** – Manage ingredients
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
- `npm test` - Run test suite

## User Guide

### How to Generate Recipes Using AI

1. **Quick Recipe Generation**
   - Navigate to the home page
   - Enter ingredients you have or a recipe idea (e.g., "chicken and broccoli")
   - Select your dietary preferences (optional)
   - Click "Generate Recipe"
   - View detailed recipe with ingredients, steps, and nutritional info

2. **Generate from Pantry**
   - Go to the Pantry page
   - Add your available ingredients
   - Click "Suggest Recipes"
   - ChefWise will generate recipes using your pantry items
   - Save recipes you like to your collection

3. **Create a Meal Plan**
   - Navigate to the Meal Planner page
   - Set your macro goals (calories, protein, carbs, fats)
   - Choose number of days (1-30)
   - Add dietary restrictions if needed
   - Click "Generate Meal Plan"
   - Review and adjust as needed
   - Export shopping list for missing ingredients

4. **Track Your Nutrition**
   - Go to the Macro Tracker page
   - Log your meals throughout the day
   - View real-time macro breakdown
   - Check progress against your daily goals
   - View historical trends with charts

### Tips for Best Results

- **Be Specific**: Include cooking methods and cuisines (e.g., "Italian pasta" vs. "pasta")
- **Set Preferences**: Update your profile with dietary restrictions and allergies
- **Use Pantry**: Keep your pantry updated for better recipe suggestions
- **Save Favorites**: Star recipes you love for quick access later
- **Adjust Servings**: Scale recipes up or down based on your needs

## Future Modules

### Upcoming AI Enhancements
- **Shopping List Generation**: Automatically create shopping lists tailored to missing pantry ingredients
- **Voice Assistant**: Voice interaction for hands-free recipe navigation while cooking
- **Image Recognition**: Camera-based ingredient scanning using pre-trained ML models
- **Recipe Variations**: AI-generated recipe variations based on available ingredients
- **Cooking Tips**: Context-aware cooking suggestions and technique explanations

### Platform Enhancements
- Community recipe sharing and ratings
- Offline mode with local caching (in progress)
- Photo recognition for pantry inventory
- Wearable integration (Apple Health, Google Fit)
- Multi-language support (i18n) - **Coming Soon**
- Progressive Web App (PWA) features
- Real-time collaborative meal planning

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License - see LICENSE file for details

## Support

For support, email support@chefwise.app or open an issue on GitHub.

---

Built with ❤️ by the ChefWise team
