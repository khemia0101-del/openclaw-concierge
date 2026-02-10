import { Request, Response } from 'express';
import { constructWebhookEvent, PRICING, getRenewalDate } from '../services/stripe';
import * as db from '../db';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

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

  let event;
  try {
    event = constructWebhookEvent(req.body, signature, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Signature verified — acknowledge receipt immediately so Stripe doesn't retry.
  // Process the event asynchronously.
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

async function processWebhookEvent(event: any) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
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
        else if (session.customer?.id) stripeCustomerId = session.customer.id;

        let stripeSubscriptionId: string | null = null;
        if (typeof session.subscription === 'string') stripeSubscriptionId = session.subscription;
        else if (session.subscription?.id) stripeSubscriptionId = session.subscription.id;

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
          stripeChargeId: session.payment_intent as string,
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
      const paymentIntent = event.data.object as any;
      console.error(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`);
      break;
    }

    default:
      break;
  }
}
