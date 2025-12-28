# ChefWise

**AI-powered meal planning with structured LLM outputs** — Serverless web app combining GPT-4 with Firebase for personalized recipe generation and nutrition tracking.

[![CI/CD Pipeline](https://github.com/AreteDriver/Chefwise/actions/workflows/ci.yml/badge.svg)](https://github.com/AreteDriver/Chefwise/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What It Is

ChefWise is a serverless application that solves personalized nutrition tracking and meal planning challenges. Users describe what they want in natural language, and the system generates diet-specific recipes with precise macronutrient calculations.

The platform supports Mediterranean, Vegan, Keto, Low Fat/Sugar, NAFLD, and other dietary preferences with strict allergen avoidance. A freemium model (2 free recipes/day) demonstrates production-ready usage controls.

---

## Problem / Solution / Impact

**Problem**: Generic recipe apps ignore dietary restrictions, can't use what's already in your kitchen, and provide no macro tracking for health-conscious users.

**Solution**: ChefWise provides:
- Natural language recipe generation via GPT-4 with JSON schema enforcement
- Pantry-based suggestions (95% match recipes from available ingredients)
- Multi-day meal planning with macro targeting
- Real-time sync across devices via Firestore
- User-scoped security with Firebase Auth

**Impact** (Intended Outcomes):
- Reduce meal planning time for diet-specific needs
- Decrease food waste by suggesting recipes from existing pantry
- Enable precise macro tracking for fitness goals
- Demonstrate scalable serverless AI application patterns

---

## Quick Start

### Prerequisites
- Node.js 18+
- Firebase account
- OpenAI API key

### Install

```bash
git clone https://github.com/AreteDriver/Chefwise.git
cd Chefwise
npm install
cd functions && npm install && cd ..
cp .env.example .env.local
# Add Firebase and OpenAI credentials to .env.local
firebase login
firebase init
```

### Run

```bash
npm run dev
# Open http://localhost:3000
```

### Deploy

```bash
npm run build
firebase deploy --only hosting
firebase deploy --only functions
```

---

## Architecture

```
[Next.js Client]
       |
       v (Firebase Auth - Google OAuth)
[Firebase Cloud Functions]
       |
       v (Validates: auth.uid, planTier, dailyUsage)
[OpenAI GPT-4 API]
       |
       v (Structured JSON with schema enforcement)
[Firestore Database]
       |
       v (User-scoped security rules)
[Client: Real-time UI updates]
```

**Tech Stack**:
- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Firebase Cloud Functions (Node.js 18), Firestore
- **AI**: OpenAI GPT-4 with `response_format: { type: 'json_object' }`
- **Charts**: Chart.js for macro visualization
- **CI/CD**: GitHub Actions with ESLint + build verification

### Project Structure

```
chefwise/
├── src/
│   ├── components/    # RecipeCard, MealPlanner, PantryInventory, MacroTracker
│   ├── pages/         # Next.js routes
│   ├── hooks/         # useOpenAI custom hook
│   ├── prompts/       # AI prompt templates
│   └── firebase/      # Config and initialization
├── functions/         # Cloud Functions (generateRecipe, generateMealPlan)
├── firestore.rules    # User-scoped security
└── package.json
```

---

## AI Operating Model

| Layer | Implementation |
|-------|----------------|
| **Structured Outputs** | `response_format: { type: 'json_object' }` forces valid JSON. Schema includes title, ingredients[], steps[], macros{}, prepTime, cookTime. Eliminates parsing failures. |
| **Validation / Safety Rails** | Firebase Auth required for all AI calls. Plan tier + daily usage checked before execution. Allergies enforced with "MUST avoid" prompts. Firestore rules prevent data manipulation. |
| **Retry / Fallback** | Enhanced error handling with user-friendly messages. Graceful degradation when OpenAI unavailable. Rate limiting respects API quotas. |
| **Telemetry** | Daily usage tracking per user. Plan tier monitoring for freemium conversion. Build time metrics (~45s). Real-time sync eliminates polling overhead. |

---

## Key Decisions

See [docs/adr/0001-initial-architecture.md](docs/adr/0001-initial-architecture.md) for the architecture decision record.

**Summary of Key Decisions**:
1. **Serverless Backend** — Firebase Cloud Functions for auto-scaling and zero server management
2. **JSON Schema Enforcement** — OpenAI `response_format` eliminates parsing instructions in prompts
3. **Freemium with Firestore Tracking** — Usage limits enforced server-side, not client-side
4. **Real-time Sync** — Firestore listeners for instant updates, no polling
5. **Strict Allergen Prompting** — "MUST avoid" language for safety-critical dietary restrictions

---

## Key Features

| Feature | Description |
|---------|-------------|
| **AI Recipe Generator** | Natural language to structured recipe with macros |
| **Pantry Suggestions** | 5 recipes ranked by ingredient match percentage |
| **Meal Planner** | 1-30 day plans with macro targeting |
| **Macro Tracker** | Daily/weekly charts (protein, carbs, fat, sugar, sodium) |
| **Substitution Engine** | AI-recommended replacements with nutrition comparison |
| **Shopping List** | Auto-generated from meal plans minus pantry inventory |

### Freemium Model

| Tier | Limits |
|------|--------|
| **Free** | 2 recipes/day, 3-day plans, 1 diet filter, 20 pantry items |
| **Premium** | Unlimited recipes, 30-day plans, all diet filters, unlimited pantry |

---

## Roadmap

- [ ] Image recognition for ingredient identification (TensorFlow.js)
- [ ] Offline mode with Service Workers + IndexedDB
- [ ] Voice interface for hands-free cooking (Web Speech API)
- [ ] Push notifications for meal plan updates (Firebase Cloud Messaging)
- [ ] Native mobile apps (React Native or Flutter)
- [ ] Recipe sharing and social features

---

## Demo

<!-- TODO: Add demo GIF showing recipe generation and meal planning -->
*Demo placeholder: Record generating a recipe from natural language prompt*

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Development
npm run dev
npm run lint

# Test Cloud Functions locally
firebase emulators:start
```

---

## License

MIT License — see [LICENSE](LICENSE)

---

## Support

- **Issues**: [GitHub Issues](https://github.com/AreteDriver/Chefwise/issues)
- **Docs**: [QUICKSTART.md](QUICKSTART.md) | [ARCHITECTURE.md](docs/ARCHITECTURE.md)
