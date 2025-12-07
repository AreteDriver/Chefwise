import Stripe from 'stripe';
import { buffer } from 'micro';
import admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
  // Don't initialize db if admin fails
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

async function handleCheckoutComplete(session) {
  const firebaseUID = session.metadata.firebaseUID;
  
  if (!firebaseUID) {
    console.error('No Firebase UID in session metadata');
    return;
  }

  const userRef = db.collection('users').doc(firebaseUID);
  
  await userRef.update({
    planTier: 'premium',
    stripeCustomerId: session.customer,
    stripeSubscriptionId: session.subscription,
    subscriptionStatus: 'active',
    subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`User ${firebaseUID} upgraded to premium`);
}

async function handleSubscriptionUpdate(subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer);
  const firebaseUID = customer.metadata.firebaseUID;

  if (!firebaseUID) {
    console.error('No Firebase UID in customer metadata');
    return;
  }

  const userRef = db.collection('users').doc(firebaseUID);
  
  const status = subscription.status;
  const planTier = status === 'active' || status === 'trialing' ? 'premium' : 'free';

  await userRef.update({
    planTier,
    subscriptionStatus: status,
    stripeSubscriptionId: subscription.id,
    subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
  });

  console.log(`Subscription updated for user ${firebaseUID}: ${status}`);
}

async function handleSubscriptionDeleted(subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer);
  const firebaseUID = customer.metadata.firebaseUID;

  if (!firebaseUID) {
    console.error('No Firebase UID in customer metadata');
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
  const firebaseUID = customer.metadata.firebaseUID;

  if (!firebaseUID) {
    console.error('No Firebase UID in customer metadata');
    return;
  }

  const userRef = db.collection('users').doc(firebaseUID);
  
  await userRef.update({
    lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
    lastPaymentAmount: invoice.amount_paid / 100,
  });

  console.log(`Payment succeeded for user ${firebaseUID}`);
}

async function handlePaymentFailed(invoice) {
  const customer = await stripe.customers.retrieve(invoice.customer);
  const firebaseUID = customer.metadata.firebaseUID;

  if (!firebaseUID) {
    console.error('No Firebase UID in customer metadata');
    return;
  }

  const userRef = db.collection('users').doc(firebaseUID);
  
  await userRef.update({
    paymentFailed: true,
    lastPaymentFailureDate: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`Payment failed for user ${firebaseUID}`);
}
