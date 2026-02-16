import { Request, Response } from 'express';
import { constructWebhookEvent, PRICING, getRenewalDate } from '../services/stripe';
import * as db from '../db';
import Stripe from 'stripe';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Valid webhook event types we handle
const VALID_EVENT_TYPES = [
  'checkout.session.completed',
  'payment_intent.payment_failed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
] as const;

type ValidEventType = typeof VALID_EVENT_TYPES[number];

function isValidEventType(type: string): type is ValidEventType {
  return VALID_EVENT_TYPES.includes(type as ValidEventType);
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'] as string | undefined;

  if (!signature) {
    console.error('[Stripe Webhook] Missing stripe-signature header');
    return res.status(400).json({ error: 'Missing signature' });
  }

  if (!WEBHOOK_SECRET) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(req.body, signature, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Validate event type
  if (!isValidEventType(event.type)) {
    console.log(`[Stripe Webhook] Ignoring unhandled event type: ${event.type}`);
    return res.status(200).json({ received: true, ignored: true });
  }

  // Signature verified and event type validated — acknowledge receipt immediately
  res.status(200).json({ received: true });

  // Handle test events — already responded
  if (event.id.startsWith('evt_test_')) {
    return;
  }

  // Process event in background (response already sent)
  processWebhookEvent(event).catch((error) => {
    console.error('[Stripe Webhook] Background processing failed:', error);
  });
}

async function processWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = parseInt(session.metadata?.userId || session.client_reference_id || '0');
      const tier = session.metadata?.tier as 'starter' | 'pro' | 'business';

      if (!userId || !tier || userId > 2147483647) {
        console.error('[Stripe Webhook] Missing or invalid userId/tier in metadata', {
          userId,
          tier,
          sessionId: session.id,
        });
        return;
      }

      // Idempotent: only create subscription if one doesn't already exist for this user
      const existing = await db.getSubscriptionByUserId(userId);
      if (!existing) {
        const monthlyPriceValue = (PRICING[tier].monthlyPrice / 100).toFixed(2);

        let stripeCustomerId: string | null = null;
        if (typeof session.customer === 'string') stripeCustomerId = session.customer;
        else if (session.customer && 'id' in session.customer) stripeCustomerId = session.customer.id;

        let stripeSubscriptionId: string | null = null;
        if (typeof session.subscription === 'string') stripeSubscriptionId = session.subscription;
        else if (session.subscription && 'id' in session.subscription) stripeSubscriptionId = session.subscription.id;

        const renewalDate = await getRenewalDate(stripeSubscriptionId);

        await db.createSubscriptionRaw({
          userId,
          tier,
          status: 'active',
          setupFeePaid: true,
          stripeCustomerId,
          stripeSubscriptionId,
          monthlyPrice: monthlyPriceValue,
          startDate: new Date(),
          renewalDate,
        });

        await db.createBillingRecord({
          userId,
          type: 'setup_fee',
          amount: (PRICING[tier].setupFee / 100).toFixed(2),
          status: 'completed',
          stripeChargeId: session.payment_intent as string | undefined,
        });

        await db.createBillingRecord({
          userId,
          type: 'monthly_subscription',
          amount: monthlyPriceValue,
          status: 'completed',
        });

        // Update lead status
        const email = session.metadata?.customerEmail || session.customer_email || '';
        if (email) {
          await db.updateLeadStatus(email, 'paid', session.id, userId);
        }

        // Create affiliate commission if this user was referred
        const newSub = await db.getSubscriptionByUserId(userId);
        if (newSub) {
          await db.createAffiliateCommission(userId, newSub.id, null, null);
        }
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.error(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`, {
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        error: paymentIntent.last_payment_error?.message,
      });
      break;
    }

    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`[Stripe Webhook] Subscription created: ${subscription.id}`);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`[Stripe Webhook] Subscription updated: ${subscription.id}`, {
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`[Stripe Webhook] Subscription cancelled: ${subscription.id}`);
      // TODO: Update subscription status in database
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[Stripe Webhook] Invoice payment succeeded: ${invoice.id}`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      console.error(`[Stripe Webhook] Invoice payment failed: ${invoice.id}`, {
        amountDue: invoice.amount_due,
        attemptCount: invoice.attempt_count,
      });
      break;
    }

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${(event as any).type}`);
  }
}
