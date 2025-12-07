# ChefWise — AI Cooking App

ChefWise is a cross-platform AI-driven cooking assistant that generates personalized recipes, meal plans, and nutrition tracking. Available as a Next.js web app and Flutter mobile app.

## Platforms

### 🌐 Web App (Next.js)
Built with Next.js, Firebase, and OpenAI API for web browsers.

### 📱 Mobile App (Flutter)
Native mobile app for iOS and Android with Material 3 design. See [mobile/README.md](mobile/README.md) for details.

## Overview

ChefWise helps users:
- Generate AI-powered recipes from ingredients or prompts
- Manage pantry inventory
- Create personalized meal plans with macro tracking
- Track daily nutrition and macros
- Get ingredient substitutions
- Generate shopping lists

## Features

| Feature | Description | Tech Stack |
|---------|-------------|------------|
| **AI Recipe Generator** | Generates recipes from user prompts or pantry inventory | OpenAI API + Next.js |
| **Pantry Inventory** | CRUD interface for ingredients with recipe suggestions | Firebase Firestore |
| **Meal Planner** | Builds daily/weekly meal schedules with macro targets | React + Chart.js |
| **Macro Tracker** | Calculates protein, carbs, fat, sugar, sodium per meal/day | Chart.js |
| **Substitution Engine** | Suggests ingredient replacements | GPT prompt chain |
| **Shopping List** | Auto-generate lists from meal plan | Firebase functions |
| **Diet Filters** | Mediterranean, Vegan, Keto, Low Fat/Sugar, NAFLD, etc. | Filtered AI prompts |
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
 ├─ mobile/                   # Flutter mobile app (NEW)
 │   ├─ lib/
 │   │   ├─ models/           # Data models
 │   │   ├─ screens/          # UI screens
 │   │   ├─ services/         # State management
 │   │   ├─ theme/            # Design system
 │   │   └─ main.dart         # App entry
 │   ├─ assets/               # Images and icons
 │   ├─ pubspec.yaml          # Flutter dependencies
 │   └─ README.md             # Mobile app docs
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
