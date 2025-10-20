# ChefWise Quick Start Guide

Get ChefWise up and running in 5 minutes!

## Prerequisites

- Node.js 18 or higher
- A Firebase account
- An OpenAI API key

## Step 1: Clone and Install

```bash
git clone https://github.com/AreteDriver/Chefwise.git
cd Chefwise
npm install
```

## Step 2: Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Google Sign-In)
4. Enable Firestore Database
5. Copy your Firebase configuration

## Step 3: Configure Environment

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

OPENAI_API_KEY=your_openai_api_key
```

## Step 4: Deploy Cloud Functions

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase
firebase init

# Deploy functions
cd functions
npm install
cd ..
firebase deploy --only functions

# Configure OpenAI API key
firebase functions:config:set openai.key="your_openai_api_key"
```

## Step 5: Deploy Security Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## Step 6: Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Step 7: Test the App

1. Sign in with Google
2. Try generating a recipe
3. Add items to your pantry
4. Create a meal plan
5. Track your macros

## Next Steps

- Customize the UI theme in `tailwind.config.js`
- Add more diet filters in `src/prompts/recipePrompts.js`
- Integrate Stripe for payments
- Deploy to production with Firebase Hosting or Vercel

## Common Issues

### Build fails
- Ensure Node.js version is 18 or higher
- Delete `node_modules` and `.next`, then reinstall: `rm -rf node_modules .next && npm install`

### Firebase errors
- Check that all environment variables are set correctly
- Ensure Firebase services are enabled in the console
- Verify security rules are deployed

### OpenAI errors
- Confirm your API key is valid and has credits
- Check that the key is properly configured in Firebase Functions

## Need Help?

- Check the [README.md](README.md) for detailed documentation
- Open an issue on GitHub
- Read the [Contributing Guide](CONTRIBUTING.md)

Happy cooking! 👨‍🍳
