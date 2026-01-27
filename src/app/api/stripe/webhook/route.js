import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { processWebhookEvent } from './handler';

let _stripe;
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
}

// Initialize Firebase Admin via handler module side-effect import
import './handler';

export async function POST(request) {
  // Note: db initialization happens via handler.js import side-effect
  const buf = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;

  try {
    event = getStripe().webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    await processWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
