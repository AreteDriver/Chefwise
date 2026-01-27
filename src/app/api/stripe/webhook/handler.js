import Stripe from 'stripe';
import { buffer } from 'micro';
import admin from 'firebase-admin';

let _stripe;
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
}

const FIREBASE_UID_REGEX = /^[a-zA-Z0-9]{20,128}$/;

function isValidFirebaseUID(uid) {
  return uid && typeof uid === 'string' && FIREBASE_UID_REGEX.test(uid);
}

function getPriceToTierMap() {
  return {
    [process.env.STRIPE_PRICE_PRO_MONTHLY]: 'pro',
    [process.env.STRIPE_PRICE_PRO_YEARLY]: 'pro',
    [process.env.STRIPE_PRICE_CHEF_MONTHLY]: 'chef',
    [process.env.STRIPE_PRICE_CHEF_YEARLY]: 'chef',
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

// Disable body parser for webhook (Pages Router compat)
export const config = {
  api: {
    bodyParser: false,
  },
};

// Pages Router compatible handler (used by tests)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!db) {
    console.error('Firebase Admin not initialized - cannot process webhook');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = getStripe().webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await processWebhookEvent(event);
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

export async function processWebhookEvent(event) {
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
}

function getPlanTierFromSubscription(subscription) {
  if (subscription.metadata?.planTier) {
    return subscription.metadata.planTier;
  }

  const priceId = subscription.items?.data?.[0]?.price?.id;
  const priceToTier = getPriceToTierMap();

  if (priceId && priceToTier[priceId]) {
    return priceToTier[priceId];
  }

  return 'pro';
}

function getBillingPeriod(subscription) {
  if (subscription.metadata?.billingPeriod) {
    return subscription.metadata.billingPeriod;
  }

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

  let planTier = session.metadata?.planTier || 'pro';
  let billingPeriod = session.metadata?.billingPeriod || 'monthly';

  if (session.subscription) {
    try {
      const subscription = await getStripe().subscriptions.retrieve(session.subscription);
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
  const customer = await getStripe().customers.retrieve(subscription.customer);
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
  const customer = await getStripe().customers.retrieve(subscription.customer);
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
  const customer = await getStripe().customers.retrieve(invoice.customer);
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
  const customer = await getStripe().customers.retrieve(invoice.customer);
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
