import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Stripe Price IDs for each plan and billing period
 * These should be set in environment variables after creating products in Stripe Dashboard
 */
const PRICE_IDS = {
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
  chef: {
    monthly: process.env.STRIPE_PRICE_CHEF_MONTHLY,
    yearly: process.env.STRIPE_PRICE_CHEF_YEARLY,
  },
  // Legacy support
  premium: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || process.env.STRIPE_PREMIUM_PRICE_ID,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, userEmail, planId, billingPeriod = 'monthly', priceId } = req.body;

    if (!userId || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Determine the price ID
    let selectedPriceId = priceId;

    if (!selectedPriceId && planId) {
      // Normalize plan ID (handle legacy 'premium' as 'pro')
      const normalizedPlanId = planId === 'premium' ? 'pro' : planId;

      if (!PRICE_IDS[normalizedPlanId]) {
        return res.status(400).json({ error: 'Invalid plan selected' });
      }

      selectedPriceId = PRICE_IDS[normalizedPlanId][billingPeriod];
    }

    // Fallback to legacy price ID if none found
    if (!selectedPriceId) {
      selectedPriceId = process.env.STRIPE_PREMIUM_PRICE_ID;
    }

    if (!selectedPriceId) {
      return res.status(400).json({
        error: 'Price ID not configured. Please contact support.',
      });
    }

    // Validate price ID format (Stripe price IDs start with 'price_')
    if (!selectedPriceId.startsWith('price_')) {
      console.error('Invalid Stripe price ID format:', selectedPriceId);
      return res.status(500).json({
        error: 'Price configuration error. Please contact support.',
      });
    }

    // Create or retrieve Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];

      // Update metadata if needed
      if (!customer.metadata.firebaseUID) {
        customer = await stripe.customers.update(customer.id, {
          metadata: {
            firebaseUID: userId,
          },
        });
      }
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          firebaseUID: userId,
        },
      });
    }

    // Determine the plan tier from the price ID for metadata
    let planTier = 'pro';
    if (selectedPriceId === PRICE_IDS.chef?.monthly || selectedPriceId === PRICE_IDS.chef?.yearly) {
      planTier = 'chef';
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/upgrade?canceled=true`,
      metadata: {
        firebaseUID: userId,
        planTier,
        billingPeriod,
      },
      subscription_data: {
        metadata: {
          firebaseUID: userId,
          planTier,
          billingPeriod,
        },
      },
      allow_promotion_codes: true,
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
}
