# ChefWise

**AI-powered meal planning and recipe generation** — A Next.js PWA with Firebase backend, Stripe subscriptions, and offline-first architecture.

---

## What It Is

ChefWise is an AI-powered recipe assistant that helps you:
- **Discover recipes** based on ingredients in your pantry
- **Plan meals** for the week with macro tracking and shopping lists
- **Chat with recipes** to modify for dietary needs, scale servings, or find substitutions
- **Track nutrition** with daily macro goals and progress visualization
- **Work offline** with full PWA support and background sync

---

## Tech Stack

- **Frontend**: Next.js 14 + React 18 + Tailwind CSS
- **Backend**: Firebase (Firestore + Auth)
- **Payments**: Stripe (subscriptions + checkout)
- **AI**: OpenAI GPT-4o-mini / GPT-4o
- **Charts**: Chart.js + react-chartjs-2
- **Offline**: IndexedDB + Service Worker (PWA)

---

## Quick Start

### Prerequisites
- Node.js 18+
- Firebase project with Firestore and Auth enabled
- OpenAI API key
- Stripe account (for subscriptions)

### Install

```bash
git clone https://github.com/AreteDriver/Chefwise.git
cd Chefwise
npm install
cp .env.example .env.local
# Configure environment variables (see Configuration below)
```

### Run

```bash
npm run dev
# Open http://localhost:3000
```

### Test

```bash
npm test              # Run Jest unit tests
npm run test:e2e      # Run Playwright E2E tests
```

---

## Project Structure

```
Chefwise/
├── src/
│   ├── components/        # React components
│   │   ├── __tests__/     # Component unit tests
│   │   ├── PantryInventory.jsx
│   │   ├── RecipeCard.jsx
│   │   ├── MealPlanner.jsx
│   │   └── ...
│   ├── contexts/          # React contexts
│   │   ├── AuthContext.js
│   │   ├── SubscriptionContext.js
│   │   └── NetworkStatusContext.js
│   ├── pages/             # Next.js pages + API routes
│   │   ├── api/
│   │   │   ├── generate-recipe.js
│   │   │   ├── chat-recipe.js
│   │   │   └── stripe/
│   │   ├── index.js
│   │   ├── pantry.js
│   │   ├── planner.js
│   │   └── ...
│   ├── utils/
│   │   ├── offline/       # IndexedDB + sync queue
│   │   ├── cache/         # AI response caching
│   │   └── firebase.js
│   └── styles/
├── e2e/                   # Playwright E2E tests
├── functions/             # Firebase Cloud Functions
├── public/                # Static assets + PWA manifest
└── ...
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Pantry Inventory** | Track ingredients with offline sync |
| **Recipe Generation** | AI-powered recipes from your ingredients |
| **Recipe Chat** | Modify recipes conversationally |
| **Meal Planner** | Weekly plans with macro distribution charts |
| **Macro Tracker** | Daily nutrition tracking with goals |
| **Offline Mode** | Full functionality without internet |
| **PWA** | Installable app with push notifications |
| **Subscriptions** | Free/Premium tiers via Stripe |

---

## Configuration

Create a `.env.local` file:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin (server)
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

See [SUBSCRIPTION_SETUP.md](./SUBSCRIPTION_SETUP.md) for detailed Stripe configuration.

---

## Subscription Tiers

| Feature | Free | Premium |
|---------|------|---------|
| Recipes per day | 3 | Unlimited |
| Diet filters | 1 | Unlimited |
| Meal plan duration | 3 days | 14 days |
| Pantry items | 20 | Unlimited |
| Recipe chat | - | Unlimited |

---

## License

MIT License
