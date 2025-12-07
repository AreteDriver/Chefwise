# Subscription System Setup Guide

This guide explains how to set up and configure the subscription-based tiering system in ChefWise.

## Overview

ChefWise uses Stripe for payment processing and Firebase for user management. The subscription system includes:

- **Free Tier**: Limited features (3 AI recipes/day, 3-day meal plans)
- **Premium Tier**: Unlimited access ($9/month)

## Prerequisites

Before setting up subscriptions, you need:

1. A Firebase project
2. A Stripe account
3. Node.js 18+ installed

## Step 1: Stripe Setup

### 1.1 Create a Stripe Account

1. Go to [stripe.com](https://stripe.com) and sign up
2. Activate your account

### 1.2 Create a Product and Price

1. In the Stripe Dashboard, navigate to **Products**
2. Click **Add Product**
3. Fill in:
   - **Name**: ChefWise Premium
   - **Description**: Unlimited AI recipes, advanced meal planning, and more
   - **Pricing**: 
     - Set to **Recurring**
     - **Price**: $9.00 USD
     - **Billing period**: Monthly
4. Save the product
5. Copy the **Price ID** (starts with `price_...`)

### 1.3 Get API Keys

1. Navigate to **Developers** → **API keys**
2. Copy your **Publishable key** (starts with `pk_test_...` for test mode)
3. Copy your **Secret key** (starts with `sk_test_...` for test mode)

### 1.4 Set Up Webhooks

1. Navigate to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://your-domain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_...`)

## Step 2: Firebase Setup

### 2.1 Firebase Admin Credentials

1. In Firebase Console, go to **Project Settings** → **Service Accounts**
2. Click **Generate New Private Key**
3. Save the JSON file securely
4. Extract the following from the JSON:
   - `client_email`
   - `private_key`

## Step 3: Environment Variables

Create a `.env.local` file in your project root with the following:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (for API routes)
FIREBASE_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important Notes:**
- For `FIREBASE_PRIVATE_KEY`, make sure to keep the newlines as `\n`
- Never commit `.env.local` to version control
- Use different keys for development and production

## Step 4: Deploy and Test

### 4.1 Local Testing

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Visit `http://localhost:3000`

4. Test the subscription flow:
   - Sign in with Google
   - Navigate to `/upgrade`
   - Click "Upgrade Now"
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC

### 4.2 Webhook Testing (Local)

For local webhook testing, use Stripe CLI:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward events: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Copy the webhook signing secret from the CLI output
5. Update `STRIPE_WEBHOOK_SECRET` in `.env.local`

### 4.3 Production Deployment

1. Deploy your Next.js app to Vercel/Netlify/Firebase Hosting

2. Update Stripe webhook endpoint to your production URL:
   - `https://your-domain.com/api/stripe/webhook`

3. Switch to Stripe live mode:
   - Get live API keys from Stripe Dashboard
   - Update environment variables with live keys
   - Create a new webhook endpoint with live mode keys

4. Update Firebase environment (if using Cloud Functions):
   ```bash
   firebase functions:config:set stripe.secret_key="sk_live_..."
   ```

## Step 5: Firestore Security Rules

Ensure your Firestore security rules protect user data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Recipes
    match /recipes/{recipeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## Step 6: Testing Subscription Features

### Test Scenarios

1. **Free User Experience**:
   - Sign in
   - Generate 3 recipes (should work)
   - Try 4th recipe (should show limit message)
   - Try 7-day meal plan (should work)
   - Try 30-day meal plan (should prompt upgrade)

2. **Upgrade Flow**:
   - Click "Upgrade to Premium"
   - Complete Stripe checkout
   - Verify redirect back to app
   - Check subscription status in profile

3. **Premium User Experience**:
   - Generate unlimited recipes
   - Create 30-day meal plans
   - Access all diet filters

4. **Subscription Management**:
   - Access subscription page
   - Click "Manage Subscription"
   - Test cancellation flow
   - Verify downgrade to free tier

## Monitoring and Analytics

The app tracks the following events with Firebase Analytics:

- `view_subscription_page` - User views subscription page
- `begin_checkout` - User clicks upgrade button
- `purchase` - Successful subscription purchase
- `cancel_subscription` - User cancels subscription
- `premium_feature_attempt` - Free user attempts premium feature
- `feature_usage` - User uses a feature (with tier info)
- `access_subscription_portal` - User accesses billing portal

View these events in Firebase Console → Analytics → Events.

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is correct in Stripe Dashboard
2. Verify STRIPE_WEBHOOK_SECRET is set correctly
3. Check server logs for errors
4. Test with Stripe CLI: `stripe trigger checkout.session.completed`

### Subscription Status Not Updating

1. Check webhook handler in `/api/stripe/webhook.js`
2. Verify Firebase Admin is initialized correctly
3. Check Firestore rules allow writes to user documents
4. Review webhook event logs in Stripe Dashboard

### Payment Fails

1. Ensure Stripe is in test mode for development
2. Use Stripe test cards: https://stripe.com/docs/testing
3. Check card details are entered correctly
4. Review payment logs in Stripe Dashboard

## Support

For issues or questions:
- Review Stripe documentation: https://stripe.com/docs
- Check Firebase documentation: https://firebase.google.com/docs
- Open an issue on GitHub

## Security Best Practices

1. **Never expose secret keys** in client-side code
2. **Validate webhook signatures** to prevent fake events
3. **Use HTTPS** in production
4. **Implement rate limiting** on API endpoints
5. **Store sensitive data** in environment variables
6. **Regularly rotate** API keys
7. **Monitor failed payment attempts** for fraud

## Next Steps

After setting up subscriptions:

1. Customize pricing and features for your needs
2. Add more subscription tiers (e.g., Family plan, Business plan)
3. Implement promo codes and discounts
4. Add trial periods for new users
5. Set up email notifications for billing events
6. Create a referral program

---

**Note**: This setup uses Stripe Checkout for a hosted payment page. For a custom payment form, consider implementing Stripe Elements or Payment Element.
