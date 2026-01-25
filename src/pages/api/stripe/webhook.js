import Stripe from 'stripe';
import { buffer } from 'micro';
import admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Firebase UID validation regex
 * UIDs are typically 20-128 alphanumeric characters
 */
const FIREBASE_UID_REGEX = /^[a-zA-Z0-9]{20,128}$/;

/**
 * Validate Firebase UID format
 */
function isValidFirebaseUID(uid) {
  return uid && typeof uid === 'string' && FIREBASE_UID_REGEX.test(uid);
}

/**
 * Get price to tier mapping (lazy-loaded to ensure env vars are available)
 */
function getPriceToTierMap() {
  return {
    [process.env.STRIPE_PRICE_PRO_MONTHLY]: 'pro',
    [process.env.STRIPE_PRICE_PRO_YEARLY]: 'pro',
    [process.env.STRIPE_PRICE_CHEF_MONTHLY]: 'chef',
    [process.env.STRIPE_PRICE_CHEF_YEARLY]: 'chef',
    // Legacy support
    [process.env.STRIPE_PREMIUM_PRICE_ID]: 'pro',
  };
}

// Initialize Firebase Admin if not already initialized
let db;
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  db = admin.firestore();
} catch (error) {
  console.error('Firebase admin initialization error:', error);
}

// Disable body parser for webhook
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if Firebase Admin is initialized
  if (!db) {
    console.error('Firebase Admin not initialized - cannot process webhook');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

/**
 * Determine plan tier from subscription price
 */
function getPlanTierFromSubscription(subscription) {
  // First check subscription metadata
  if (subscription.metadata?.planTier) {
    return subscription.metadata.planTier;
  }

  // Then check the price ID
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const priceToTier = getPriceToTierMap();

  if (priceId && priceToTier[priceId]) {
    return priceToTier[priceId];
  }

  // Default to pro for backwards compatibility
  return 'pro';
}

/**
 * Determine billing period from subscription
 */
function getBillingPeriod(subscription) {
  // Check metadata first
  if (subscription.metadata?.billingPeriod) {
    return subscription.metadata.billingPeriod;
  }

  // Determine from interval
  const interval = subscription.items?.data?.[0]?.price?.recurring?.interval;
  return interval === 'year' ? 'yearly' : 'monthly';
}

async function handleCheckoutComplete(session) {
  const firebaseUID = session.metadata?.firebaseUID;

  if (!firebaseUID) {
    console.error('No Firebase UID in session metadata');
    return;
  }

  if (!isValidFirebaseUID(firebaseUID)) {
    console.error('Invalid Firebase UID format:', firebaseUID);
    return;
  }

  // Get the subscription to determine the plan tier
  let planTier = session.metadata?.planTier || 'pro';
  let billingPeriod = session.metadata?.billingPeriod || 'monthly';

  if (session.subscription) {
    try {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      planTier = getPlanTierFromSubscription(subscription);
      billingPeriod = getBillingPeriod(subscription);
    } catch (err) {
      console.error('Error retrieving subscription:', err);
    }
  }

  const userRef = db.collection('users').doc(firebaseUID);

  await userRef.update({
    planTier,
    billingPeriod,
    stripeCustomerId: session.customer,
    stripeSubscriptionId: session.subscription,
    subscriptionStatus: 'active',
    subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`User ${firebaseUID} upgraded to ${planTier} (${billingPeriod})`);
}

async function handleSubscriptionUpdate(subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer);
  const firebaseUID = customer.metadata?.firebaseUID || subscription.metadata?.firebaseUID;

  if (!firebaseUID) {
    console.error('No Firebase UID in customer or subscription metadata');
    return;
  }

  if (!isValidFirebaseUID(firebaseUID)) {
    console.error('Invalid Firebase UID format:', firebaseUID);
    return;
  }

  const userRef = db.collection('users').doc(firebaseUID);

  const status = subscription.status;
  const isActive = status === 'active' || status === 'trialing';

  // Determine plan tier from subscription
  const planTier = isActive ? getPlanTierFromSubscription(subscription) : 'free';
  const billingPeriod = getBillingPeriod(subscription);

  await userRef.update({
    planTier,
    billingPeriod,
    subscriptionStatus: status,
    stripeSubscriptionId: subscription.id,
    subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
  });

  console.log(`Subscription updated for user ${firebaseUID}: ${planTier} (${status})`);
}

async function handleSubscriptionDeleted(subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer);
  const firebaseUID = customer.metadata?.firebaseUID || subscription.metadata?.firebaseUID;

  if (!firebaseUID) {
    console.error('No Firebase UID in customer or subscription metadata');
    return;
  }

  if (!isValidFirebaseUID(firebaseUID)) {
    console.error('Invalid Firebase UID format:', firebaseUID);
    return;
  }

  const userRef = db.collection('users').doc(firebaseUID);

  await userRef.update({
    planTier: 'free',
    subscriptionStatus: 'canceled',
    subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`Subscription canceled for user ${firebaseUID}`);
}

async function handlePaymentSucceeded(invoice) {
  const customer = await stripe.customers.retrieve(invoice.customer);
  const firebaseUID = customer.metadata?.firebaseUID;

  if (!firebaseUID) {
    console.error('No Firebase UID in customer metadata');
    return;
  }

  if (!isValidFirebaseUID(firebaseUID)) {
    console.error('Invalid Firebase UID format:', firebaseUID);
    return;
  }

  const userRef = db.collection('users').doc(firebaseUID);

  await userRef.update({
    lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
    lastPaymentAmount: invoice.amount_paid / 100,
    paymentFailed: false,
  });

  console.log(`Payment succeeded for user ${firebaseUID}: $${invoice.amount_paid / 100}`);
}

async function handlePaymentFailed(invoice) {
  const customer = await stripe.customers.retrieve(invoice.customer);
  const firebaseUID = customer.metadata?.firebaseUID;

  if (!firebaseUID) {
    console.error('No Firebase UID in customer metadata');
    return;
  }

  if (!isValidFirebaseUID(firebaseUID)) {
    console.error('Invalid Firebase UID format:', firebaseUID);
    return;
  }

  const userRef = db.collection('users').doc(firebaseUID);

  await userRef.update({
    paymentFailed: true,
    lastPaymentFailureDate: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`Payment failed for user ${firebaseUID}`);
}
