import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
});

export interface CreateCheckoutSessionParams {
  customerEmail: string;
  tier: 'starter' | 'pro' | 'business';
  userId: number;
  successUrl: string;
  cancelUrl: string;
}

// Pricing configuration (in cents) - 50% OFF SALE PRICES
export const PRICING = {
  starter: {
    setupFee: 25000, // $250 (was $500)
    monthlyPrice: 4900, // $49 (was $99)
  },
  pro: {
    setupFee: 25000, // $250 (was $500)
    monthlyPrice: 9900, // $99 (was $199)
  },
  business: {
    setupFee: 25000, // $250 (was $500)
    monthlyPrice: 14900, // $149 (was $299)
  },
};

/**
 * Create a Stripe Checkout session for setup fee + first month
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<Stripe.Checkout.Session> {
  const { customerEmail, tier, userId, successUrl, cancelUrl } = params;
  const pricing = PRICING[tier];

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: customerEmail,
    client_reference_id: userId.toString(),
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    metadata: {
      userId: userId.toString(),
      tier,
      customerEmail,
    },
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan - Setup Fee`,
            description: 'One-time setup and configuration fee',
          },
          unit_amount: pricing.setupFee,
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan - First Month`,
            description: 'Monthly subscription fee',
          },
          unit_amount: pricing.monthlyPrice,
        },
        quantity: 1,
      },
    ],
  });

  return session;
}

/**
 * Retrieve a checkout session by ID
 */
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  return await stripe.checkout.sessions.retrieve(sessionId);
}

/**
 * Create a Stripe customer
 */
export async function createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
  return await stripe.customers.create({
    email,
    name,
  });
}

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

export { stripe };
