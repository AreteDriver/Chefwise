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

async function logWebhookEvent(eventType, status, details = {}) {
  if (!db) return;
  try {
    await db.collection('webhook_events').add({
      eventType,
      status,
      ...details,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to log webhook event:', err);
  }
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
    await logWebhookEvent('checkout.session.completed', 'failed', {
      reason: 'missing_firebase_uid',
      stripeSessionId: session.id,
      stripeCustomerId: session.customer,
    });
    throw new Error('No Firebase UID in checkout session metadata');
  }

  if (!isValidFirebaseUID(firebaseUID)) {
    await logWebhookEvent('checkout.session.completed', 'failed', {
      reason: 'invalid_firebase_uid',
      firebaseUID,
      stripeSessionId: session.id,
    });
    throw new Error(`Invalid Firebase UID format: ${firebaseUID}`);
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

  await logWebhookEvent('checkout.session.completed', 'success', {
    firebaseUID,
    planTier,
    billingPeriod,
  });

  console.log(`User ${firebaseUID} upgraded to ${planTier} (${billingPeriod})`);
}

async function handleSubscriptionUpdate(subscription) {
  const customer = await getStripe().customers.retrieve(subscription.customer);
  const firebaseUID = customer.metadata?.firebaseUID || subscription.metadata?.firebaseUID;

  if (!firebaseUID) {
    await logWebhookEvent('subscription.updated', 'failed', {
      reason: 'missing_firebase_uid',
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer,
    });
    throw new Error('No Firebase UID in customer or subscription metadata');
  }

  if (!isValidFirebaseUID(firebaseUID)) {
    await logWebhookEvent('subscription.updated', 'failed', {
      reason: 'invalid_firebase_uid',
      firebaseUID,
      stripeSubscriptionId: subscription.id,
    });
    throw new Error(`Invalid Firebase UID format: ${firebaseUID}`);
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

  await logWebhookEvent('subscription.updated', 'success', { firebaseUID, planTier, status });

  console.log(`Subscription updated for user ${firebaseUID}: ${planTier} (${status})`);
}

async function handleSubscriptionDeleted(subscription) {
  const customer = await getStripe().customers.retrieve(subscription.customer);
  const firebaseUID = customer.metadata?.firebaseUID || subscription.metadata?.firebaseUID;

  if (!firebaseUID) {
    await logWebhookEvent('subscription.deleted', 'failed', {
      reason: 'missing_firebase_uid',
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer,
    });
    throw new Error('No Firebase UID in customer or subscription metadata');
  }

  if (!isValidFirebaseUID(firebaseUID)) {
    await logWebhookEvent('subscription.deleted', 'failed', {
      reason: 'invalid_firebase_uid',
      firebaseUID,
      stripeSubscriptionId: subscription.id,
    });
    throw new Error(`Invalid Firebase UID format: ${firebaseUID}`);
  }

  const userRef = db.collection('users').doc(firebaseUID);

  await userRef.update({
    planTier: 'free',
    subscriptionStatus: 'canceled',
    subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await logWebhookEvent('subscription.deleted', 'success', { firebaseUID });

  console.log(`Subscription canceled for user ${firebaseUID}`);
}

async function handlePaymentSucceeded(invoice) {
  const customer = await getStripe().customers.retrieve(invoice.customer);
  const firebaseUID = customer.metadata?.firebaseUID;

  if (!firebaseUID) {
    await logWebhookEvent('invoice.payment_succeeded', 'failed', {
      reason: 'missing_firebase_uid',
      stripeInvoiceId: invoice.id,
      stripeCustomerId: invoice.customer,
    });
    throw new Error('No Firebase UID in customer metadata');
  }

  if (!isValidFirebaseUID(firebaseUID)) {
    await logWebhookEvent('invoice.payment_succeeded', 'failed', {
      reason: 'invalid_firebase_uid',
      firebaseUID,
      stripeInvoiceId: invoice.id,
    });
    throw new Error(`Invalid Firebase UID format: ${firebaseUID}`);
  }

  const userRef = db.collection('users').doc(firebaseUID);

  await userRef.update({
    lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
    lastPaymentAmount: invoice.amount_paid / 100,
    paymentFailed: false,
  });

  await logWebhookEvent('invoice.payment_succeeded', 'success', {
    firebaseUID,
    amount: invoice.amount_paid / 100,
  });

  console.log(`Payment succeeded for user ${firebaseUID}: $${invoice.amount_paid / 100}`);
}

async function handlePaymentFailed(invoice) {
  const customer = await getStripe().customers.retrieve(invoice.customer);
  const firebaseUID = customer.metadata?.firebaseUID;

  if (!firebaseUID) {
    await logWebhookEvent('invoice.payment_failed', 'failed', {
      reason: 'missing_firebase_uid',
      stripeInvoiceId: invoice.id,
      stripeCustomerId: invoice.customer,
    });
    throw new Error('No Firebase UID in customer metadata');
  }

  if (!isValidFirebaseUID(firebaseUID)) {
    await logWebhookEvent('invoice.payment_failed', 'failed', {
      reason: 'invalid_firebase_uid',
      firebaseUID,
      stripeInvoiceId: invoice.id,
    });
    throw new Error(`Invalid Firebase UID format: ${firebaseUID}`);
  }

  const userRef = db.collection('users').doc(firebaseUID);

  await userRef.update({
    paymentFailed: true,
    lastPaymentFailureDate: admin.firestore.FieldValue.serverTimestamp(),
  });

  await logWebhookEvent('invoice.payment_failed', 'success', {
    firebaseUID,
    stripeInvoiceId: invoice.id,
  });

  console.log(`Payment failed for user ${firebaseUID}`);
}
